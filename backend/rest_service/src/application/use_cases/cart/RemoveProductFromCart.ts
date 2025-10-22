import { RemoveProductFromCartDto } from "../../dtos/cart/RemoveProductFromCart.dto";
import AppDataSource from "../../../infrastructure/database/data-source";
import { ProductCartEntity } from "../../../models/cartModel";

/**
 * Caso de uso para quitar un producto de un carrito (tabla transaccional ProductCart)
 */
export class RemoveProductFromCart {
  /**
   * Ejecuta la acción de quitar un producto del carrito
   * @param data - Datos para quitar producto del carrito
   * @returns Promise con boolean indicando éxito
   */
  async execute(data: RemoveProductFromCartDto): Promise<boolean> {
    // Validar datos requeridos
    if (!data.id_cart || !data.id_product) {
      throw new Error("ID del carrito y del producto son requeridos");
    }

    const productCartRepo = AppDataSource.getRepository(ProductCartEntity);

    // Buscar el item por id_cart e id_product
    const item = await productCartRepo.findOne({
      where: { 
        id_cart: data.id_cart,
        id_product: data.id_product 
      },
    });

    if (!item) {
      throw new Error(
        `Producto no encontrado en el carrito`
      );
    }

    // Eliminar el item
    const result = await productCartRepo.delete(item.id_product_cart);

    return !!result.affected && result.affected > 0;
  }
}
