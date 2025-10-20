/**
 * DTO para listar productos con filtros y paginación
 */
export interface ListProductsDto {
  page?: number;
  limit?: number;
  id_category?: number;
  id_sub_category?: number;
  id_seller?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  sort_by?: 'price' | 'name' | 'created_at' | 'stock';
  sort_order?: 'asc' | 'desc';
}
