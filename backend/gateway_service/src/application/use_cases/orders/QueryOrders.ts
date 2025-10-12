import {
  GetOrderByIdDto,
  GetClientOrdersDto,
  GetSellerOrdersDto,
} from "../../dtos/orders/QueryOrders.dto";
import { OrderService } from "../../../domain/services/OrderService";
import { Order } from "../../../domain/entities/order";

/**
 * Casos de uso para consultar órdenes
 */
export class QueryOrders {
  constructor(private orderService: OrderService) {}

  /**
   * Obtener una orden por ID
   */
  async getOrderById(data: GetOrderByIdDto): Promise<Order | null> {
    if (!data.id_order) {
      throw new Error("ID de orden es requerido");
    }

    return await this.orderService.getOrderById(data.id_order.toString());
  }

  /**
   * Obtener todas las órdenes de un cliente
   */
  async getClientOrders(data: GetClientOrdersDto): Promise<Order[]> {
    if (!data.id_client) {
      throw new Error("ID de cliente es requerido");
    }

    const allOrders = await this.orderService.getAllOrders();
    let orders = allOrders.filter(
      (order) => order.id_client === data.id_client
    );

    // Filtrar por estado si se proporciona
    if (data.status) {
      orders = orders.filter((order) => order.status === data.status);
    }

    // Ordenar por fecha descendente (más reciente primero)
    orders.sort(
      (a, b) =>
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
    );

    return orders;
  }

  /**
   * Obtener órdenes que contienen productos de un vendedor
   * (Nota: requiere relaciones con productos en la entidad Order)
   */
  async getSellerOrders(data: GetSellerOrdersDto): Promise<Order[]> {
    if (!data.id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    // TODO: Implementar lógica para filtrar órdenes por vendedor
    // Esto requiere acceder a los productos del carrito asociado a cada orden
    const allOrders = await this.orderService.getAllOrders();

    // Filtrar por estado si se proporciona
    let orders = allOrders;
    if (data.status) {
      orders = orders.filter((order) => order.status === data.status);
    }

    return orders;
  }
}


