/**
 * Auth Middleware - Verificación de JWT para rutas protegidas
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenError, DecodedToken } from "../services/tokenService";
import { isTokenRevoked } from "../services/authService";

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Middleware que verifica el JWT y agrega user al request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: "No se proporcionó token de autenticación",
        code: "NO_TOKEN",
      });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      res.status(401).json({
        error: "Formato de autorización inválido. Use: Bearer <token>",
        code: "INVALID_AUTH_FORMAT",
      });
      return;
    }

    const token = parts[1];

    // Verificar token
    const decoded = verifyAccessToken(token);

    // Verificar si está en blacklist
    const revoked = await isTokenRevoked(decoded.jti);
    if (revoked) {
      res.status(401).json({
        error: "El token ha sido revocado",
        code: "TOKEN_REVOKED",
      });
      return;
    }

    // Agregar usuario al request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof TokenError) {
      res.status(401).json({
        error: error.message,
        code: error.code,
      });
      return;
    }

    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      error: "Error interno de autenticación",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Middleware opcional - No falla si no hay token, solo agrega user si existe
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      next();
      return;
    }

    const token = parts[1];

    try {
      const decoded = verifyAccessToken(token);
      const revoked = await isTokenRevoked(decoded.jti);
      
      if (!revoked) {
        req.user = decoded;
      }
    } catch {
      // Ignorar errores de token, continuar sin user
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Middleware para verificar roles específicos
 */
export function requireRole(...allowedRoles: Array<"client" | "seller" | "admin">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "No autenticado",
        code: "UNAUTHORIZED",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "No tienes permiso para acceder a este recurso",
        code: "FORBIDDEN",
        required_roles: allowedRoles,
        your_role: req.user.role,
      });
      return;
    }

    next();
  };
}
