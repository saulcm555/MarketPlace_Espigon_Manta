/**
 * DTO para actualizar el estado de una orden
 */
export interface UpdateOrderStatusDto {
  id_order: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  updated_by?: 'client' | 'seller' | 'admin'; // Quién actualiza el estado
  notes?: string; // Notas sobre la actualización
}
