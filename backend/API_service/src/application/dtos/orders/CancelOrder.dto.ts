/**
 * DTO para cancelar una orden
 */
export interface CancelOrderDto {
  id_order: number;
  id_client: number; // Verificar que el cliente sea el dueño de la orden
  reason?: string; // Razón de la cancelación
}
