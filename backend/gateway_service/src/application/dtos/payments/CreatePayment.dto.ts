/**
 * DTO para crear un pago
 */
export interface CreatePaymentDto {
  id_order: number;
  id_payment_method: number;
  amount: number;
  payment_details?: string; // Detalles adicionales del pago (número de transacción, etc.)
}
