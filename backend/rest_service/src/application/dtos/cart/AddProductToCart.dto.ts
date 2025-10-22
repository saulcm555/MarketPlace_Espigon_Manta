/**
 * DTO para agregar un producto al carrito (tabla transaccional ProductCart)
 */
export interface AddProductToCartDto {
  id_cart: number;
  id_product: number;
  quantity: number;
}
