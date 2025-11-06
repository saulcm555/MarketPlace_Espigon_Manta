import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

import { AdminEntity } from "../../models/adminModel";
import { CartEntity, ProductCartEntity } from "../../models/cartModel";
import { CategoryEntity } from "../../models/categoryModel";
import { ClientEntity } from "../../models/clientModel";
import { DeliveryEntity } from "../../models/deliveryModel";
import { InventoryEntity } from "../../models/inventoryModel";
import { OrderEntity, ProductOrderEntity } from "../../models/orderModel";
import { PaymentMethodEntity } from "../../models/paymentMethodModel";
import { ProductEntity } from "../../models/productModel";
import { SellerEntity } from "../../models/sellerModel";
import { SubCategoryEntity, SubCategoryProductEntity } from "../../models/subCategoryModel";

dotenv.config();

// Validar variables de entorno requeridas para la conexión a la base de datos.
// Evitamos valores por defecto inseguros en el código.
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error(
    "❌ Faltan variables de entorno requeridas: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME. \n" +
      "Por favor añade estas variables en el archivo .env y reinicia el servicio."
  );
}

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "6543"),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,  // ⬅️ Cambiado a true para crear las tablas
  logging: true,
  ssl: false,
  entities: [
    AdminEntity,
    CartEntity,
    ProductCartEntity,
    CategoryEntity,
    ClientEntity,
    DeliveryEntity,
    InventoryEntity,
    OrderEntity,
    ProductOrderEntity,
    PaymentMethodEntity,
    ProductEntity,
    SellerEntity,
    SubCategoryEntity,
    SubCategoryProductEntity,
  ],
  migrations: [],
  subscribers: [],
});

console.log("🔗 Conectando a Supabase...");

export default AppDataSource;