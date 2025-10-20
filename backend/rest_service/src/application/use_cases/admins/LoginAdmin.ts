import { LoginAdminDto } from "../../dtos/admins/LoginAdmin.dto";
import { AdminService } from "../../../domain/services/AdminService";
import { Admin } from "../../../domain/entities/admin";

/**
 * Caso de uso para el login de administradores
 */
export class LoginAdmin {
  constructor(private adminService: AdminService) {}

  /**
   * Ejecuta el login del administrador
   * @param loginData - Credenciales del administrador
   * @returns Promise con los datos del administrador autenticado
   */
  async execute(loginData: LoginAdminDto): Promise<Admin | null> {
    // Validar campos requeridos
    if (!loginData.admin_email || !loginData.admin_password) {
      throw new Error("Email y contraseña son requeridos");
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.admin_email)) {
      throw new Error("Formato de email inválido");
    }

    // Buscar todos los admins (en producción, deberías tener un método findByEmail)
    const admins = await this.adminService.getAllAdmins();
    
    // Buscar el admin por email
    const admin = admins.find(
      (a) => a.admin_email === loginData.admin_email
    );

    if (!admin) {
      throw new Error("Credenciales inválidas");
    }

    // Validar contraseña (en producción, usar bcrypt)
    if (admin.admin_password !== loginData.admin_password) {
      throw new Error("Credenciales inválidas");
    }

    // Retornar admin sin la contraseña
    const { admin_password, ...adminWithoutPassword } = admin;
    return adminWithoutPassword as Admin;
  }
}
