/**
 * Seed para crear el usuario administrador principal del sistema
 * 
 * Este script crea el administrador en DOS lugares:
 * 1. auth_service.users - Para autenticación via Auth Service
 * 2. public.admin - Para el perfil de administrador en REST Service
 * 
 * Es idempotente: puede ejecutarse múltiples veces sin crear duplicados.
 * 
 * Ejecutar con: npx ts-node src/infrastructure/database/seeds/create-admin.seed.ts
 * 
 * @author Saul Castro
 * @version 2.0.0
 */

import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
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
 * Crear usuario en auth_service.users si no existe
 * Si existe, actualiza la contraseña para asegurar sincronización
 */
async function ensureAuthServiceUser(hashedPassword: string): Promise<string> {
  // Verificar si ya existe en auth_service.users
  const existingAuthUser = await AppDataSource.query(
    `SELECT id, email FROM auth_service.users WHERE email = $1`,
    [ADMIN_DATA.admin_email]
  );

  if (existingAuthUser.length > 0) {
    console.log(`✅ Usuario ya existe en auth_service.users: ${existingAuthUser[0].id}`);
    
    // Actualizar la contraseña para sincronizar con .env
    console.log(`🔄 Actualizando contraseña en auth_service.users...`);
    await AppDataSource.query(
      `UPDATE auth_service.users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [hashedPassword, existingAuthUser[0].id]
    );
    console.log(`✅ Contraseña actualizada`);
    
    return existingAuthUser[0].id;
  }

  // Crear nuevo usuario en auth_service.users
  const userId = uuidv4();
  console.log(`📝 Creando usuario en auth_service.users...`);
  
  await AppDataSource.query(
    `INSERT INTO auth_service.users (id, email, password_hash, name, role, is_active, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [userId, ADMIN_DATA.admin_email, hashedPassword, ADMIN_DATA.admin_name, 'admin', true, true]
  );

  console.log(`✅ Usuario creado en auth_service.users: ${userId}`);
  return userId;
}

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

    // 2. Hashear la contraseña (se usa para ambas tablas)
    console.log("🔐 Hasheando contraseña...");
    const hashedPassword = await bcrypt.hash(ADMIN_DATA.admin_password, 10);
    console.log("✅ Contraseña hasheada correctamente\n");

    // 3. Asegurar que existe en auth_service.users
    console.log("🔐 Verificando usuario en Auth Service...");
    const userId = await ensureAuthServiceUser(hashedPassword);
    console.log(`   user_id: ${userId}\n`);

    // 4. Obtener el repositorio de Admin
    const adminRepository = AppDataSource.getRepository(AdminEntity);

    // 5. Verificar si ya existe un admin con ese email en public.admin
    console.log(`🔍 Verificando si ya existe el email en public.admin: ${ADMIN_DATA.admin_email}`);
    const existingAdmin = await adminRepository.findOne({
      where: { admin_email: ADMIN_DATA.admin_email }
    });

    if (existingAdmin) {
      // Admin existe - verificar si tiene user_id vinculado
      if (!existingAdmin.user_id) {
        console.log("⚠️  Admin existe pero NO tiene user_id vinculado");
        console.log("🔄 Vinculando user_id...");
        await adminRepository.update(
          { id_admin: existingAdmin.id_admin },
          { user_id: userId }
        );
        console.log(`✅ user_id vinculado: ${userId}\n`);
      } else {
        console.log("✅ Admin ya tiene user_id vinculado correctamente\n");
      }

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📋 ADMINISTRADOR EXISTENTE");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`ID:       ${existingAdmin.id_admin}`);
      console.log(`user_id:  ${userId}`);
      console.log(`Nombre:   ${existingAdmin.admin_name}`);
      console.log(`Email:    ${existingAdmin.admin_email}`);
      console.log(`Rol:      ${existingAdmin.role}`);
      console.log(`Creado:   ${existingAdmin.created_at}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      return;
    }

    // 6. Crear el nuevo administrador en public.admin
    console.log("👤 Creando administrador en public.admin...");
    const newAdmin = adminRepository.create({
      user_id: userId,
      admin_name: ADMIN_DATA.admin_name,
      admin_email: ADMIN_DATA.admin_email,
      admin_password: hashedPassword,
      role: ADMIN_DATA.role
    });

    // 7. Guardar en la base de datos
    const savedAdmin = await adminRepository.save(newAdmin);
    console.log("✅ Administrador creado exitosamente\n");

    // 8. Mostrar información del administrador creado
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 INFORMACIÓN DEL ADMINISTRADOR CREADO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`ID:       ${savedAdmin.id_admin}`);
    console.log(`user_id:  ${savedAdmin.user_id}`);
    console.log(`Nombre:   ${savedAdmin.admin_name}`);
    console.log(`Email:    ${savedAdmin.admin_email}`);
    console.log(`Teléfono: ${ADMIN_DATA.phone}`);
    console.log(`Rol:      ${savedAdmin.role}`);
    console.log(`Creado:   ${savedAdmin.created_at}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 9. Mostrar credenciales para login
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 CREDENCIALES PARA LOGIN (Auth Service)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Email:    ${ADMIN_DATA.admin_email}`);
    console.log(`Password: ${ADMIN_DATA.admin_password}`);
    console.log(`Endpoint: POST http://localhost:4001/auth/login`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 10. Instrucciones para usar
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 INSTRUCCIONES DE USO");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("1. Abre http://localhost:4001/auth/login");
    console.log("2. Envía POST con { email, password }");
    console.log("3. Usa el access_token en header: Authorization: Bearer <token>");
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
