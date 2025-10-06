import { DataSource } from "typeorm";

// Cambiamos el tipo de base de datos a 'sqlite'.
// Solo necesitas especificar la propiedad 'database' con la ruta del archivo .sqlite.
// No se requieren host, port, username ni password.
const AppDataSource = new DataSource({
  type: "sqlite",
  database: "marketplace.sqlite", // Puedes cambiar el nombre o la ruta si lo deseas
  synchronize: true, // Opcional: crea las tablas automáticamente en desarrollo
  logging: false,    // Opcional: activa logs de queries
  entities: [
    // Aquí puedes poner la ruta a tus entidades, por ejemplo:
    __dirname + "/models/*.ts"
  ],
  migrations: [],
  subscribers: [],
});

export default AppDataSource;