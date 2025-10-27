import { Admin } from "@domain/entities/admin";
import { IAdminRepository } from "@domain/repositories/IAdminRepository";

export class AdminService {
  constructor(private adminRepository: IAdminRepository) {}

  createAdmin(admin: Admin, callback: (err: Error | null, result?: Admin) => void): void {
    this.adminRepository.create(admin, callback);
  }

  updateAdmin(id: string, data: Partial<Admin>): Promise<Admin> {
    return this.adminRepository.update(id, data);
  }

  async getAdminById(id: string): Promise<Admin | null> {
    return await this.adminRepository.findById(id);
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await this.adminRepository.findAll();
  }

  async deleteAdmin(id: string): Promise<boolean> {
    return await this.adminRepository.delete(id);
  }
}
