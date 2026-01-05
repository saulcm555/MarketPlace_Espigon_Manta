/**
 * Auth Service - Lógica de negocio de autenticación
 */

import * as bcrypt from "bcrypt";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { RevokedToken } from "../models/RevokedToken";
import { env } from "../config/env";
import {
  generateTokenPair,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiration,
  extractJti,
  extractExpiration,
  TokenPair,
  TokenError,
} from "./tokenService";

// Repositories
const userRepository = () => AppDataSource.getRepository(User);
const refreshTokenRepository = () => AppDataSource.getRepository(RefreshToken);
const revokedTokenRepository = () => AppDataSource.getRepository(RevokedToken);

// ============================================
// TIPOS
// ============================================

export interface RegisterData {
  email: string;
  password: string;
  role: "client" | "seller" | "admin";
  reference_id: number;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    reference_id: number;
    name: string;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface DeviceInfo {
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
}

// ============================================
// REGISTRO
// ============================================

export async function register(data: RegisterData): Promise<AuthResponse> {
  const repo = userRepository();

  // Verificar si el email ya existe
  const existingUser = await repo.findOne({ where: { email: data.email } });
  if (existingUser) {
    throw new AuthError("EMAIL_EXISTS", "El email ya está registrado");
  }

  // Hash del password
  const password_hash = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

  // Crear usuario
  const user = repo.create({
    email: data.email,
    password_hash,
    role: data.role,
    reference_id: data.reference_id,
    name: data.name || "",
    is_active: true,
    email_verified: false,
  });

  await repo.save(user);

  // Generar tokens
  const tokens = generateTokenPair(user);

  // Guardar refresh token
  await saveRefreshToken(user.id, tokens.refresh_token);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      reference_id: user.reference_id,
      name: user.name,
    },
    ...tokens,
  };
}

// ============================================
// LOGIN
// ============================================

export async function login(data: LoginData, deviceInfo?: DeviceInfo): Promise<AuthResponse> {
  const repo = userRepository();

  // Buscar usuario por email
  const user = await repo.findOne({ where: { email: data.email } });

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "Credenciales inválidas");
  }

  // Verificar si la cuenta está bloqueada
  if (user.locked_until && user.locked_until > new Date()) {
    const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
    throw new AuthError(
      "ACCOUNT_LOCKED",
      `Cuenta bloqueada. Intente nuevamente en ${minutesLeft} minutos`
    );
  }

  // Verificar si la cuenta está activa
  if (!user.is_active) {
    throw new AuthError("ACCOUNT_INACTIVE", "La cuenta está desactivada");
  }

  // Verificar password
  const isValidPassword = await bcrypt.compare(data.password, user.password_hash);

  if (!isValidPassword) {
    // Incrementar intentos fallidos
    await incrementLoginAttempts(user);
    throw new AuthError("INVALID_CREDENTIALS", "Credenciales inválidas");
  }

  // Login exitoso - resetear intentos
  user.login_attempts = 0;
  user.locked_until = null;
  user.last_login = new Date();
  await repo.save(user);

  // Generar tokens
  const tokens = generateTokenPair(user);

  // Guardar refresh token
  await saveRefreshToken(user.id, tokens.refresh_token, deviceInfo);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      reference_id: user.reference_id,
      name: user.name,
    },
    ...tokens,
  };
}

// ============================================
// LOGOUT
// ============================================

export async function logout(
  accessToken: string,
  refreshToken: string,
  userId: string,
  logoutAllDevices: boolean = false
): Promise<void> {
  // 1. Revocar el access token actual (agregarlo a blacklist)
  const jti = extractJti(accessToken);
  const exp = extractExpiration(accessToken);

  if (jti && exp) {
    await revokeAccessToken(jti, userId, "logout", exp);
  }

  // 2. Revocar el refresh token
  const refreshHash = hashToken(refreshToken);
  await refreshTokenRepository().update(
    { token_hash: refreshHash, user_id: userId },
    { is_revoked: true, revoked_at: new Date() }
  );

  // 3. Si logout de todos los dispositivos, revocar todos los refresh tokens
  if (logoutAllDevices) {
    await refreshTokenRepository().update(
      { user_id: userId, is_revoked: false },
      { is_revoked: true, revoked_at: new Date() }
    );
  }
}

