import {
  GetCartDto,
  UpdateCartItemDto,
  RemoveFromCartDto,
  ClearCartDto,
  CartResponseDto,
} from "../../dtos/cart/ManageCart.dto";
import { CartService } from "../../../domain/services/CartService";
import { Cart } from "../../../domain/entities/cart";

/**
 * Casos de uso para gestionar el carrito
 */
export class ManageCart {
  constructor(private cartService: CartService) {}

  /**
   * Obtener el carrito de un cliente
   */
  async getCart(data: GetCartDto): Promise<Cart[]> {
    if (!data.id_client) {
      throw new Error("ID del cliente es requerido");
    }

    // Obtener todos los carts y filtrar por cliente
    const allCarts = await this.cartService.getAllCarts();
    return allCarts.filter(
      (cart) => cart.id_client === data.id_client && cart.status === "active"
    );
  }

  /**
   * Actualizar la cantidad de un producto en el carrito
   */
  async updateCartItem(data: UpdateCartItemDto): Promise<Cart> {
    if (!data.id_cart || !data.quantity) {
      throw new Error("ID del carrito y cantidad son requeridos");
    }

    if (data.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    // Verificar que el item existe
    const cart = await this.cartService.getCartById(data.id_cart.toString());
    if (!cart) {
      throw new Error(`Item de carrito con ID ${data.id_cart} no encontrado`);
    }

    // Actualizar cantidad
    return await this.cartService.updateCart(data.id_cart.toString(), {
      quantity: data.quantity,
    });
  }

  /**
   * Eliminar un producto del carrito
   */
  async removeFromCart(data: RemoveFromCartDto): Promise<boolean> {
    if (!data.id_cart) {
      throw new Error("ID del carrito es requerido");
    }

    // Verificar que el item existe
    const cart = await this.cartService.getCartById(data.id_cart.toString());
    if (!cart) {
      throw new Error(`Item de carrito con ID ${data.id_cart} no encontrado`);
    }

    // Eliminar el item
    return await this.cartService.deleteCart(data.id_cart.toString());
  }

  /**
   * Vaciar el carrito de un cliente
   */
  async clearCart(data: ClearCartDto): Promise<boolean> {
    if (!data.id_client) {
      throw new Error("ID del cliente es requerido");
    }

    // Obtener todos los items del carrito del cliente
    const cartItems = await this.getCart({ id_client: data.id_client });

    // Eliminar cada item
    const deletePromises = cartItems.map((item) =>
      this.cartService.deleteCart(item.id_cart.toString())
    );

    await Promise.all(deletePromises);
    return true;
  }
}
