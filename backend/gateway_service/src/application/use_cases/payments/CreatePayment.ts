import { CreatePaymentDto } from "../../dtos/payments/CreatePayment.dto";
import { PaymentMethodService } from "../../../domain/services/PaymentMethodService";
import { OrderService } from "../../../domain/services/OrderService";
import { PaymentMethod } from "../../../domain/entities/payment_method";

/**
 * Caso de uso para crear/registrar un método de pago
 */
export class CreatePayment {
  constructor(
    private paymentMethodService: PaymentMethodService,
    private orderService: OrderService
  ) {}

  /**
   * Ejecuta la creación de un método de pago
   * @param data - Datos del pago a crear
   * @returns Promise con el método de pago creado
   */
  async execute(data: CreatePaymentDto): Promise<PaymentMethod> {
    return new Promise(async (resolve, reject) => {
      try {
        // Validar datos requeridos
        if (!data.id_order || !data.id_payment_method || !data.amount) {
          reject(
            new Error("Orden, método de pago y monto son requeridos")
          );
          return;
        }

        // Validar que el monto sea positivo
        if (data.amount <= 0) {
          reject(new Error("El monto debe ser mayor a 0"));
          return;
        }

        // Verificar que la orden existe
        const order = await this.orderService.getOrderById(
          data.id_order.toString()
        );

        if (!order) {
          reject(new Error(`Orden con ID ${data.id_order} no encontrada`));
          return;
        }

        // Verificar que el método de pago existe
        const paymentMethod =
          await this.paymentMethodService.getPaymentMethodById(
            data.id_payment_method.toString()
          );

        if (!paymentMethod) {
          reject(
            new Error(
              `Método de pago con ID ${data.id_payment_method} no encontrado`
            )
          );
          return;
        }

        // TODO: Aquí se integraría con pasarela de pagos real
        // Por ahora solo retornamos el método de pago

        resolve(paymentMethod);
      } catch (error) {
        reject(error);
      }
    });
  }
}
