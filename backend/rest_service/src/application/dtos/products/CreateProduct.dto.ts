/**
 * DTO para crear un nuevo producto
 */
export interface CreateProductDto {
  id_seller: number;
  id_category: number;
  id_sub_category?: number;
  id_inventory?: number;
  product_name: string;
  description?: string;
  price?: number;
  stock?: number;
  image_url?: string;
  // Aliases para compatibilidad con el frontend
  product_description?: string;
  product_price?: number;
  product_image?: string;
}
