/**
 * Configuración de JWT
 */

import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { env } from "./env";

// Interfaz para el payload del Access Token
export interface AccessTokenPayload {
  jti: string;           // JWT ID único
  sub: string;           // User ID (UUID)
  email: string;
  role: "client" | "seller" | "admin";
  reference_id: number;  // ID en tabla original (id_client, id_seller, id_admin)
  name: string;
}

// Interfaz para el payload del Refresh Token
export interface RefreshTokenPayload {
  jti: string;           // JWT ID único
  sub: string;           // User ID (UUID)
  type: "refresh";
}

// Opciones para firmar Access Token
export const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

// Opciones para firmar Refresh Token
export const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  issuer: env.JWT_ISSUER,
};

// Opciones para verificar Access Token
export const verifyAccessOptions: VerifyOptions = {
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

// Opciones para verificar Refresh Token
export const verifyRefreshOptions: VerifyOptions = {
  issuer: env.JWT_ISSUER,
};

/**
 * Generar Access Token
 */
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, accessTokenOptions);
};

/**
 * Generar Refresh Token
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, refreshTokenOptions);
};

/**
 * Verificar Access Token
 */
export const verifyAccessToken = (token: string): AccessTokenPayload & jwt.JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET, verifyAccessOptions) as AccessTokenPayload & jwt.JwtPayload;
};

/**
 * Verificar Refresh Token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload & jwt.JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET, verifyRefreshOptions) as RefreshTokenPayload & jwt.JwtPayload;
};

/**
 * Decodificar token sin verificar (para obtener exp de tokens expirados)
 */
export const decodeToken = (token: string): jwt.JwtPayload | null => {
  return jwt.decode(token) as jwt.JwtPayload | null;
};
