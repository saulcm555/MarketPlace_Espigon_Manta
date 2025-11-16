/**
 * Middleware para autenticar servicios internos
 * Verifica el token de servicio interno para comunicación entre microservicios
 */

import { Request, Response, NextFunction } from "express";

const SERVICE_TOKEN = "internal-service-graphql-reports-2024";

export const serviceTokenMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers["x-service-token"];
  const service = req.headers["x-internal-service"];

  if (token === SERVICE_TOKEN && service === "report-service") {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado - Token de servicio inválido" });
  }
};
