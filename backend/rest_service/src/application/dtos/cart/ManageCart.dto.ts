/**
 * DTOs para gestionar el carrito de compras
 */

/**
 * DTO para obtener el carrito de un cliente
 */
export interface GetCartDto {
  id_client: number;
}

/**
 * DTO para actualizar la cantidad de un producto en el carrito
 */
export interface UpdateCartItemDto {
  id_cart: number;
  quantity: number;
}

/**
 * DTO para eliminar un producto del carrito
 */
export interface RemoveFromCartDto {
  id_cart: number;
}

/**
 * DTO para vaciar completamente el carrito de un cliente
 */
export interface ClearCartDto {
  id_client: number;
}

/**
 * DTO de respuesta con los items del carrito
 */
export interface CartResponseDto {
  id_cart: number;
  id_client: number;
  id_product: number;
  quantity: number;
  status: string;
  product?: {
    id_product: number;
    product_name: string;
    description: string;
    price: number;
    image_url: string;
  };
}
