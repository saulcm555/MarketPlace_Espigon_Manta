import { AddToCartDto } from "../../dtos/cart/AddToCart.dto";
import { CartService } from "../../../domain/services/CartService";
import { Cart } from "../../../domain/entities/cart";

/**
 * Caso de uso para agregar un producto al carrito
 */
export class AddToCart {
  constructor(private cartService: CartService) {}

  /**
   * Ejecuta la acción de agregar un producto al carrito
   * @param data - Datos para agregar al carrito
   * @returns Promise con el item del carrito creado
   */
  async execute(data: AddToCartDto): Promise<Cart> {
    // Validar datos requeridos
    if (!data.id_client || !data.id_product || !data.quantity) {
      throw new Error("Cliente, producto y cantidad son requeridos");
    }

    // Validar cantidad
    if (data.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    // Crear el item en el carrito
    const cartData: Partial<Cart> = {
      id_client: data.id_client,
      id_product: data.id_product,
      quantity: data.quantity,
      status: "active",
    };

    return await this.cartService.createCart(cartData as Cart);
  }
}
