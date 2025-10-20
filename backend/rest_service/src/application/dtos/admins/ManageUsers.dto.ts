/**
 * DTOs para que el administrador gestione usuarios del sistema
 */

/**
 * DTO para listar todos los clientes
 */
export interface GetAllClientsDto {
  page?: number;
  limit?: number;
  status?: string; // Filtrar por estado activo/inactivo
}

/**
 * DTO para listar todos los vendedores
 */
export interface GetAllSellersDto {
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * DTO para activar/desactivar un cliente
 */
export interface ToggleClientStatusDto {
  id_client: number;
  status: 'active' | 'inactive';
  reason?: string;
}

/**
 * DTO para activar/desactivar un vendedor
 */
export interface ToggleSellerStatusDto {
  id_seller: number;
  status: 'active' | 'inactive';
  reason?: string;
}

/**
 * DTO para obtener estadísticas del sistema
 */
export interface GetSystemStatsDto {
  startDate?: Date;
  endDate?: Date;
}

/**
 * DTO de respuesta con estadísticas del sistema
 */
export interface SystemStatsResponseDto {
  totalClients: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeClients: number;
  activeSellers: number;
  pendingOrders: number;
}

/**
 * DTO para obtener un usuario por ID (cliente o vendedor)
 */
export interface GetUserByIdDto {
  userId: number;
  userType: 'client' | 'seller';
}
