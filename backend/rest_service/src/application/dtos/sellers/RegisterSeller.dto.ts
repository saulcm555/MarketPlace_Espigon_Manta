/**
 * DTO para registrar un nuevo vendedor
 */
export interface RegisterSellerDto {
  seller_name: string;
  seller_email: string;
  seller_password: string;
  phone: number;
  bussines_name: string;
  location: string;
}
