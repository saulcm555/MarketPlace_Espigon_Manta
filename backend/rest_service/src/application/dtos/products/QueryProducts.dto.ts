/**
 * DTOs para consultar y buscar productos
 */

/**
 * DTO para obtener un producto por su ID
 */
export interface GetProductByIdDto {
  id_product: number;
}

/**
 * DTO para buscar productos por nombre o descripción
 */
export interface SearchProductsDto {
  searchTerm: string;
  page?: number;
  limit?: number;
}

/**
 * DTO para filtrar productos por categoría
 */
export interface GetProductsByCategoryDto {
  id_category: number;
  id_sub_category?: number; // Opcional: filtrar también por subcategoría
  page?: number;
  limit?: number;
}

/**
 * DTO para obtener productos de un vendedor específico
 */
export interface GetProductsBySellerDto {
  id_seller: number;
  page?: number;
  limit?: number;
}

/**
 * DTO de respuesta con información del producto
 */
export interface ProductResponseDto {
  id_product: number;
  id_seller: number;
  id_category: number;
  id_sub_category: number;
  product_name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  created_at: Date;
  category?: {
    id_category: number;
    category_name: string;
  };
  subcategory?: {
    id_sub_category: number;
    sub_category_name: string;
  };
}
