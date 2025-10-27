/**
 * DTOs para consultar inventario
 */

/**
 * DTO para obtener el inventario de un producto específico
 */
export interface GetInventoryByProductDto {
  id_product: number;
}

/**
 * DTO para obtener todo el inventario de un vendedor
 */
export interface GetSellerInventoryDto {
  id_seller: number;
  page?: number;
  limit?: number;
}

/**
 * DTO de respuesta con información del inventario
 */
export interface InventoryResponseDto {
  id_inventory: number;
  id_seller: number;
  updated_at: Date;
  products?: {
    id_product: number;
    product_name: string;
    stock: number;
    price: number;
  }[];
}
