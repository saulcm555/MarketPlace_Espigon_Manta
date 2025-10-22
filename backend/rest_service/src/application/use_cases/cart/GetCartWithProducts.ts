import { Cart } from "../../../domain/entities/cart";
import AppDataSource from "../../../infrastructure/database/data-source";
import { CartEntity } from "../../../models/cartModel";

/**
 * Caso de uso para obtener un carrito con todos sus productos (relación con ProductCart)
 */
export class GetCartWithProducts {
  /**
   * Ejecuta la acción de obtener un carrito con sus productos
   * @param id_cart - ID del carrito
   * @returns Promise con el carrito y sus productos
   */
  async execute(id_cart: number): Promise<Cart | null> {
    if (!id_cart) {
      throw new Error("ID del carrito es requerido");
    }

    const cartRepo = AppDataSource.getRepository(CartEntity);

    const cart = await cartRepo.findOne({
      where: { id_cart },
      relations: [
        "productCarts",
        "productCarts.product",
        "client",
      ],
    });

    if (!cart) {
      return null;
    }

    return cart as unknown as Cart;
  }
}
