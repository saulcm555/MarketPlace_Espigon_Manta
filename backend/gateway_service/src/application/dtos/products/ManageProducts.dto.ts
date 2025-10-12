/**
 * DTOs para actualizar y eliminar productos
 */

/**
 * DTO para actualizar un producto
 */
export interface UpdateProductDto {
  id_product: number;
  product_name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  id_category?: number;
  id_sub_category?: number;
}

/**
 * DTO para eliminar un producto
 */
export interface DeleteProductDto {
  id_product: number;
  id_seller: number; // Verificar que el vendedor sea el dueño del producto
}
