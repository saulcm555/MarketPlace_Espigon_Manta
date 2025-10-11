import { Category } from "@domain/entities/category";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";

export class CategoryService {
  constructor(private categoryRepository: ICategoryRepository) {}

  createCategory(category: Category, callback: (err: Error | null, result?: Category) => void): void {
    this.categoryRepository.create(category, callback);
  }

  updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return this.categoryRepository.update(id, data);
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.categoryRepository.findById(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.findAll();
  }

  async deleteCategory(id: string): Promise<boolean> {
    return await this.categoryRepository.delete(id);
  }
}
