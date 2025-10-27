/**
 * DTO para actualizar el stock de un producto
 */
export interface UpdateStockDto {
  id_product: number;
  id_seller: number; // Verificar que el vendedor sea el dueño
  stock: number; // Nuevo stock
  operation?: 'set' | 'add' | 'subtract'; // Tipo de operación: establecer, agregar o restar
}
