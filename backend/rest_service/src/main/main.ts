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

const app = express();

// ============================================
// CORS Configuration (permite frontend acceder al backend)
// ============================================
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:8080', 
    'http://localhost:8081',
    'http://192.168.56.1:8080',
    'http://192.168.1.87:8080',
    'http://172.20.64.1:8080'
  ], // Frontend URLs (localhost + network IPs)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

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
      health: "/health"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      redis: "connected"
    }
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
app.use("/api/ws", wsAuthRoutes); // 🔔 Rutas de autorización WebSocket
app.use("/api/upload", uploadRoutes); // 📤 Rutas de subida de archivos
app.use("/api/statistics", statisticsRoutes); // 📊 Estadísticas del marketplace

// ============================================
// ERROR HANDLING MIDDLEWARES
// Debe ir DESPUÉS de todas las rutas
// ============================================

// Captura rutas no encontradas (404)
app.use(notFoundHandler);

// Middleware global de manejo de errores
app.use(errorHandler);

AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Conexión a la base de datos establecida correctamente");
    
    // Inicializar Redis para notificaciones en tiempo real
    await connectRedis();
    
    // Iniciar scheduler de limpieza automática de comprobantes
    startCleanupScheduler();
    
    const server = app.listen(3000, () => {
      console.log("🚀 Servidor Express corriendo en puerto 3000");
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("\n⚠️  Cerrando servidor...");
      
      // Detener scheduler de limpieza
      stopCleanupScheduler();
      
      // Cerrar servidor HTTP
      server.close(() => {
        console.log("✅ Servidor HTTP cerrado");
      });
      
      // Desconectar Redis
      await disconnectRedis();
      
      // Cerrar conexión a base de datos
      await AppDataSource.destroy();
      console.log("✅ Base de datos desconectada");
      
      process.exit(0);
    };

    // Manejar señales de terminación
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  })
  .catch((err) => {
    console.error("❌ Error inicializando la base de datos:", err);
    process.exit(1);
  });