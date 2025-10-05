import { Category } from "@domain/entities/category";
import { ICategoryRepository } from "@domain/repositories/ICategoryRepository";

export class CategoryRepositoryImpl implements ICategoryRepository {
  private categories: Category[] = [];
  private currentId = 1;

  create(
    category: Category,
    callback: (error: Error | null, result?: Category) => void
  ): void {
    try {
      if (!category.category_name) {
        return callback(new Error("Category must have a name."));
      }
      const newCategory: Category = {
        ...category,
        id_category: this.currentId++,
      };
      this.categories.push(newCategory);
      callback(null, newCategory);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const categoryId = parseInt(id, 10);
    const index = this.categories.findIndex((c) => c.id_category === categoryId);
    if (index === -1) {
      throw new Error(`Category with id ${id} not found`);
    }
    this.categories[index] = {
      ...this.categories[index]!,
      ...data,
    };
    return this.categories[index]!;
  }

  async findById(id: string): Promise<Category | null> {
    const categoryId = parseInt(id, 10);
    const category = this.categories.find((c) => c.id_category === categoryId);
    return category || null;
  }

  async findAll(): Promise<Category[]> {
    return this.categories;
  }

  async delete(id: string): Promise<boolean> {
    const categoryId = parseInt(id, 10);
    const index = this.categories.findIndex((c) => c.id_category === categoryId);
    if (index === -1) {
      return false;
    }
    this.categories.splice(index, 1);
    return true;
  }
}
