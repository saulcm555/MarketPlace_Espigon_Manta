/**
 * AUTH SERVICE - Entry Point
 * Microservicio de Autenticación - MarketPlace Espigón Manta
 * Pilar 1 del Segundo Parcial
 */

import "reflect-metadata";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Importar configuraciones
import { initializeDatabase } from "./config/database";
import { env } from "./config/env";

// Importar rutas
import authRoutes from "./routes/authRoutes";

// Crear aplicación Express
const app: Application = express();

// ============================================
// Middlewares Globales
// ============================================

// Seguridad con Helmet
app.use(helmet());

// CORS
app.use(cors({
  origin: env.NODE_ENV === "production" 
    ? ["http://localhost:8080"] // Ajustar en producción
    : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// Rutas
// ============================================

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.json({ 
    status: "ok", 
    service: "auth-service",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Rutas de autenticación
app.use("/auth", authRoutes);

// ============================================
// Manejo de errores
// ============================================

// Ruta no encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.path 
  });
});

// Error handler global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err.message);
  console.error(err.stack);
  
  res.status(500).json({ 
    error: "Error interno del servidor",
    message: env.NODE_ENV === "development" ? err.message : undefined
  });
});

// ============================================
// Iniciar servidor
// ============================================

const startServer = async () => {
  try {
    // Inicializar base de datos
    await initializeDatabase();
    console.log("✅ Base de datos conectada");

    // Iniciar servidor
    app.listen(env.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🔐 AUTH SERVICE - MarketPlace Espigón Manta        ║
║                                                       ║
║   Puerto: ${env.PORT}                                      ║
║   Entorno: ${env.NODE_ENV}                            ║
║   Base de datos: ${env.DB_DATABASE}                   ║
║                                                       ║
║   Endpoints disponibles:                              ║
║   • POST /auth/register                               ║
║   • POST /auth/login                                  ║
║   • POST /auth/logout                                 ║
║   • POST /auth/refresh                                ║
║   • GET  /auth/me                                     ║
║   • GET  /auth/validate                               ║
║   • GET  /health                                      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
