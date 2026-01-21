/**
 * Logs Controller
 * Maneja logs generados por workflows de n8n y otros servicios internos
 */

import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/errors";

/**
 * POST /api/logs
 * Registrar un log desde n8n workflow u otro servicio interno
 * Input esperado: { level, workflow, message, data?, timestamp? }
 */
export const createLog = asyncHandler(async (req: Request, res: Response) => {
  const { level, workflow, message, data, timestamp } = req.body;

  // Validaciones básicas
  if (!level || !workflow || !message) {
    return res.status(400).json({
      success: false,
      error: "Campos requeridos: level, workflow, message",
      example: {
        level: "info | warning | error",
        workflow: "payment-handler | partner-handler",
        message: "Payment successfully processed",
        data: { orderId: "123", amount: 50 }
      }
    });
  }

  // Validar level
  const validLevels = ["info", "warning", "error"];
  if (!validLevels.includes(level)) {
    return res.status(400).json({
      success: false,
      error: `Level inválido. Usar: ${validLevels.join(", ")}`
    });
  }

  // Log en consola (siempre funciona)
  const logSymbol = level === "error" ? "❌" : level === "warning" ? "⚠️" : "ℹ️";
  const dataStr = data ? JSON.stringify(data) : "";
  console.log(`${logSymbol} [${workflow}] ${message}`, dataStr);

  // Por ahora solo logueamos a consola
  // TODO: Implementar persistencia en DB cuando la tabla esté creada
  res.status(201).json({
    success: true,
    message: "Log registrado correctamente",
    logged_at: timestamp || new Date().toISOString()
  });
});

/**
 * GET /api/logs
 * Obtener logs recientes (placeholder - por ahora retorna array vacío)
 */
export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  // Por ahora retornamos array vacío
  // TODO: Implementar lectura de DB cuando la tabla esté creada
  res.json({
    success: true,
    count: 0,
    logs: [],
    message: "Logs se registran en consola. Implementar tabla workflow_logs para persistencia."
  });
});
