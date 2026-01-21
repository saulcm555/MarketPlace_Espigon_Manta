/**
 * Rutas de Autenticación
 * Define todos los endpoints del Auth Service
 */

import { Router } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { rateLimitLogin, rateLimitRegister, rateLimitRefresh } from "../middlewares/rateLimiter";

const router = Router();

// ============================================
// POST /auth/register - Registro de usuarios
// Rate Limit: 5 intentos por minuto
// ============================================
router.post("/register", rateLimitRegister, authController.register);

// ============================================
// POST /auth/login - Inicio de sesión
// Rate Limit: 10 intentos por minuto
// ============================================
router.post("/login", rateLimitLogin, authController.login);

// ============================================
// POST /auth/logout - Cerrar sesión
// Requiere: Bearer Token
// ============================================
router.post("/logout", authMiddleware, authController.logout);

// ============================================
// POST /auth/refresh - Renovar access token
// Rate Limit: 30 intentos por minuto
// ============================================
router.post("/refresh", rateLimitRefresh, authController.refresh);

// ============================================
// GET /auth/me - Obtener usuario actual
// Requiere: Bearer Token
// ============================================
router.get("/me", authMiddleware, authController.getMe);

// ============================================
// GET/POST /auth/validate - Validar token (interno)
// No requiere auth (valida el token que recibe)
// Soporta tanto GET como POST para compatibilidad
// ============================================
router.get("/validate", authController.validate);
router.post("/validate", authController.validate);

export default router;