// ============================================
// REFRESH TOKEN
// ============================================

export async function refreshTokens(refreshToken: string, deviceInfo?: DeviceInfo): Promise<TokenPair> {
  // 1. Verificar el refresh token
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthError("INVALID_REFRESH_TOKEN", "Refresh token inválido o expirado");
  }

  // 2. Verificar que existe en BD y no está revocado
  const tokenHash = hashToken(refreshToken);
  const storedToken = await refreshTokenRepository().findOne({
    where: { token_hash: tokenHash, user_id: decoded.sub },
  });

  if (!storedToken) {
    throw new AuthError("INVALID_REFRESH_TOKEN", "Refresh token no encontrado");
  }

  if (storedToken.is_revoked) {
    throw new AuthError("REFRESH_TOKEN_REVOKED", "Refresh token ha sido revocado");
  }

  if (storedToken.isExpired()) {
    throw new AuthError("REFRESH_TOKEN_EXPIRED", "Refresh token ha expirado");
  }

  // 3. Obtener usuario
  const user = await userRepository().findOne({ where: { id: decoded.sub } });
  if (!user || !user.is_active) {
    throw new AuthError("USER_NOT_FOUND", "Usuario no encontrado o inactivo");
  }

  // 4. Revocar el refresh token actual (rotación de tokens)
  storedToken.is_revoked = true;
  storedToken.revoked_at = new Date();
  await refreshTokenRepository().save(storedToken);

  // 5. Generar nuevos tokens
  const newTokens = generateTokenPair(user);

  // 6. Guardar nuevo refresh token
  await saveRefreshToken(user.id, newTokens.refresh_token, deviceInfo);

  return newTokens;
}

// ============================================
// GET ME (Usuario actual)
// ============================================

export async function getMe(userId: string): Promise<User | null> {
  return userRepository().findOne({
    where: { id: userId },
    select: ["id", "email", "role", "reference_id", "name", "is_active", "email_verified", "created_at"],
  });
}

// ============================================
// VERIFICAR SI TOKEN ESTÁ REVOCADO
// ============================================

export async function isTokenRevoked(jti: string): Promise<boolean> {
  const revoked = await revokedTokenRepository().findOne({
    where: { token_jti: jti },
  });
  return !!revoked;
}

// ============================================
// HELPERS PRIVADOS
// ============================================

async function saveRefreshToken(
  userId: string,
  refreshToken: string,
  deviceInfo?: DeviceInfo
): Promise<void> {
  const repo = refreshTokenRepository();
  
  const token = repo.create({
    user_id: userId,
    token_hash: hashToken(refreshToken),
    device_info: deviceInfo?.device_info || null,
    ip_address: deviceInfo?.ip_address || null,
    user_agent: deviceInfo?.user_agent || null,
    expires_at: getRefreshTokenExpiration(),
    is_revoked: false,
  });

  await repo.save(token);
}

async function revokeAccessToken(
  jti: string,
  userId: string,
  reason: "logout" | "password_change" | "admin_action" | "suspicious_activity",
  originalExp: Date
): Promise<void> {
  const repo = revokedTokenRepository();

  // Verificar si ya está revocado
  const existing = await repo.findOne({ where: { token_jti: jti } });
  if (existing) return;

  const revokedToken = repo.create({
    token_jti: jti,
    user_id: userId,
    reason,
    original_exp: originalExp,
  });

  await repo.save(revokedToken);
}

async function incrementLoginAttempts(user: User): Promise<void> {
  const repo = userRepository();
  
  user.login_attempts += 1;

  // Bloquear cuenta después de 5 intentos fallidos
  if (user.login_attempts >= 5) {
    user.locked_until = new Date(Date.now() + env.RATE_LIMIT_LOGIN_BLOCK_DURATION * 1000);
  }

  await repo.save(user);
}

// ============================================
// ERROR PERSONALIZADO
// ============================================

export class AuthError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 401) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AuthError";
  }
}
