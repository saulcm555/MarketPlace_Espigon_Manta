import { SubCategory } from "@domain/entities/sub_category";
import { ISubCategoryRepository } from "@domain/repositories/ISubCategoryRepository";
import { SubCategoryEntity } from "../../models/subCategoryModel";
import AppDataSource from "../database/data-source";

export class SubCategoryRepositoryImpl implements ISubCategoryRepository {
  create(
    subCategory: Partial<SubCategoryEntity>,
    callback: (error: Error | null, result?: SubCategoryEntity) => void
  ): void {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const newSubCategory = repo.create(subCategory);
    repo
      .save(newSubCategory)
      .then((saved) => callback(null, saved))
      .catch((err) => callback(err));
  }

  async update(id: string, data: Partial<SubCategoryEntity>): Promise<SubCategory> {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const subCategoryId = parseInt(id, 10);
    await repo.update(subCategoryId, data as any);
    const updated = await repo.findOne({
      where: { id_sub_category: subCategoryId },
      relations: ["subCategoryProducts", "subCategoryProducts.product"]
    });
    if (!updated) throw new Error(`SubCategory with id ${id} not found`);
    return updated as unknown as SubCategory;
  }

  async findById(id: string): Promise<SubCategory | null> {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const subCategoryId = parseInt(id, 10);
    const result = await repo.findOne({
      where: { id_sub_category: subCategoryId },
      relations: ["subCategoryProducts", "subCategoryProducts.product"]
    });
    return result as unknown as SubCategory | null;
  }

  async findAll(): Promise<SubCategory[]> {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const results = await repo.find({
      relations: ["subCategoryProducts", "subCategoryProducts.product"]
    });
    return results as unknown as SubCategory[];
  }

  async delete(id: string): Promise<boolean> {
    const repo = AppDataSource.getRepository(SubCategoryEntity);
    const subCategoryId = parseInt(id, 10);
    const result = await repo.delete(subCategoryId);
    return !!result.affected && result.affected > 0;
  }
}
