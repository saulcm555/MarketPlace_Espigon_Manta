import {
  GetInventoryByProductDto,
  GetSellerInventoryDto,
} from "../../dtos/inventory/QueryInventory.dto";
import { InventoryService } from "../../../domain/services/InventoryService";
import { ProductService } from "../../../domain/services/ProductService";
import { Inventory } from "../../../domain/entities/inventory";
import { Product } from "../../../domain/entities/product";

/**
 * Casos de uso para consultar inventario
 */
export class QueryInventory {
  constructor(
    private inventoryService: InventoryService,
    private productService: ProductService
  ) {}

  /**
   * Obtener el inventario de un producto específico
   */
  async getInventoryByProduct(
    data: GetInventoryByProductDto
  ): Promise<Inventory | null> {
    if (!data.id_product) {
      throw new Error("ID de producto es requerido");
    }

    const product = await this.productService.getProductById(
      data.id_product.toString()
    );

    if (!product) {
      throw new Error(`Producto con ID ${data.id_product} no encontrado`);
    }

    return await this.inventoryService.getInventoryById(
      product.id_inventory.toString()
    );
  }

  /**
   * Obtener todo el inventario de un vendedor
   */
  async getSellerInventory(data: GetSellerInventoryDto): Promise<Product[]> {
    if (!data.id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const allProducts = await this.productService.getAllProducts();
    const sellerProducts = allProducts.filter(
      (product) => product.id_seller === data.id_seller
    );

    // Ordenar por stock (productos con bajo stock primero)
    sellerProducts.sort((a, b) => a.stock - b.stock);

    return sellerProducts;
  }

  /**
   * Obtener productos con bajo stock de un vendedor
   */
  async getLowStockProducts(
    id_seller: number,
    threshold: number = 10
  ): Promise<Product[]> {
    if (!id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const allProducts = await this.productService.getAllProducts();
    const lowStockProducts = allProducts.filter(
      (product) =>
        product.id_seller === id_seller &&
        product.stock > 0 &&
        product.stock <= threshold
    );

    return lowStockProducts;
  }

  /**
   * Obtener productos sin stock de un vendedor
   */
  async getOutOfStockProducts(id_seller: number): Promise<Product[]> {
    if (!id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const allProducts = await this.productService.getAllProducts();
    const outOfStockProducts = allProducts.filter(
      (product) => product.id_seller === id_seller && product.stock === 0
    );

    return outOfStockProducts;
  }
}
