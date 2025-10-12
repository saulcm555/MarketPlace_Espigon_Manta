import {
  ApproveProductDto,
  RejectProductDto,
  GetPendingProductsDto,
  DeleteProductByAdminDto,
} from "../../dtos/admins/ManageProducts.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { Product } from "../../../domain/entities/product";

/**
 * Casos de uso para que el admin gestione productos
 */
export class ManageProducts {
  constructor(private productService: ProductService) {}

  /**
   * Aprobar un producto
   */
  async approveProduct(data: ApproveProductDto): Promise<Product> {
    if (!data.id_product || !data.id_admin) {
      throw new Error("ID del producto y admin son requeridos");
    }

    // Verificar que el producto existe
    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    // Actualizar estado del producto a "approved"
    const updatedProduct = await this.productService.updateProduct(
      data.id_product.toString(),
      { status: "approved" } as any
    );

    return updatedProduct;
  }

  /**
   * Rechazar un producto
   */
  async rejectProduct(data: RejectProductDto): Promise<Product> {
    if (!data.id_product || !data.id_admin || !data.reason) {
      throw new Error("ID del producto, admin y razón son requeridos");
    }

    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    // Actualizar estado del producto a "rejected"
    const updatedProduct = await this.productService.updateProduct(
      data.id_product.toString(),
      { status: "rejected", rejection_reason: data.reason } as any
    );

    return updatedProduct;
  }

  /**
   * Obtener productos pendientes de aprobación
   */
  async getPendingProducts(data: GetPendingProductsDto): Promise<Product[]> {
    const page = data.page || 1;
    const limit = data.limit || 10;

    // Obtener todos los productos y filtrar por pendientes
    const allProducts = await this.productService.getAllProducts();
    const pendingProducts = allProducts.filter(
      (p: any) => p.status === "pending" || !p.status
    );

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return pendingProducts.slice(startIndex, endIndex);
  }

  /**
   * Eliminar un producto (admin)
   */
  async deleteProduct(data: DeleteProductByAdminDto): Promise<boolean> {
    if (!data.id_product || !data.id_admin || !data.reason) {
      throw new Error("ID del producto, admin y razón son requeridos");
    }

    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    // Eliminar el producto
    return await this.productService.deleteProduct(data.id_product.toString());
  }
}
