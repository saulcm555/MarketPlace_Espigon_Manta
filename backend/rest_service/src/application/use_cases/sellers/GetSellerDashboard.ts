import {
  GetSellerDashboardDto,
  SellerDashboardResponseDto,
} from "../../dtos/sellers/GetSellerDashboard.dto";
import { SellerService } from "../../../domain/services/SellerService";
import { ProductService } from "../../../domain/services/ProductService";
import { OrderService } from "../../../domain/services/OrderService";

/**
 * Caso de uso para obtener el dashboard del vendedor con estadísticas
 */
export class GetSellerDashboard {
  constructor(
    private sellerService: SellerService,
    private productService: ProductService,
    private orderService: OrderService
  ) {}

  /**
   * Ejecuta la obtención del dashboard
   * @param data - Datos para obtener el dashboard
   * @returns Promise con el dashboard del vendedor
   */
  async execute(
    data: GetSellerDashboardDto
  ): Promise<SellerDashboardResponseDto> {
    if (!data.id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const seller = await this.sellerService.getSellerById(
      data.id_seller.toString()
    );

    if (!seller) {
      throw new Error(`Vendedor con ID ${data.id_seller} no encontrado`);
    }

    // Obtener productos del vendedor
    const allProducts = await this.productService.getAllProducts();
    const sellerProducts = allProducts.filter(
      (p) => p.id_seller === data.id_seller
    );

    // Obtener órdenes (simplificado - en realidad necesitaríamos relaciones)
    const allOrders = await this.orderService.getAllOrders();

    // Calcular estadísticas
    const total_products = sellerProducts.length;
    const active_products = sellerProducts.filter((p) => p.stock > 0).length;
    const low_stock_products = sellerProducts.filter(
      (p) => p.stock > 0 && p.stock < 10
    ).length;

    const completed_orders = allOrders.filter(
      (o) => o.status === "delivered"
    ).length;
    const pending_orders = allOrders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;
    const cancelled_orders = allOrders.filter(
      (o) => o.status === "cancelled"
    ).length;

    const total_sales = completed_orders;
    const total_revenue = allOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.total_amount, 0);

    // Obtener órdenes recientes
    const recent_orders = allOrders
      .sort(
        (a, b) =>
          new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
      )
      .slice(0, 5)
      .map((o) => ({
        id_order: o.id_order,
        order_date: o.order_date,
        total_amount: o.total_amount,
        status: o.status,
      }));

    return {
      id_seller: seller.id_seller,
      seller_name: seller.seller_name,
      bussines_name: seller.bussines_name,
      statistics: {
        total_products,
        active_products,
        total_sales,
        total_revenue,
        pending_orders,
        completed_orders,
        cancelled_orders,
        low_stock_products,
      },
      recent_orders,
      top_products: [], // TODO: Implementar lógica para productos top
    };
  }
}
