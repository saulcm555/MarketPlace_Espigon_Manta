/**
 * DTO para obtener el dashboard del vendedor
 */
export interface GetSellerDashboardDto {
  id_seller: number;
  date_from?: Date; // Fecha inicio para estadísticas
  date_to?: Date; // Fecha fin para estadísticas
}

/**
 * DTO de respuesta con estadísticas del vendedor
 */
export interface SellerDashboardResponseDto {
  id_seller: number;
  seller_name: string;
  bussines_name: string;
  statistics: {
    total_products: number;
    active_products: number;
    total_sales: number;
    total_revenue: number;
    pending_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    average_rating?: number;
    low_stock_products: number;
  };
  recent_orders?: Array<{
    id_order: number;
    order_date: Date;
    total_amount: number;
    status: string;
  }>;
  top_products?: Array<{
    id_product: number;
    product_name: string;
    total_sold: number;
    revenue: number;
  }>;
}
