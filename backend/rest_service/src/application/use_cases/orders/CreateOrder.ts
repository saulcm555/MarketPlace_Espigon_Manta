import { CreateOrderDto } from "../../dtos/orders/CreateOrder.dto";
import { OrderService } from "../../../domain/services/OrderService";
import { CartService } from "../../../domain/services/CartService";
import { Order } from "../../../domain/entities/order";

/**
 * Caso de uso para crear una nueva orden a partir de un carrito
 */
export class CreateOrder {
  constructor(
    private orderService: OrderService,
    private cartService: CartService
  ) {}

  /**
   * Ejecuta la creación de una nueva orden
   * @param data - Datos de la orden a crear
   * @returns Promise con la orden creada
   */
  async execute(data: CreateOrderDto): Promise<Order> {
    return new Promise(async (resolve, reject) => {
      try {
        // Validar datos requeridos
        if (
          !data.id_client ||
          !data.id_cart ||
          !data.id_payment_method ||
          !data.delivery_type
        ) {
          reject(
            new Error(
              "Cliente, carrito, método de pago y tipo de entrega son requeridos"
            )
          );
          return;
        }

        // Obtener el carrito para calcular el total
        const cart = await this.cartService.getCartById(
          data.id_cart.toString()
        );

        if (!cart) {
          reject(new Error(`Carrito con ID ${data.id_cart} no encontrado`));
          return;
        }

        // Calcular total_amount basado en el carrito
        // (Nota: esto es una simplificación, idealmente calcularíamos desde cart items)
        const total_amount = 0; // TODO: Calcular desde los items del carrito

        const orderData: Partial<Order> = {
          id_client: data.id_client,
          id_cart: data.id_cart,
          id_payment_method: data.id_payment_method,
          delivery_type: data.delivery_type,
          total_amount,
          order_date: new Date(),
          status: "pending", // Estado inicial
        };

        this.orderService.createOrder(orderData as Order, (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve(result);
          } else {
            reject(new Error("Error al crear la orden"));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
