import "reflect-metadata";
import express = require("express");
import AppDataSource from "../infrastructure/database/data-source";
import { setupSwagger } from "../infrastructure/config/swagger";

// Import all routes
import authRoutes from "../infrastructure/http/routes/authRoutes";
import productRoutes from "../infrastructure/http/routes/productRoutes";
import sellerRoutes from "../infrastructure/http/routes/sellerRoutes";
import categoryRoutes from "../infrastructure/http/routes/categoryRoutes";
import subCategoryRoutes from "../infrastructure/http/routes/subCategoryRoutes";
import inventoryRoutes from "../infrastructure/http/routes/inventoryRoutes";
import clientRoutes from "../infrastructure/http/routes/clientRoutes";
import orderRoutes from "../infrastructure/http/routes/orderRoutes";
import cartRoutes from "../infrastructure/http/routes/cartRoutes";
import adminRoutes from "../infrastructure/http/routes/adminRoutes";
import paymentMethodRoutes from "../infrastructure/http/routes/paymentMethodRoutes";
import deliveryRoutes from "../infrastructure/http/routes/deliveryRoutes";

const app = express();
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

// Register all routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/deliveries", deliveryRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log("✅ Conexión a la base de datos establecida correctamente");
    app.listen(3000, () => {
      console.log("🚀 Servidor Express corriendo en puerto 3000");
    });
  })
  .catch((err) => {
    console.error("❌ Error inicializando la base de datos:", err);
  });