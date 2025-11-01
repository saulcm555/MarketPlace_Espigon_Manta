/**
 * DTOs para que el admin gestione productos
 */

/**
 * DTO para aprobar un producto
 */
export interface ApproveProductDto {
  id_product: number;
  id_admin: number;
}

/**
 * DTO para rechazar un producto
 */
export interface RejectProductDto {
  id_product: number;
  id_admin: number;
  reason: string;
}

/**
 * DTO para listar productos pendientes de aprobación
 */
export interface GetPendingProductsDto {
  page?: number;
  limit?: number;
}

/**
 * DTO para eliminar un producto (admin)
 */
export interface DeleteProductByAdminDto {
  id_product: number;
  id_admin: number;
  reason: string;
}
