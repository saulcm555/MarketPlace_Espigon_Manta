import { SubCategory } from "@domain/entities/sub_category";
import { ISubCategoryRepository } from "@domain/repositories/ISubCategoryRepository";

export class SubCategoryService {
  constructor(private subCategoryRepository: ISubCategoryRepository) {}

  createSubCategory(subCategory: SubCategory, callback: (err: Error | null, result?: SubCategory) => void): void {
    this.subCategoryRepository.create(subCategory, callback);
  }

  updateSubCategory(id: string, data: Partial<SubCategory>): Promise<SubCategory> {
    return this.subCategoryRepository.update(id, data);
  }

  async getSubCategoryById(id: string): Promise<SubCategory | null> {
    return await this.subCategoryRepository.findById(id);
  }

  async getAllSubCategories(): Promise<SubCategory[]> {
    return await this.subCategoryRepository.findAll();
  }

  async deleteSubCategory(id: string): Promise<boolean> {
    return await this.subCategoryRepository.delete(id);
  }
}
