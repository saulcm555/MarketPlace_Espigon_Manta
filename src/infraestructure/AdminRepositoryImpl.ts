import { Admin } from "@domain/entities/admin";
import { IAdminRepository } from "@domain/repositories/IAdminRepository";

// Repositorio en memoria
export class AdminRepositoryImpl implements IAdminRepository {
  private admins: Admin[] = [];
  private currentId = 1;

  // CREATE con Callback
  create(
    admin: Admin,
    callback: (error: Error | null, result?: Admin) => void
  ): void {
    try {
      if (!admin.admin_name || !admin.admin_email) {
        return callback(new Error("Admin must have a name and email."));
      }
      const newAdmin: Admin = {
        ...admin,
        id_admin: this.currentId++,
        created_at: new Date(),
      };
      this.admins.push(newAdmin);
      callback(null, newAdmin);
    } catch (error) {
      callback(error as Error);
    }
  }

  // UPDATE con Promise
  async update(id: string, data: Partial<Admin>): Promise<Admin> {
    const adminId = parseInt(id, 10);
    const index = this.admins.findIndex((a) => a.id_admin === adminId);
    if (index === -1) {
      throw new Error(`Admin with id ${id} not found`);
    }
    this.admins[index] = {
      ...this.admins[index]!,
      ...data,
    };
    return this.admins[index]!;
  }

  // READ con async/await
  async findById(id: string): Promise<Admin | null> {
    const adminId = parseInt(id, 10);
    const admin = this.admins.find((a) => a.id_admin === adminId);
    return admin || null;
  }

  async findAll(): Promise<Admin[]> {
    return this.admins;
  }

  // DELETE con async/await
  async delete(id: string): Promise<boolean> {
    const adminId = parseInt(id, 10);
    const index = this.admins.findIndex((a) => a.id_admin === adminId);
    if (index === -1) {
      return false;
    }
    this.admins.splice(index, 1);
    return true;
  }
}
