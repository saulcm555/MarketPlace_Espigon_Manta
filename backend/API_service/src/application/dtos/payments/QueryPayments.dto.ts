/**
 * DTOs para consultar pagos
 */

/**
 * DTO para obtener un pago por su ID
 */
export interface GetPaymentByIdDto {
  id_payment_method: number;
}

/**
 * DTO para obtener todos los pagos de una orden
 */
export interface GetPaymentsByOrderDto {
  id_order: number;
}

/**
 * DTO para obtener el historial de pagos de un cliente
 */
export interface GetClientPaymentsDto {
  id_client: number;
  page?: number;
  limit?: number;
}

/**
 * DTO de respuesta con información del método de pago
 */
export interface PaymentMethodResponseDto {
  id_payment_method: number;
  method_name: string;
  details_payment: string;
}

/**
 * DTO de respuesta con información completa del pago
 */
export interface PaymentResponseDto {
  id_payment_method: number;
  method_name: string;
  details_payment: string;
  order?: {
    id_order: number;
    total_amount: number;
    order_date: Date;
    status: string;
  };
}
