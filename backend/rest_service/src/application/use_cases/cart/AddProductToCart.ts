import { AddProductToCartDto } from "../../dtos/cart/AddProductToCart.dto";
import { ProductCart } from "../../../domain/entities/cart";
import AppDataSource from "../../../infrastructure/database/data-source";
import { ProductCartEntity } from "../../../models/cartModel";
import { ProductEntity } from "../../../models/productModel";
import { CartEntity } from "../../../models/cartModel";

/**
 * Caso de uso para agregar un producto a un carrito (tabla transaccional ProductCart)
 */
export class AddProductToCart {
  /**
   * Ejecuta la acción de agregar un producto al carrito
   * @param data - Datos para agregar producto al carrito
   * @returns Promise con el item del carrito creado
   */
  async execute(data: AddProductToCartDto): Promise<ProductCart> {
    // Validar datos requeridos
    if (!data.id_cart || !data.id_product || !data.quantity) {
      throw new Error("Carrito, producto y cantidad son requeridos");
    }

    // Validar cantidad
    if (data.quantity <= 0) {
      throw new Error("La cantidad debe ser mayor a 0");
    }

    const productCartRepo = AppDataSource.getRepository(ProductCartEntity);
    const productRepo = AppDataSource.getRepository(ProductEntity);
    const cartRepo = AppDataSource.getRepository(CartEntity);

    // Verificar que el producto existe y tiene stock
    const product = await productRepo.findOne({
      where: { id_product: data.id_product },
    });

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    if (product.stock < data.quantity) {
      throw new Error(
        `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${data.quantity}`
      );
    }

    // Verificar que el carrito existe
    const cart = await cartRepo.findOne({
      where: { id_cart: data.id_cart },
    });

    if (!cart) {
      throw new Error(`Carrito con ID ${data.id_cart} no encontrado`);
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = await productCartRepo.findOne({
      where: {
        id_cart: data.id_cart,
        id_product: data.id_product,
      },
    });

    if (existingItem) {
      // Si ya existe, actualizar la cantidad
      existingItem.quantity += data.quantity;
      existingItem.updated_at = new Date();
      const updated = await productCartRepo.save(existingItem);
      return updated as unknown as ProductCart;
    }

    // Si no existe, crear nuevo item
    const newProductCart = productCartRepo.create({
      id_cart: data.id_cart,
      id_product: data.id_product,
      quantity: data.quantity,
      added_at: new Date(),
      updated_at: new Date(),
    });

    const saved = await productCartRepo.save(newProductCart);
    return saved as unknown as ProductCart;
  }
}
