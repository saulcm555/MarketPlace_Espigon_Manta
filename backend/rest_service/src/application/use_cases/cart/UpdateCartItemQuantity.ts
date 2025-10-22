import { UpdateCartItemQuantityDto } from "../../dtos/cart/UpdateCartItemQuantity.dto";
import { ProductCart } from "../../../domain/entities/cart";
import AppDataSource from "../../../infrastructure/database/data-source";
import { ProductCartEntity } from "../../../models/cartModel";
import { ProductEntity } from "../../../models/productModel";

/**
 * Caso de uso para actualizar la cantidad de un producto en el carrito (tabla transaccional ProductCart)
 */
export class UpdateCartItemQuantity {
  /**
   * Ejecuta la acción de actualizar cantidad de un producto en el carrito
   * @param data - Datos para actualizar cantidad
   * @returns Promise con el item del carrito actualizado
   */
  async execute(data: UpdateCartItemQuantityDto): Promise<ProductCart> {
    // Validar datos requeridos
    if (!data.id_cart || !data.id_product || !data.quantity) {
      throw new Error("ID del carrito, producto y cantidad son requeridos");
    }

    // Validar cantidad
    if (data.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    const productCartRepo = AppDataSource.getRepository(ProductCartEntity);
    const productRepo = AppDataSource.getRepository(ProductEntity);

    // Buscar el item por id_cart e id_product
    const item = await productCartRepo.findOne({
      where: { 
        id_cart: data.id_cart,
        id_product: data.id_product 
      },
      relations: ["product"],
    });

    if (!item) {
      throw new Error(
        `Producto no encontrado en el carrito`
      );
    }

    // Verificar que el producto tiene stock suficiente
    const product = await productRepo.findOne({
      where: { id_product: item.id_product },
    });

    if (!product) {
      throw new Error(`Producto no encontrado`);
    }

    if (product.stock < data.quantity) {
      throw new Error(
        `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${data.quantity}`
      );
    }

    // Actualizar cantidad
    item.quantity = data.quantity;
    item.updated_at = new Date();

    const updated = await productCartRepo.save(item);
    return updated as unknown as ProductCart;
  }
}
