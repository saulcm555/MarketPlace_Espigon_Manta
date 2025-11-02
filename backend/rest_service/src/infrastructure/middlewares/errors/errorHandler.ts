import { Request, Response, NextFunction } from "express";
import { AppError } from "./AppError";

/**
 * Middleware global para manejo de errores
 * Captura todos los errores lanzados en la aplicación
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si es un AppError, usamos su statusCode, sino 500
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  
  // En producción, no enviamos el stack trace
  const isProduction = process.env.NODE_ENV === "production";
  
  // Estructura de respuesta de error
  const errorResponse = {
    status: "error",
    statusCode,
    message: err.message || "Internal server error",
    ...((!isProduction || (err instanceof AppError && err.isOperational)) && {
      stack: err.stack,
    }),
  };

  // Log del error en consola (en producción usarías un logger profesional)
  if (!isProduction) {
    console.error("❌ Error capturado:", {
      message: err.message,
      statusCode,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Enviar respuesta
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rutas no encontradas (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
};

/**
 * Wrapper para funciones async en controladores
 * Captura errores automáticamente sin necesidad de try-catch
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
