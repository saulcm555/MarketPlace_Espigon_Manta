/**
 * DTOs para consultar órdenes
 */

/**
 * DTO para obtener una orden por su ID
 */
export interface GetOrderByIdDto {
  id_order: number;
}

/**
 * DTO para listar todas las órdenes de un cliente
 */
export interface GetClientOrdersDto {
  id_client: number;
  status?: string; // Opcional: filtrar por estado
  page?: number;
  limit?: number;
}

/**
 * DTO para listar órdenes de productos de un vendedor
 */
export interface GetSellerOrdersDto {
  id_seller: number;
  status?: string;
  page?: number;
  limit?: number;
}

/**
 * DTO de respuesta con información de la orden
 */
export interface OrderResponseDto {
  id_order: number;
  order_date: Date;
  status: string;
  total_amount: number;
  delivery_type: string;
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  client?: {
    id_client: number;
    client_name: string;
    client_email: string;
    address: string;
  };
  paymentMethod?: {
    id_payment_method: number;
    method_name: string;
  };
}
