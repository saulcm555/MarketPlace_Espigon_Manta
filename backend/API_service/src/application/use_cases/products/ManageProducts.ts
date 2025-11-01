import {
  UpdateProductDto,
  DeleteProductDto,
} from "../../dtos/products/ManageProducts.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { Product } from "../../../domain/entities/product";

/**
 * Casos de uso para actualizar y eliminar productos (vendedores)
 */
export class ManageProducts {
  constructor(private productService: ProductService) {}

  /**
   * Actualizar un producto
   */
  async updateProduct(data: UpdateProductDto): Promise<Product> {
    if (!data.id_product) {
      throw new Error("ID de producto es requerido");
    }

    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    const updateData: Partial<Product> = {};
    if (data.product_name) updateData.product_name = data.product_name;
    if (data.description) updateData.description = data.description;
    if (data.image_url) updateData.image_url = data.image_url;
    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new Error("El precio no puede ser negativo");
      }
      updateData.price = data.price;
    }
    if (data.stock !== undefined) {
      if (data.stock < 0) {
        throw new Error("El stock no puede ser negativo");
      }
      updateData.stock = data.stock;
    }
    if (data.id_category) updateData.id_category = data.id_category;
    if (data.id_sub_category)
      updateData.id_sub_category = data.id_sub_category;

    if (Object.keys(updateData).length === 0) {
      throw new Error("No hay campos para actualizar");
    }

    return await this.productService.updateProduct(
      data.id_product.toString(),
      updateData
    );
  }

  /**
   * Eliminar un producto
   */
  async deleteProduct(data: DeleteProductDto): Promise<boolean> {
    if (!data.id_product) {
      throw new Error("ID de producto es requerido");
    }

    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    // Validar que el vendedor sea el dueño del producto
    if (product.id_seller !== data.id_seller) {
      throw new Error("No tienes permisos para eliminar este producto");
    }

    return await this.productService.deleteProduct(data.id_product.toString());
  }
}
