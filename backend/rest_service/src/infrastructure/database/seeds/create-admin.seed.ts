/**
 * Seed para crear el usuario administrador principal del sistema
 * 
 * Este script se ejecuta UNA SOLA VEZ para crear el primer administrador
 * 
 * Ejecutar con: npx ts-node src/infrastructure/database/seeds/create-admin.seed.ts
 * 
 * @author Saul Castro
 * @version 1.0.0
 */

import "reflect-metadata";
import * as bcrypt from "bcrypt";
import AppDataSource from "../data-source";
import { AdminEntity } from "../../../models/adminModel";

/**
 * Datos del administrador principal
 * NOTA: Las credenciales se leen del archivo .env por seguridad
 * No están hardcodeadas en el código para evitar exponerlas en Git
 */
const ADMIN_DATA = {
  admin_name: process.env.ADMIN_NAME || "Admin",
  admin_email: process.env.ADMIN_EMAIL || "admin@marketplace.com",
  admin_password: process.env.ADMIN_PASSWORD || "change-this-password",
  phone: process.env.ADMIN_PHONE || "0000000000",
  role: "super_admin"
};

/**
 * Función principal del seed
 */
async function seedAdmin() {
  console.log("🌱 Iniciando seed de administrador...\n");

  try {
    // 1. Inicializar conexión a la base de datos
    console.log("📡 Conectando a la base de datos...");
    await AppDataSource.initialize();
    console.log("✅ Conexión establecida\n");

    // 2. Obtener el repositorio de Admin
    const adminRepository = AppDataSource.getRepository(AdminEntity);

    // 3. Verificar si ya existe un admin con ese email
    console.log(` Verificando si ya existe el email: ${ADMIN_DATA.admin_email}`);
    const existingAdmin = await adminRepository.findOne({
      where: { admin_email: ADMIN_DATA.admin_email }
    });

    if (existingAdmin) {
      console.log("⚠️  Ya existe un administrador con ese email");
      console.log(`   ID: ${existingAdmin.id_admin}`);
      console.log(`   Nombre: ${existingAdmin.admin_name}`);
      console.log(`   Email: ${existingAdmin.admin_email}`);
      console.log(`   Rol: ${existingAdmin.role}`);
      console.log(`   Creado: ${existingAdmin.created_at}\n`);
      console.log("💡 Si deseas crear un nuevo admin, cambia el email en el seed\n");
      return;
    }

    // 4. Hashear la contraseña
    console.log("🔐 Hasheando contraseña...");
    const hashedPassword = await bcrypt.hash(ADMIN_DATA.admin_password, 10);
    console.log("✅ Contraseña hasheada correctamente\n");

    // 5. Crear el nuevo administrador
    console.log("👤 Creando administrador...");
    const newAdmin = adminRepository.create({
      admin_name: ADMIN_DATA.admin_name,
      admin_email: ADMIN_DATA.admin_email,
      admin_password: hashedPassword,
      role: ADMIN_DATA.role
    });

    // 6. Guardar en la base de datos
    const savedAdmin = await adminRepository.save(newAdmin);
    console.log("✅ Administrador creado exitosamente\n");

    // 7. Mostrar información del administrador creado
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 INFORMACIÓN DEL ADMINISTRADOR CREADO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`ID:       ${savedAdmin.id_admin}`);
    console.log(`Nombre:   ${savedAdmin.admin_name}`);
    console.log(`Email:    ${savedAdmin.admin_email}`);
    console.log(`Teléfono: ${ADMIN_DATA.phone}`);
    console.log(`Rol:      ${savedAdmin.role}`);
    console.log(`Creado:   ${savedAdmin.created_at}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 8. Mostrar credenciales para login
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 CREDENCIALES PARA LOGIN");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email:    ${ADMIN_DATA.admin_email}`);
    console.log(`Password: ${ADMIN_DATA.admin_password}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 9. Instrucciones para usar Swagger
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 INSTRUCCIONES PARA USAR SWAGGER");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Abre http://localhost:3000/api-docs");
    console.log("2. Busca el endpoint POST /api/auth/login/admin");
    console.log("3. Haz clic en 'Try it out'");
    console.log("4. Ingresa el email y password mostrados arriba");
    console.log("5. Haz clic en 'Execute'");
    console.log("6. Copia el token de la respuesta");
    console.log("7. Haz clic en el botón 'Authorize' (🔓) arriba");
    console.log("8. Pega el token en el campo 'Value'");
    console.log("9. Haz clic en 'Authorize'");
    console.log("10. ¡Ya puedes usar todos los endpoints protegidos!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  } catch (error) {
    console.error("❌ Error al crear el administrador:");
    console.error(error);
    process.exit(1);
  } finally {
    // 10. Cerrar la conexión a la base de datos
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔌 Conexión a la base de datos cerrada");
    }
  }
}

// Ejecutar el seed
seedAdmin()
  .then(() => {
    console.log("\n✅ Seed completado exitosamente");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error en el seed:", error);
    process.exit(1);
  });
