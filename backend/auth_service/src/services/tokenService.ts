/**
 * Token Service - Generación y validación de JWT
 */

import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { env } from "../config/env";
import { User } from "../models/User";

// Tipos de payload
export interface AccessTokenPayload {
  jti: string;          // JWT ID único
  sub: string;          // User ID
  email: string;
  role: "client" | "seller" | "admin";
  reference_id: number; // id_client, id_seller, o id_admin
  name: string;
  iss: string;          // Issuer
  aud: string;          // Audience
}

export interface RefreshTokenPayload {
  jti: string;
  sub: string;
  type: "refresh";
  iss: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number; // segundos
}

export interface DecodedToken extends AccessTokenPayload {
  iat: number;
  exp: number;
}

/**
 * Genera un par de tokens (access + refresh)
 */
export function generateTokenPair(user: User): TokenPair {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  // Access Token - Corta duración (15 min por defecto)
  const accessPayload: AccessTokenPayload = {
    jti: accessJti,
    sub: user.id,
    email: user.email,
    role: user.role,
    reference_id: user.reference_id,
    name: user.name || "",
    iss: env.JWT_ISSUER,
    aud: env.JWT_AUDIENCE,
  };

  const access_token = jwt.sign(accessPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  // Refresh Token - Larga duración (7 días por defecto)
  const refreshPayload: RefreshTokenPayload = {
    jti: refreshJti,
    sub: user.id,
    type: "refresh",
    iss: env.JWT_ISSUER,
  };

  const refresh_token = jwt.sign(refreshPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  // Calcular expires_in en segundos
  const expiresIn = parseExpiresIn(env.JWT_ACCESS_EXPIRES_IN);

  return {
    access_token,
    refresh_token,
    expires_in: expiresIn,
  };
}

/**
 * Verificar y decodificar un Access Token
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenError("TOKEN_EXPIRED", "El token ha expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenError("INVALID_TOKEN", "Token inválido");
    }
    throw error;
  }
}

/**
 * Verificar y decodificar un Refresh Token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload & { iat: number; exp: number } {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
    }) as RefreshTokenPayload & { iat: number; exp: number };

    if (decoded.type !== "refresh") {
      throw new TokenError("INVALID_TOKEN_TYPE", "No es un refresh token");
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenError("REFRESH_TOKEN_EXPIRED", "El refresh token ha expirado");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenError("INVALID_REFRESH_TOKEN", "Refresh token inválido");
    }
    throw error;
  }
}

/**
 * Generar hash SHA256 de un token (para almacenar en BD)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Calcular fecha de expiración de refresh token
 */
export function getRefreshTokenExpiration(): Date {
  const seconds = parseExpiresIn(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + seconds * 1000);
}

/**
 * Extraer el JTI de un token sin verificarlo completamente
 */
export function extractJti(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as { jti?: string } | null;
    return decoded?.jti || null;
  } catch {
    return null;
  }
}

/**
 * Extraer la fecha de expiración de un token
 */
export function extractExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convertir string de expiración a segundos
 * Ej: "15m" -> 900, "7d" -> 604800
 */
function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900; // Default: 15 minutos
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s": return value;
    case "m": return value * 60;
    case "h": return value * 60 * 60;
    case "d": return value * 60 * 60 * 24;
    default: return 900;
  }
}

/**
 * Error personalizado para tokens
 */
export class TokenError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "TokenError";
  }
}
