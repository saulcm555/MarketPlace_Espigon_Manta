/**
 * DTOs para gestionar vendedores
 */

/**
 * DTO para el login del vendedor
 */
export interface LoginSellerDto {
  seller_email: string;
  seller_password: string;
}

/**
 * DTO para actualizar el perfil del vendedor
 */
export interface UpdateSellerProfileDto {
  id_seller: number;
  seller_name?: string;
  seller_email?: string;
  seller_password?: string;
  phone?: number;
  bussines_name?: string;
  location?: string;
}

/**
 * DTO de respuesta con información del vendedor
 */
export interface SellerResponseDto {
  id_seller: number;
  seller_name: string;
  seller_email: string;
  phone: number;
  bussines_name: string;
  location: string;
  created_at: Date;
}
