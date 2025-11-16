import { UpdateOrderStatusDto } from "../../dtos/orders/UpdateOrderStatus.dto";
import { OrderService } from "../../../domain/services/OrderService";
import { Order } from "../../../domain/entities/order";
import { notifyOrderUpdated } from "../../../infrastructure/clients/notificationClient";
import { notifySellerStatsUpdated, notifyAdminStatsUpdated } from "../../../infrastructure/clients/statsEventClient";

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

    const updatedOrder = await this.orderService.updateOrder(
      data.id_order.toString(),
      updateData
    );

    // 🔔 NOTIFICACIÓN: Enviar notificación de orden actualizada
    if (updatedOrder) {
      const clientId = updatedOrder.id_client?.toString() || '';
      
      // Obtener el seller_id del primer producto (si está disponible)
      const sellerId = updatedOrder.productOrders?.[0]?.product?.id_seller?.toString() || '';
      
      // Solo enviar si tenemos los IDs necesarios
      if (clientId && sellerId) {
        // Enviar notificación (async, no bloqueante)
        notifyOrderUpdated(
          updatedOrder.id_order,
          clientId,
          sellerId,
          updatedOrder.status,
          {
            total_amount: updatedOrder.total_amount,
            order_date: updatedOrder.order_date
          }
        ).catch(err => {
          console.error('Error sending order update notification:', err);
        });

        // 📊 NOTIFICACIÓN DE ESTADÍSTICAS: Notificar actualización de stats
        notifySellerStatsUpdated(sellerId, {
          order_id: updatedOrder.id_order,
          status: updatedOrder.status,
          action: 'status_updated'
        }).catch(err => console.error('Error notifying seller stats:', err));
      }
      
      // También notificar a admin
      notifyAdminStatsUpdated({
        order_id: updatedOrder.id_order,
        status: updatedOrder.status,
        action: 'status_updated'
      }).catch(err => console.error('Error notifying admin stats:', err));
    }

    return updatedOrder;
  }

  /**
   * Valida si una transición de estado es permitida
   */
  private isValidTransition(
    currentStatus: string,
    newStatus: string
  ): boolean {
    const allowedTransitions: Record<string, string[]> = {
      pending: ["processing", "delivered", "cancelled"], // Agregado "delivered" para pagos en efectivo
      payment_pending_verification: ["payment_confirmed", "payment_rejected", "cancelled"],
      payment_confirmed: ["processing", "delivered", "cancelled"],
      payment_rejected: ["cancelled"],
      processing: ["shipped", "delivered", "cancelled"],
      shipped: ["delivered"],
      delivered: [], // Estado final
      cancelled: [], // Estado final
      expired: [], // Estado final
    };

    return (
      allowedTransitions[currentStatus]?.includes(newStatus) ?? false
    );
  }
}
