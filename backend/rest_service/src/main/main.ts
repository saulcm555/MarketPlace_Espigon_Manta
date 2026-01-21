import "reflect-metadata";
import express = require("express");
import cors = require("cors");
import path = require("path");
import AppDataSource from "../infrastructure/database/data-source";
import { setupSwagger } from "../infrastructure/config/swagger";
import { errorHandler, notFoundHandler } from "../infrastructure/middlewares/errors";
import { connectRedis, disconnectRedis } from "../infrastructure/clients/redisClient";
import { startCleanupScheduler, stopCleanupScheduler } from "../infrastructure/jobs/scheduler";

// Import all routes
import authRoutes from "../infrastructure/http/routes/authRoutes";
import productRoutes from "../infrastructure/http/routes/productRoutes";
import sellerRoutes from "../infrastructure/http/routes/sellerRoutes";
import categoryRoutes from "../infrastructure/http/routes/categoryRoutes";
import subCategoryRoutes from "../infrastructure/http/routes/subCategoryRoutes";
import inventoryRoutes from "../infrastructure/http/routes/inventoryRoutes";
import clientRoutes from "../infrastructure/http/routes/clientRoutes";
import orderRoutes from "../infrastructure/http/routes/orderRoutes";
import productOrderRoutes from "../infrastructure/http/routes/productOrderRoutes";
import cartRoutes from "../infrastructure/http/routes/cartRoutes";
import adminRoutes from "../infrastructure/http/routes/adminRoutes";
import paymentMethodRoutes from "../infrastructure/http/routes/paymentMethodRoutes";
import deliveryRoutes from "../infrastructure/http/routes/deliveryRoutes";
import wsAuthRoutes from "../infrastructure/http/routes/wsAuthRoutes";
import uploadRoutes from "../infrastructure/http/routes/uploadRoutes";
import statisticsRoutes from "../infrastructure/http/routes/statisticsRoutes";
import reportsRoutes from "../infrastructure/http/routes/reportsRoutes";

// ✅ Combinar ambos cambios
import couponRoutes from "../infrastructure/http/routes/couponRoutes";
import logsRoutes from "../infrastructure/http/routes/logsRoutes";

const app = express();

// ============================================
// CORS Configuration (permite frontend acceder al backend)
// ============================================
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://192.168.56.1:8080",
    "http://192.168.1.87:8080",
    "http://172.20.64.1:8080",
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Servir archivos estáticos (imágenes subidas)
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

// Setup Swagger documentation
setupSwagger(app);

// Health check route (para verificación de servicios)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "🛍️ Marketplace Espigón Manta - REST API",
    version: "1.0.0",
    endpoints: {
      swagger: "/api-docs",
      health: "/health",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      redis: "connected",
    },
  });
});

// Register all routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/product-orders", productOrderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/deliveries", deliveryRoutes);

// ✅ Mantener rutas existentes + nuevas
app.use("/api/ws", wsAuthRoutes); // 🔔 Rutas de autorización WebSocket
app.use("/api/upload", uploadRoutes); // 📤 Rutas de subida de archivos
app.use("/api/statistics", statisticsRoutes); // 📊 Estadísticas del marketplace
app.use("/api/reports", reportsRoutes); // 📄 Generación de reportes PDF
app.use("/api/coupons", couponRoutes); // 🎟️ Sistema de cupones B2B
app.use("/api/logs", logsRoutes); // 🧾 Logs de workflows/n8n y servicios internos

// ============================================
// ERROR HANDLING MIDDLEWARES (al final)
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log("📦 Conectando a PostgreSQL...");
    await AppDataSource.initialize();
    console.log("✅ PostgreSQL conectado correctamente");

    console.log("📦 Conectando a Redis...");
    await connectRedis();
    console.log("✅ Redis conectado correctamente");

    const cleanupEnabled = process.env.CLEANUP_ENABLED === "true";
    if (cleanupEnabled) {
      console.log("🧹 Iniciando scheduler de limpieza automática...");
      startCleanupScheduler();
      console.log("✅ Scheduler iniciado correctamente");
    }

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 ============================================`);
      console.log(`   🛍️  REST Service - Marketplace Espigón Manta`);
      console.log(`   🌐 Servidor escuchando en puerto ${PORT}`);
      console.log(`   📚 Swagger docs: http://localhost:${PORT}/api-docs`);
      console.log(`   💚 Health check: http://localhost:${PORT}/health`);
      console.log(`============================================\n`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ ${signal} recibido. Cerrando servidor...`);

      stopCleanupScheduler();

      server.close(() => {
        console.log("✅ Servidor HTTP cerrado");
      });

      await disconnectRedis();
      await AppDataSource.destroy();
      console.log("✅ Redis y Base de datos desconectados");

      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT (Ctrl+C)"));
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
    process.exit(1);
  }
};

startServer();
