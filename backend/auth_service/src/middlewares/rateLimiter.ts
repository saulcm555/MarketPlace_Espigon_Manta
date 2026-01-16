/**
 * Rate Limiter Middleware
 * Protege endpoints sensibles contra ataques de fuerza bruta
 */

import { Request, Response, NextFunction } from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { env } from "../config/env";

// Rate limiter para login
const loginLimiter = new RateLimiterMemory({
  points: env.RATE_LIMIT_LOGIN_POINTS,      // Intentos permitidos
  duration: env.RATE_LIMIT_LOGIN_DURATION,   // Por X segundos
  blockDuration: env.RATE_LIMIT_LOGIN_BLOCK_DURATION, // Bloqueo en segundos
});

// Rate limiter para registro
const registerLimiter = new RateLimiterMemory({
  points: env.RATE_LIMIT_REGISTER_POINTS,
  duration: env.RATE_LIMIT_REGISTER_DURATION,
  blockDuration: env.RATE_LIMIT_REGISTER_BLOCK_DURATION,
});

// Rate limiter para refresh token
const refreshLimiter = new RateLimiterMemory({
  points: 30,    // 30 intentos
  duration: 60,  // por minuto
  blockDuration: 60,
});

/**
 * Middleware de rate limiting para login
 */
export async function rateLimitLogin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    await loginLimiter.consume(key);
    next();
  } catch (rateLimiterRes: any) {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || env.RATE_LIMIT_LOGIN_BLOCK_DURATION;
    
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: `Demasiados intentos de login. Intente nuevamente en ${retryAfter} segundos`,
      code: "RATE_LIMIT_EXCEEDED",
      retry_after: retryAfter,
    });
  }
}

/**
 * Middleware de rate limiting para registro
 */
export async function rateLimitRegister(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    await registerLimiter.consume(key);
    next();
  } catch (rateLimiterRes: any) {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || env.RATE_LIMIT_REGISTER_BLOCK_DURATION;
    
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: `Demasiados intentos de registro. Intente nuevamente en ${retryAfter} segundos`,
      code: "RATE_LIMIT_EXCEEDED",
      retry_after: retryAfter,
    });
  }
}

/**
 * Middleware de rate limiting para refresh token
 */
export async function rateLimitRefresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    await refreshLimiter.consume(key);
    next();
  } catch (rateLimiterRes: any) {
    const retryAfter = Math.ceil(rateLimiterRes.msBeforeNext / 1000) || 60;
    
    res.set("Retry-After", String(retryAfter));
    res.status(429).json({
      error: `Demasiados intentos de refresh. Intente nuevamente en ${retryAfter} segundos`,
      code: "RATE_LIMIT_EXCEEDED",
      retry_after: retryAfter,
    });
  }
}

/**
 * Resetear límites (útil después de login exitoso)
 */
export async function resetLoginLimit(ip: string): Promise<void> {
  try {
    await loginLimiter.delete(ip);
  } catch {
    // Ignorar errores
  }
}
