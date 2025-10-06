import { IAdminRepository } from "../domain/repositories/IAdminRepository";
import { AdminEntity } from "../models/adminModel";
import AppDataSource from "../data-source";

export class AdminRepositoryImpl implements IAdminRepository {
  // CREATE con Callback usando TypeORM
  create(
    admin: Partial<AdminEntity>,
    callback: (error: Error | null, result?: AdminEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(AdminEntity);
    const newAdmin = repo.create({
      ...admin,
      created_at: new Date(),
    });
    repo
      .save(newAdmin)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  // UPDATE con Promise usando TypeORM
  async update(id: string, data: Partial<AdminEntity>): Promise<AdminEntity> {
    const repo = AppDataSource.getRepository(AdminEntity);
    const adminId = parseInt(id, 10);
    await repo.update(adminId, data);
    const updated = await repo.findOneBy({ id_admin: adminId });
    if (!updated) throw new Error(`Admin with id ${id} not found`);
    return updated;
  }

  // READ con async/await usando TypeORM
  async findById(id: string): Promise<AdminEntity | null> {
    const repo = AppDataSource.getRepository(AdminEntity);
    const adminId = parseInt(id, 10);
    return await repo.findOneBy({ id_admin: adminId });
  }

  async findAll(): Promise<AdminEntity[]> {
    const repo = AppDataSource.getRepository(AdminEntity);
    return await repo.find();
  }

  // DELETE con async/await usando TypeORM
  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(AdminEntity);
    const adminId = parseInt(id, 10);
    const result = await repo.delete(adminId);
    return !!result.affected && result.affected > 0;
  }
}
