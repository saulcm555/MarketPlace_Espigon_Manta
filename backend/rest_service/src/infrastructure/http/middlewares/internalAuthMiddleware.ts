/**
 * Middleware de autenticación para servicios internos (n8n, otros microservicios)
 * Verifica el INTERNAL_API_KEY para permitir llamadas desde n8n workflows
 */

import { Request, Response, NextFunction } from "express";

/**
 * Middleware que valida el token de servicio interno
 * Acepta el token en header Authorization (Bearer) o X-Internal-Api-Key
 */
export const internalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

  if (!INTERNAL_API_KEY) {
    console.error("❌ [InternalAuth] INTERNAL_API_KEY no está configurado en variables de entorno");
    res.status(500).json({ 
      success: false,
      error: "Configuración de autenticación interna faltante" 
    });
    return;
  }

  // Intentar obtener token desde header Authorization (Bearer)
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7); // Remover "Bearer "
  }

  // Si no está en Authorization, intentar desde X-Internal-Api-Key
  if (!token) {
    token = req.headers["x-internal-api-key"] as string;
  }

  // Validar que el token coincida
  if (token === INTERNAL_API_KEY) {
    console.log(`✅ [InternalAuth] Llamada interna autenticada: ${req.method} ${req.path}`);
    next();
  } else {
    console.warn(`⚠️ [InternalAuth] Token inválido o faltante en ${req.method} ${req.path}`);
    res.status(403).json({ 
      success: false,
      error: "Acceso denegado - Token de servicio interno inválido o faltante",
      hint: "Incluye header: Authorization: Bearer <INTERNAL_API_KEY> o X-Internal-Api-Key: <INTERNAL_API_KEY>"
    });
  }
};
