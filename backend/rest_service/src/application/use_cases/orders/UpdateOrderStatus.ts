import { UpdateOrderStatusDto } from "../../dtos/orders/UpdateOrderStatus.dto";
import { OrderService } from "../../../domain/services/OrderService";
import { Order } from "../../../domain/entities/order";

/**
 * Caso de uso para actualizar el estado de una orden
 */
export class UpdateOrderStatus {
  constructor(private orderService: OrderService) {}

  /**
   * Ejecuta la actualización del estado de una orden
   * @param data - Datos para actualizar el estado
   * @returns Promise con la orden actualizada
   */
  async execute(data: UpdateOrderStatusDto): Promise<Order> {
    if (!data.id_order || !data.status) {
      throw new Error("ID de orden y nuevo estado son requeridos");
    }

    const order = await this.orderService.getOrderById(
      data.id_order.toString()
    );

    if (!order) {
      throw new Error(`Orden con ID ${data.id_order} no encontrada`);
    }

    // Validar transiciones de estado permitidas
    if (!this.isValidTransition(order.status, data.status)) {
      throw new Error(
        `No se puede cambiar de estado ${order.status} a ${data.status}`
      );
    }

    const updateData: Partial<Order> = {
      status: data.status,
    };

    return await this.orderService.updateOrder(
      data.id_order.toString(),
      updateData
    );
  }

  /**
   * Valida si una transición de estado es permitida
   */
  private isValidTransition(
    currentStatus: string,
    newStatus: string
  ): boolean {
    const allowedTransitions: Record<string, string[]> = {
      pending: ["processing", "cancelled"],
      processing: ["shipped", "cancelled"],
      shipped: ["delivered"],
      delivered: [], // Estado final
      cancelled: [], // Estado final
    };

    return (
      allowedTransitions[currentStatus]?.includes(newStatus) ?? false
    );
  }
}
