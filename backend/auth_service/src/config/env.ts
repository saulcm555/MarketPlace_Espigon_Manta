/**
 * Configuración de Variables de Entorno
 */

import dotenv from "dotenv";
dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || "4001", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_USERNAME: process.env.DB_USERNAME || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_DATABASE: process.env.DB_DATABASE || "marketplace_espigon",
  DB_SCHEMA: process.env.DB_SCHEMA || "auth",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "default-secret-change-in-production",
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  JWT_ISSUER: process.env.JWT_ISSUER || "auth-service",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || "marketplace-espigon",

  // Rate Limiting
  RATE_LIMIT_LOGIN_POINTS: parseInt(process.env.RATE_LIMIT_LOGIN_POINTS || "10", 10),
  RATE_LIMIT_LOGIN_DURATION: parseInt(process.env.RATE_LIMIT_LOGIN_DURATION || "60", 10),
  RATE_LIMIT_LOGIN_BLOCK_DURATION: parseInt(process.env.RATE_LIMIT_LOGIN_BLOCK_DURATION || "300", 10),
  
  RATE_LIMIT_REGISTER_POINTS: parseInt(process.env.RATE_LIMIT_REGISTER_POINTS || "5", 10),
  RATE_LIMIT_REGISTER_DURATION: parseInt(process.env.RATE_LIMIT_REGISTER_DURATION || "60", 10),
  RATE_LIMIT_REGISTER_BLOCK_DURATION: parseInt(process.env.RATE_LIMIT_REGISTER_BLOCK_DURATION || "600", 10),

  // Redis (opcional)
  REDIS_URL: process.env.REDIS_URL,

  // REST Service
  REST_SERVICE_URL: process.env.REST_SERVICE_URL || "http://localhost:3000",

  // Bcrypt
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
};

// Validar variables críticas en producción
if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET === "default-secret-change-in-production") {
    throw new Error("JWT_SECRET debe ser configurado en producción");
  }
}
