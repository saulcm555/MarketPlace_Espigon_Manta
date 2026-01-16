/**
 * Auth Controller - Handlers de los endpoints
 */

import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { verifyAccessToken, TokenError } from "../services/tokenService";

// ============================================
// POST /auth/register
// ============================================
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, role, reference_id, name } = req.body;

    // Validaciones básicas
    if (!email || !password || !role || !reference_id) {
      res.status(400).json({
        error: "Faltan campos requeridos",
        code: "MISSING_FIELDS",
        required: ["email", "password", "role", "reference_id"],
      });
      return;
    }

    if (!["client", "seller", "admin"].includes(role)) {
      res.status(400).json({
        error: "Rol inválido",
        code: "INVALID_ROLE",
        valid_roles: ["client", "seller", "admin"],
      });
      return;
    }

    const result = await authService.register({
      email,
      password,
      role,
      reference_id,
      name,
    });

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      ...result,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
}

// ============================================
// POST /auth/login
// ============================================
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        error: "Email y password son requeridos",
        code: "MISSING_CREDENTIALS",
      });
      return;
    }

    // Extraer info del dispositivo
    const deviceInfo = {
      ip_address: req.ip || req.socket.remoteAddress || "",
      user_agent: req.headers["user-agent"] || "",
      device_info: req.headers["x-device-info"] as string || undefined,
    };

    const result = await authService.login({ email, password }, deviceInfo);

    res.status(200).json({
      message: "Login exitoso",
      ...result,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
}

// ============================================
// POST /auth/logout
// ============================================
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refresh_token, logout_all_devices } = req.body;
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        error: "No autenticado",
        code: "UNAUTHORIZED",
      });
      return;
    }

    // Obtener access token del header
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(" ")[1] || "";

    await authService.logout(
      accessToken,
      refresh_token || "",
      user.sub,
      logout_all_devices || false
    );

    res.status(200).json({
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    handleAuthError(error, res);
  }
}

// ============================================
// POST /auth/refresh
// ============================================
export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      res.status(400).json({
        error: "Refresh token es requerido",
        code: "MISSING_REFRESH_TOKEN",
      });
      return;
    }

    const deviceInfo = {
      ip_address: req.ip || req.socket.remoteAddress || "",
      user_agent: req.headers["user-agent"] || "",
    };

    const tokens = await authService.refreshTokens(refresh_token, deviceInfo);

    res.status(200).json(tokens);
  } catch (error) {
    handleAuthError(error, res);
  }
}

// ============================================
// GET /auth/me
// ============================================
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        error: "No autenticado",
        code: "UNAUTHORIZED",
      });
      return;
    }

    const userData = await authService.getMe(user.sub);

    if (!userData) {
      res.status(404).json({
        error: "Usuario no encontrado",
        code: "USER_NOT_FOUND",
      });
      return;
    }

    res.status(200).json({
      user: {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        reference_id: userData.reference_id,
        name: userData.name,
        email_verified: userData.email_verified,
        created_at: userData.created_at,
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
}

// ============================================
// GET /auth/validate
// ============================================
export async function validate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(200).json({
        valid: false,
        error: "No token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(200).json({
        valid: false,
        error: "Invalid authorization format",
      });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);

      // Verificar si está en blacklist
      const isRevoked = await authService.isTokenRevoked(decoded.jti);
      if (isRevoked) {
        res.status(200).json({
          valid: false,
          error: "Token has been revoked",
        });
        return;
      }

      res.status(200).json({
        valid: true,
        user: {
          id: decoded.sub,
          email: decoded.email,
          role: decoded.role,
          reference_id: decoded.reference_id,
        },
        expires_at: new Date(decoded.exp * 1000).toISOString(),
      });
    } catch (tokenError) {
      if (tokenError instanceof TokenError) {
        res.status(200).json({
          valid: false,
          error: tokenError.message,
          code: tokenError.code,
        });
        return;
      }
      throw tokenError;
    }
  } catch (error) {
    handleAuthError(error, res);
  }
}

// ============================================
// Helper: Manejo de errores
// ============================================
function handleAuthError(error: unknown, res: Response): void {
  console.error("Auth Error:", error);

  if (error instanceof authService.AuthError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  if (error instanceof TokenError) {
    res.status(401).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    error: "Error interno del servidor",
    code: "INTERNAL_ERROR",
  });
}
