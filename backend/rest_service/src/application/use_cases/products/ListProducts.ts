import { ListProductsDto } from "../../dtos/products/ListProducts.dto";
import { ProductService } from "../../../domain/services/ProductService";
import { Product } from "../../../domain/entities/product";

/**
 * Respuesta del listado de productos con paginación
 */
export interface ProductListResponseDto {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Caso de uso para listar productos con filtros, paginación y ordenamiento
 */
export class ListProducts {
  constructor(private productService: ProductService) {}

  /**
   * Ejecuta el listado de productos
   */
  async execute(filters: ListProductsDto): Promise<ProductListResponseDto> {
    const allProducts = await this.productService.getAllProducts();

    // Aplicar filtros
    let filteredProducts = allProducts.filter((product) => {
      // Filtro por categoría
      if (
        filters.id_category !== undefined &&
        product.id_category !== filters.id_category
      ) {
        return false;
      }

      // Filtro por subcategoría
      if (
        filters.id_sub_category !== undefined &&
        product.id_sub_category !== filters.id_sub_category
      ) {
        return false;
      }

      // Filtro por vendedor
      if (
        filters.id_seller !== undefined &&
        product.id_seller !== filters.id_seller
      ) {
        return false;
      }

      // Filtro por rango de precios
      if (
        filters.min_price !== undefined &&
        product.price < filters.min_price
      ) {
        return false;
      }
      if (
        filters.max_price !== undefined &&
        product.price > filters.max_price
      ) {
        return false;
      }

      // Filtro por búsqueda
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          product.product_name.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower))
        );
      }

      return true;
    });

    // Aplicar ordenamiento
    if (filters.sort_by) {
      filteredProducts = this.sortProducts(
        filteredProducts,
        filters.sort_by,
        filters.sort_order || "asc"
      );
    }

    // Calcular paginación
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Ordena productos según el criterio especificado
   */
  private sortProducts(
    products: Product[],
    sortBy: "price" | "name" | "created_at" | "stock",
    sortOrder: "asc" | "desc"
  ): Product[] {
    return products.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "price":
          comparison = a.price - b.price;
          break;
        case "name":
          comparison = a.product_name.localeCompare(b.product_name);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "stock":
          comparison = a.stock - b.stock;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }
}
