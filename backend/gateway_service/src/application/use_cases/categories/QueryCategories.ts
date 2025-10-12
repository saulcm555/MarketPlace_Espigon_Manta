import {
  GetAllCategoriesDto,
  GetCategoryByIdDto,
  GetSubCategoriesDto,
  GetSubCategoryByIdDto,
  CategoryResponseDto,
  SubCategoryResponseDto,
} from "../../dtos/categories/QueryCategories.dto";
import { CategoryService } from "../../../domain/services/CategoryService";
import { SubCategoryService } from "../../../domain/services/SubCategoryService";
import { Category } from "../../../domain/entities/category";
import { SubCategory } from "../../../domain/entities/sub_category";

/**
 * Casos de uso para consultar categorías y subcategorías
 */
export class QueryCategories {
  constructor(
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService
  ) {}

  /**
   * Obtener todas las categorías
   */
  async getAllCategories(data: GetAllCategoriesDto): Promise<Category[]> {
    const categories = await this.categoryService.getAllCategories();

    if (data.includeSubcategories) {
      // Incluir subcategorías en cada categoría
      const categoriesWithSubs = await Promise.all(
        categories.map(async (category) => {
          const subcategories = await this.getSubCategories({
            id_category: category.id_category,
          });
          return { ...category, subcategories };
        })
      );
      return categoriesWithSubs;
    }

    return categories;
  }

  /**
   * Obtener una categoría por ID
   */
  async getCategoryById(data: GetCategoryByIdDto): Promise<Category | null> {
    if (!data.id_category) {
      throw new Error("ID de categoría es requerido");
    }

    const category = await this.categoryService.getCategoryById(
      data.id_category.toString()
    );

    if (!category) {
      return null;
    }

    if (data.includeSubcategories) {
      const subcategories = await this.getSubCategories({
        id_category: data.id_category,
      });
      return { ...category, subcategories };
    }

    return category;
  }

  /**
   * Obtener todas las subcategorías de una categoría
   */
  async getSubCategories(data: GetSubCategoriesDto): Promise<SubCategory[]> {
    if (!data.id_category) {
      throw new Error("ID de categoría es requerido");
    }

    const allSubCategories = await this.subCategoryService.getAllSubCategories();
    return allSubCategories.filter(
      (sub) => sub.id_category === data.id_category
    );
  }

  /**
   * Obtener una subcategoría por ID
   */
  async getSubCategoryById(
    data: GetSubCategoryByIdDto
  ): Promise<SubCategory | null> {
    if (!data.id_sub_category) {
      throw new Error("ID de subcategoría es requerido");
    }

    return await this.subCategoryService.getSubCategoryById(
      data.id_sub_category.toString()
    );
  }
}
