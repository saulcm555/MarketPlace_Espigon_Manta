import { SubCategory } from "@domain/entities/sub_category";
import { ISubCategoryRepository } from "@domain/repositories/ISubCategoryRepository";

export class SubCategoryRepositoryImpl implements ISubCategoryRepository {
  private subCategories: SubCategory[] = [];
  private currentId = 1;

  create(
    subCategory: SubCategory,
    callback: (error: Error | null, result?: SubCategory) => void
  ): void {
    try {
      if (!subCategory.sub_category_name) {
        return callback(new Error("SubCategory must have a name."));
      }
      const newSubCategory: SubCategory = {
        ...subCategory,
        id_sub_category: this.currentId++,
      };
      this.subCategories.push(newSubCategory);
      callback(null, newSubCategory);
    } catch (error) {
      callback(error as Error);
    }
  }

  async update(id: string, data: Partial<SubCategory>): Promise<SubCategory> {
    const subCategoryId = parseInt(id, 10);
    const index = this.subCategories.findIndex((s) => s.id_sub_category === subCategoryId);
    if (index === -1) {
      throw new Error(`SubCategory with id ${id} not found`);
    }
    this.subCategories[index] = {
      ...this.subCategories[index]!,
      ...data,
    };
    return this.subCategories[index]!;
  }

  async findById(id: string): Promise<SubCategory | null> {
    const subCategoryId = parseInt(id, 10);
    const subCategory = this.subCategories.find((s) => s.id_sub_category === subCategoryId);
    return subCategory || null;
  }

  async findAll(): Promise<SubCategory[]> {
    return this.subCategories;
  }

  async delete(id: string): Promise<boolean> {
    const subCategoryId = parseInt(id, 10);
    const index = this.subCategories.findIndex((s) => s.id_sub_category === subCategoryId);
    if (index === -1) {
      return false;
    }
    this.subCategories.splice(index, 1);
    return true;
  }
}
