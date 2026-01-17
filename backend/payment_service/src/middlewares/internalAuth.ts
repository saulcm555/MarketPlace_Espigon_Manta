/**
 * Internal API Key Authentication Middleware
 * 
 * Protege endpoints internos que solo pueden ser llamados
 * por otros servicios (ej: MCP, otros microservicios).
 * 
 * Requiere header: X-Internal-Api-Key
 * 
 * @module middlewares/internalAuth
 */

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Middleware que valida el API Key interno para comunicación service-to-service
 * 
 * @example
 * router.post('/process', internalAuthMiddleware, async (req, res) => {...});
 */
export function internalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-internal-api-key'] as string;

  // Verificar que el header está presente
  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Header X-Internal-Api-Key es requerido',
      code: 'MISSING_API_KEY'
    });
    return;
  }

  // Verificar que el API Key es válido
  if (!env.INTERNAL_API_KEY) {
    console.error('⚠️ [InternalAuth] INTERNAL_API_KEY no está configurada en el servidor');
    res.status(500).json({
      error: 'Server Configuration Error',
      message: 'Autenticación interna no configurada',
      code: 'AUTH_NOT_CONFIGURED'
    });
    return;
  }

  // Comparar API Keys (timing-safe comparison)
  const isValid = timingSafeEqual(apiKey, env.INTERNAL_API_KEY);

  if (!isValid) {
    console.warn(`⚠️ [InternalAuth] API Key inválida desde ${req.ip}`);
    res.status(403).json({
      error: 'Forbidden',
      message: 'API Key inválida',
      code: 'INVALID_API_KEY'
    });
    return;
  }

  // API Key válida, continuar
  console.log(`✅ [InternalAuth] Request autorizado desde ${req.ip}`);
  next();
}

/**
 * Comparación segura contra timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Middleware opcional: permite requests sin API Key en desarrollo
 * pero lo requiere en producción
 */
export function internalAuthOptionalMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.headers['x-internal-api-key'] as string;

  // En desarrollo, permitir sin API Key
  if (env.NODE_ENV === 'development' && !apiKey) {
    console.log('⚠️ [InternalAuth] Modo desarrollo: permitiendo request sin API Key');
    next();
    return;
  }

  // En producción o si hay API Key, validar normalmente
  internalAuthMiddleware(req, res, next);
}
