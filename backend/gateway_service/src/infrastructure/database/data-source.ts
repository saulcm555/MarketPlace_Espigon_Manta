import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

import { AdminEntity } from "../../models/adminModel";
import { CartEntity } from "../../models/cartModel";
import { CategoryEntity } from "../../models/categoryModel";
import { ClientEntity } from "../../models/clientModel";
import { DeliveryEntity } from "../../models/deliveryModel";
import { InventoryEntity } from "../../models/inventoryModel";
import { OrderEntity } from "../../models/orderModel";
import { PaymentMethodEntity } from "../../models/paymentMethodModel";
import { ProductEntity } from "../../models/productModel";
import { SellerEntity } from "../../models/sellerModel";
import { SubCategoryEntity } from "../../models/subCategoryModel";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL!,
  synchronize: true,
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
    CategoryEntity,
    ClientEntity,
    DeliveryEntity,
    InventoryEntity,
    OrderEntity,
    PaymentMethodEntity,
    ProductEntity,
    SellerEntity,
    SubCategoryEntity,
  ],
  migrations: [],
  subscribers: [],
});

console.log("🔗 Conectando a Supabase...");

export default AppDataSource;