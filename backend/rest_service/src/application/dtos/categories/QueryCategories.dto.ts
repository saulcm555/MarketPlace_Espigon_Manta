/**
 * DTOs para consultar categorías y subcategorías
 */

/**
 * DTO para obtener todas las categorías
 * No requiere parámetros, retorna todas las categorías con sus subcategorías
 */
export interface GetAllCategoriesDto {
  includeSubcategories?: boolean; // Si incluir subcategorías en la respuesta
}

/**
 * DTO para obtener una categoría por su ID
 */
export interface GetCategoryByIdDto {
  id_category: number;
  includeSubcategories?: boolean;
}

/**
 * DTO para obtener todas las subcategorías de una categoría
 */
export interface GetSubCategoriesDto {
  id_category: number;
}

/**
 * DTO para obtener una subcategoría por su ID
 */
export interface GetSubCategoryByIdDto {
  id_sub_category: number;
}

/**
 * DTO de respuesta con información de categoría
 */
export interface CategoryResponseDto {
  id_category: number;
  category_name: string;
  description: string;
  photo: string;
  subcategories?: SubCategoryResponseDto[];
}

/**
 * DTO de respuesta con información de subcategoría
 */
export interface SubCategoryResponseDto {
  id_sub_category: number;
  id_category: number;
  sub_category_name: string;
  description: string;
}
