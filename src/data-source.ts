import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL!,
  synchronize: true,
  logging: true,
  ssl: {
    rejectUnauthorized: false
  },
  entities: [__dirname + "/models/*.ts"],
  migrations: [],
  subscribers: [],
});

console.log("🔗 Conectando a Supabase...");

export default AppDataSource;