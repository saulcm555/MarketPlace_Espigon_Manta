/**
 * DTOs para actualizar y eliminar categorías y subcategorías
 */

/**
 * DTO para actualizar una categoría
 */
export interface UpdateCategoryDto {
  id_category: number;
  category_name?: string;
  description?: string;
  photo?: string;
}

/**
 * DTO para eliminar una categoría
 */
export interface DeleteCategoryDto {
  id_category: number;
}

/**
 * DTO para actualizar una subcategoría
 */
export interface UpdateSubCategoryDto {
  id_sub_category: number;
  sub_category_name?: string;
  description?: string;
  id_category?: number; // Cambiar de categoría padre
}

/**
 * DTO para eliminar una subcategoría
 */
export interface DeleteSubCategoryDto {
  id_sub_category: number;
}
