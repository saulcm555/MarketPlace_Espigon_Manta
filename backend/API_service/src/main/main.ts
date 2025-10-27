import "reflect-metadata";
import express = require("express");
import AppDataSource from "../infrastructure/database/data-source";

// Import all routes
import productRoutes from "../infrastructure/http/routes/productRoutes";
import sellerRoutes from "../infrastructure/http/routes/sellerRoutes";
import categoryRoutes from "../infrastructure/http/routes/categoryRoutes";
import subCategoryRoutes from "../infrastructure/http/routes/subCategoryRoutes";
import inventoryRoutes from "../infrastructure/http/routes/inventoryRoutes";
import clientRoutes from "../infrastructure/http/routes/clientRoutes";
import orderRoutes from "../infrastructure/http/routes/orderRoutes";
import cartRoutes from "../infrastructure/http/routes/cartRoutes";
import adminRoutes from "../infrastructure/http/routes/adminRoutes";

const app = express();
app.use(express.json());

// Register all routes
app.use("/api/products", productRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subCategoryRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/admins", adminRoutes);

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