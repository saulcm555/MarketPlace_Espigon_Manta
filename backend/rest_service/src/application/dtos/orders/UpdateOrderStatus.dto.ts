/**
 * DTO para actualizar el estado de una orden
 */
export interface UpdateOrderStatusDto {
  id_order: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'payment_pending_verification' | 'payment_confirmed' | 'payment_rejected' | 'expired';
  updated_by?: 'client' | 'seller' | 'admin'; // Quién actualiza el estado
  notes?: string; // Notas sobre la actualización
}
