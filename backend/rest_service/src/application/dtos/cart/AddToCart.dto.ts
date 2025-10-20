/**
 * DTO para agregar un producto al carrito
 */
export interface AddToCartDto {
  id_client: number;
  id_product: number;
  quantity: number;
}
