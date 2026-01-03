/**
 * Configuración de Base de Datos - TypeORM
 */

import { DataSource } from "typeorm";
import { env } from "./env";

// Importar entidades (se crearán en Fase 2)
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { RevokedToken } from "../models/RevokedToken";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USERNAME,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
  schema: env.DB_SCHEMA,
  synchronize: env.NODE_ENV === "development", // Solo en desarrollo
  logging: env.NODE_ENV === "development",
  entities: [User, RefreshToken, RevokedToken],
  migrations: [],
  subscribers: [],
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log(`📦 Conectado a PostgreSQL - Schema: ${env.DB_SCHEMA}`);
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error);
    throw error;
  }
};
