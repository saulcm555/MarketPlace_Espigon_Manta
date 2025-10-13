import "reflect-metadata";
import express = require("express");
import AppDataSource from "../infrastructure/database/data-source";
import productRoutes from "../infrastructure/http/routes/productRoutes";

const app = express();
app.use(express.json());

app.use("/api/products", productRoutes);

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