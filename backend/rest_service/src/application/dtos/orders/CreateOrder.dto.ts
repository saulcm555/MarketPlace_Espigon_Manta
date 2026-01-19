/**
 * DTO para crear una nueva orden
 */
export interface CreateOrderDto {
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  delivery_type: string; // 'home_delivery', 'pickup', etc.
  delivery_address?: string; // Dirección de entrega si es delivery
  payment_receipt_url?: string; // URL del comprobante de pago (para transferencias)
  coupon_code?: string; // Código de cupón de descuento (opcional)
  customer_email?: string; // Email del cliente para validar cupón
  // Productos de la orden (tabla transaccional ProductOrder)
  productOrders?: {
    id_product: number;
    quantity: number;
    price_unit: number;
  }[];
}
