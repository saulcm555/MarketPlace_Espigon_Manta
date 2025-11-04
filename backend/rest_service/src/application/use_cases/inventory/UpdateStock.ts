import { UpdateStockDto } from "../../dtos/inventory/UpdateStock.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { InventoryService } from "../../../domain/services/InventoryService";
import { Product } from "../../../domain/entities/product";
import { notifyInventoryUpdated } from "../../../infrastructure/clients/notificationClient";

/**
 * Caso de uso para actualizar el stock de un producto
 */
export class UpdateStock {
  constructor(
    private productService: ProductService,
    private inventoryService: InventoryService
  ) {}

  /**
   * Ejecuta la actualización del stock
   * @param data - Datos para actualizar el stock
   * @returns Promise con el producto actualizado
   */
  async execute(data: UpdateStockDto): Promise<Product> {
    if (!data.id_product || data.stock === undefined) {
      throw new Error("ID de producto y cantidad de stock son requeridos");
    }

    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    // Validar que el vendedor sea el dueño del producto
    if (data.id_seller && product.id_seller !== data.id_seller) {
      throw new Error("No tienes permisos para modificar este producto");
    }

    let newStock = 0;

    switch (data.operation) {
      case "add":
        newStock = product.stock + data.stock;
        break;
      case "subtract":
        newStock = product.stock - data.stock;
        if (newStock < 0) {
          throw new Error("El stock no puede ser negativo");
        }
        break;
      case "set":
      default:
        newStock = data.stock;
        if (newStock < 0) {
          throw new Error("El stock no puede ser negativo");
        }
        break;
    }

    const updateData: Partial<Product> = {
      stock: newStock,
    };

    const updatedProduct = await this.productService.updateProduct(
      data.id_product.toString(),
      updateData
    );

    // 🔔 NOTIFICACIÓN: Enviar notificación de inventario actualizado
    if (updatedProduct && updatedProduct.id_seller) {
      notifyInventoryUpdated(
        updatedProduct.id_product,
        updatedProduct.id_seller.toString(),
        {
          product_name: updatedProduct.product_name,
          old_stock: product.stock,
          new_stock: newStock,
          operation: data.operation || 'set',
          stock_change: newStock - product.stock
        }
      ).catch(err => {
        console.error('Error sending inventory update notification:', err);
      });
    }

    return updatedProduct;
  }
}
