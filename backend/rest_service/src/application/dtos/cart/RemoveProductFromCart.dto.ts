/**
 * DTO para quitar un producto del carrito (tabla transaccional ProductCart)
 */
export interface RemoveProductFromCartDto {
  id_cart: number;
  id_product: number;
}
