import { CancelOrderDto } from "../../dtos/orders/CancelOrder.dto";
import { OrderService } from "../../../domain/services/OrderService";
import { Order } from "../../../domain/entities/order";

/**
 * Caso de uso para cancelar una orden
 */
export class CancelOrder {
  constructor(private orderService: OrderService) {}

  /**
   * Ejecuta la cancelación de una orden
   * @param data - Datos para cancelar la orden
   * @returns Promise con la orden cancelada
   */
  async execute(data: CancelOrderDto): Promise<Order> {
    if (!data.id_order || !data.id_client) {
      throw new Error("ID de orden y cliente son requeridos");
    }

    const order = await this.orderService.getOrderById(
      data.id_order.toString()
    );

    if (!order) {
      throw new Error(`Orden con ID ${data.id_order} no encontrada`);
    }

    // Validar que el cliente sea el dueño de la orden
    if (order.id_client !== data.id_client) {
      throw new Error("No tienes permisos para cancelar esta orden");
    }

    // Validar que la orden pueda ser cancelada
    if (order.status === "delivered") {
      throw new Error("No se puede cancelar una orden ya entregada");
    }

    if (order.status === "cancelled") {
      throw new Error("La orden ya está cancelada");
    }

    // Actualizar el estado a cancelado
    const updateData: Partial<Order> = {
      status: "cancelled",
    };

    return await this.orderService.updateOrder(
      data.id_order.toString(),
      updateData
    );
  }
}
