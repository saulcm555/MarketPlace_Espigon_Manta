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

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL!,
  synchronize: true,  // ⬅️ Cambiado a true para crear las tablas
  logging: true,
  ssl: {
    rejectUnauthorized: false
  },
  extra: {
    ssl: {
      rejectUnauthorized: false
    }
  },
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