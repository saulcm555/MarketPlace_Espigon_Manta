import {
  GetProductByIdDto,
  SearchProductsDto,
  GetProductsByCategoryDto,
  GetProductsBySellerDto,
} from "../../dtos/products/QueryProducts.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { Product } from "../../../domain/entities/product";

/**
 * Casos de uso para consultar productos
 */
export class QueryProducts {
  constructor(private productService: ProductService) {}

  /**
   * Obtener un producto por ID
   */
  async getProductById(data: GetProductByIdDto): Promise<Product | null> {
    if (!data.id_product) {
      throw new Error("ID de producto es requerido");
    }

    return await this.productService.getProductById(data.id_product.toString());
  }

  /**
   * Buscar productos por texto
   */
  async searchProducts(data: SearchProductsDto): Promise<Product[]> {
    if (!data.searchTerm || data.searchTerm.trim().length < 2) {
      throw new Error("El término de búsqueda debe tener al menos 2 caracteres");
    }

    const allProducts = await this.productService.getAllProducts();
    const searchLower = data.searchTerm.toLowerCase();

    return allProducts.filter(
      (product) =>
        product.product_name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Obtener productos por categoría/subcategoría
   */
  async getProductsByCategory(
    data: GetProductsByCategoryDto
  ): Promise<Product[]> {
    if (!data.id_category) {
      throw new Error("ID de categoría es requerido");
    }

    const allProducts = await this.productService.getAllProducts();
    let products = allProducts.filter(
      (product) => product.id_category === data.id_category
    );

    // Si se especifica subcategoría, filtrar también por ella
    if (data.id_sub_category) {
      products = products.filter(
        (product) => product.id_sub_category === data.id_sub_category
      );
    }

    return products;
  }

  /**
   * Obtener productos por vendedor
   */
  async getProductsBySeller(data: GetProductsBySellerDto): Promise<Product[]> {
    if (!data.id_seller) {
      throw new Error("ID de vendedor es requerido");
    }

    const allProducts = await this.productService.getAllProducts();
    return allProducts.filter(
      (product) => product.id_seller === data.id_seller
    );
  }
}
