import { ICategoryRepository } from "../domain/repositories/ICategoryRepository";
import { CategoryEntity } from "../models/categoryModel";
import AppDataSource from "../data-source";

export class CategoryRepositoryImpl implements ICategoryRepository {
  create(
    category: Partial<CategoryEntity>,
    callback: (error: Error | null, result?: CategoryEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const newCategory = repo.create(category);
    repo
      .save(newCategory)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<CategoryEntity>): Promise<CategoryEntity> {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const categoryId = parseInt(id, 10);
    await repo.update(categoryId, data);
    const updated = await repo.findOneBy({ id_category: categoryId });
    if (!updated) throw new Error(`Category with id ${id} not found`);
    return updated;
  }

  async findById(id: string): Promise<CategoryEntity | null> {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const categoryId = parseInt(id, 10);
    return await repo.findOneBy({ id_category: categoryId });
  }

  async findAll(): Promise<CategoryEntity[]> {
    const repo = AppDataSource.getRepository(CategoryEntity);
    return await repo.find();
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(CategoryEntity);
    const categoryId = parseInt(id, 10);
    const result = await repo.delete(categoryId);
    return !!result.affected && result.affected > 0;
  }
}
