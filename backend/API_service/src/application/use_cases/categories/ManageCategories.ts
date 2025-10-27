import {
  UpdateCategoryDto,
  DeleteCategoryDto,
  UpdateSubCategoryDto,
  DeleteSubCategoryDto,
} from "../../dtos/categories/ManageCategories.dto";
import { CategoryService } from "../../../domain/services/CategoryService";
import { SubCategoryService } from "../../../domain/services/SubCategoryService";
import { Category } from "../../../domain/entities/category";
import { SubCategory } from "../../../domain/entities/sub_category";

/**
 * Casos de uso para actualizar y eliminar categorías y subcategorías
 */
export class ManageCategories {
  constructor(
    private categoryService: CategoryService,
    private subCategoryService: SubCategoryService
  ) {}

  /**
   * Actualizar una categoría
   */
  async updateCategory(data: UpdateCategoryDto): Promise<Category> {
    if (!data.id_category) {
      throw new Error("ID de categoría es requerido");
    }

    const category = await this.categoryService.getCategoryById(
      data.id_category.toString()
    );

    if (!category) {
      throw new Error(`Categoría con ID ${data.id_category} no encontrada`);
    }

    const updateData: Partial<Category> = {};
    if (data.category_name) updateData.category_name = data.category_name;
    if (data.description) updateData.description = data.description;
    if (data.photo) updateData.photo = data.photo;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    return await this.categoryService.updateCategory(
      data.id_category.toString(),
      updateData
    );
  }

  /**
   * Eliminar una categoría
   */
  async deleteCategory(data: DeleteCategoryDto): Promise<boolean> {
    if (!data.id_category) {
      throw new Error("ID de categoría es requerido");
    }

    const category = await this.categoryService.getCategoryById(
      data.id_category.toString()
    );

    if (!category) {
      throw new Error(`Categoría con ID ${data.id_category} no encontrada`);
    }

    return await this.categoryService.deleteCategory(
      data.id_category.toString()
    );
  }

  /**
   * Actualizar una subcategoría
   */
  async updateSubCategory(data: UpdateSubCategoryDto): Promise<SubCategory> {
    if (!data.id_sub_category) {
      throw new Error("ID de subcategoría es requerido");
    }

    const subCategory = await this.subCategoryService.getSubCategoryById(
      data.id_sub_category.toString()
    );

    if (!subCategory) {
      throw new Error(
        `Subcategoría con ID ${data.id_sub_category} no encontrada`
      );
    }

    const updateData: Partial<SubCategory> = {};
    if (data.sub_category_name)
      updateData.sub_category_name = data.sub_category_name;
    if (data.description) updateData.description = data.description;
    if (data.id_category) updateData.id_category = data.id_category;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    return await this.subCategoryService.updateSubCategory(
      data.id_sub_category.toString(),
      updateData
    );
  }

  /**
   * Eliminar una subcategoría
   */
  async deleteSubCategory(data: DeleteSubCategoryDto): Promise<boolean> {
    if (!data.id_sub_category) {
      throw new Error("ID de subcategoría es requerido");
    }

    const subCategory = await this.subCategoryService.getSubCategoryById(
      data.id_sub_category.toString()
    );

    if (!subCategory) {
      throw new Error(
        `Subcategoría con ID ${data.id_sub_category} no encontrada`
      );
    }

    return await this.subCategoryService.deleteSubCategory(
      data.id_sub_category.toString()
    );
  }
}
