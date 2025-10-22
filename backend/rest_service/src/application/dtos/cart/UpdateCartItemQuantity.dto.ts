/**
 * DTO para actualizar la cantidad de un producto en el carrito (tabla transaccional ProductCart)
 */
export interface UpdateCartItemQuantityDto {
  id_cart: number;
  id_product: number;
  quantity: number;
}
