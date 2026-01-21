/**
 * Workflow Logs Routes
 * Endpoints para registrar logs desde n8n workflows
 */

import { Router } from "express";
import { internalAuthMiddleware } from "../middlewares/internalAuthMiddleware";
import { createLog, getLogs } from "../controllers/logsController";

const router = Router();

// POST /api/logs - Crear log (requiere internal auth)
router.post("/", internalAuthMiddleware, createLog);

// GET /api/logs - Obtener logs (requiere internal auth)
router.get("/", internalAuthMiddleware, getLogs);

export default router;
