import {
  GetPaymentByIdDto,
  GetPaymentsByOrderDto,
  GetClientPaymentsDto,
} from "../../dtos/payments/QueryPayments.dto";
import { PaymentMethodService } from "../../../domain/services/PaymentMethodService";
import { OrderService } from "../../../domain/services/OrderService";
import { PaymentMethod } from "../../../domain/entities/payment_method";
import { Order } from "../../../domain/entities/order";

/**
 * Casos de uso para consultar métodos de pago
 */
export class QueryPayments {
  constructor(
    private paymentMethodService: PaymentMethodService,
    private orderService: OrderService
  ) {}

  /**
   * Obtener un método de pago por ID
   */
  async getPaymentById(
    data: GetPaymentByIdDto
  ): Promise<PaymentMethod | null> {
    if (!data.id_payment_method) {
      throw new Error("ID de método de pago es requerido");
    }

    return await this.paymentMethodService.getPaymentMethodById(
      data.id_payment_method.toString()
    );
  }

  /**
   * Obtener el método de pago de una orden específica
   */
  async getPaymentsByOrder(data: GetPaymentsByOrderDto): Promise<PaymentMethod | null> {
    if (!data.id_order) {
      throw new Error("ID de orden es requerido");
    }

    const order = await this.orderService.getOrderById(
      data.id_order.toString()
    );

    if (!order) {
      throw new Error(`Orden con ID ${data.id_order} no encontrada`);
    }

    return await this.paymentMethodService.getPaymentMethodById(
      order.id_payment_method.toString()
    );
  }

  /**
   * Obtener historial de pagos de un cliente (a través de sus órdenes)
   */
  async getClientPayments(data: GetClientPaymentsDto): Promise<Order[]> {
    if (!data.id_client) {
      throw new Error("ID de cliente es requerido");
    }

    const allOrders = await this.orderService.getAllOrders();
    const clientOrders = allOrders.filter(
      (order) => order.id_client === data.id_client
    );

    // Ordenar por fecha descendente
    clientOrders.sort(
      (a, b) =>
        new Date(b.order_date).getTime() - new Date(a.order_date).getTime()
    );

    return clientOrders;
  }

  /**
   * Obtener todos los métodos de pago disponibles
   */
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return await this.paymentMethodService.getAllPaymentMethods();
  }
}


