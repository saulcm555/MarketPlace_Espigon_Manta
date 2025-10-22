/**
 * DTO para crear una nueva orden
 */
export interface CreateOrderDto {
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  delivery_type: string; // 'home_delivery', 'pickup', etc.
  delivery_address?: string; // Dirección de entrega si es delivery
  // Productos de la orden (tabla transaccional ProductOrder)
  productOrders?: {
    id_product: number;
    quantity: number;
    price_unit: number;
  }[];
}
