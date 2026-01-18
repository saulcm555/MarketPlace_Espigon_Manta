/**
 * Product Client - Cliente HTTP para Rest Service (Productos)
 * 
 * Usa X-Service-Token + X-Internal-Service para autenticación interna
 * (mismo mecanismo que usa Report Service)
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

export interface Product {
  id_product: number;
  product_name: string;
  description: string;
  price: number;
  stock: number;
  id_seller: number;
  id_category: number;
  id_sub_category?: number;
  product_image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id_category: string;
  category_name: string;
  description?: string;
}

export interface SubCategory {
  id_sub_category: string;
  sub_category_name: string;
  id_category: string;
  description?: string;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductSearchParams {
  search?: string;
  id_category?: string;
  id_sub_category?: string;
  id_seller?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

// ============================================
// CLIENT
// ============================================

export class ProductClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.REST_SERVICE_URL || 'http://localhost:3000';
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        // Autenticación interna (mismo mecanismo que Report Service)
        'X-Service-Token': 'internal-service-graphql-reports-2024',
        'X-Internal-Service': 'mcp-service'
      }
    });
  }

  /**
   * Buscar productos con filtros
   */
  async listProducts(params: ProductSearchParams = {}): Promise<ProductsResponse> {
    try {
      const response = await this.client.get('/api/products', { params });
      return response.data;
    } catch (error: any) {
      console.error('[ProductClient] Error listando productos:', error.message);
      throw new Error(`Error al buscar productos: ${error.message}`);
    }
  }

  /**
   * Obtener un producto por ID
   */
  async getProduct(productId: number): Promise<Product> {
    try {
      const response = await this.client.get(`/api/products/${productId}`);
      return response.data;
    } catch (error: any) {
      console.error('[ProductClient] Error obteniendo producto:', error.message);
      throw new Error(`Error al obtener producto: ${error.message}`);
    }
  }

  /**
   * Obtener todas las categorías
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.client.get('/api/categories');
      return response.data;
    } catch (error: any) {
      console.error('[ProductClient] Error obteniendo categorías:', error.message);
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }
  }

  /**
   * Obtener todas las subcategorías
   */
  async getSubCategories(): Promise<SubCategory[]> {
    try {
      const response = await this.client.get('/api/subcategories');
      return response.data;
    } catch (error: any) {
      console.error('[ProductClient] Error obteniendo subcategorías:', error.message);
      throw new Error(`Error al obtener subcategorías: ${error.message}`);
    }
  }

  /**
   * Buscar categoría por nombre (case-insensitive)
   */
  async findCategoryByName(name: string): Promise<Category | null> {
    const categories = await this.getCategories();
    const normalizedName = name.toLowerCase().trim();
    return categories.find(c => 
      c.category_name.toLowerCase().includes(normalizedName)
    ) || null;
  }

  /**
   * Buscar subcategoría por nombre (case-insensitive)
   */
  async findSubCategoryByName(name: string, categoryId?: string): Promise<SubCategory | null> {
    const subCategories = await this.getSubCategories();
    const normalizedName = name.toLowerCase().trim();
    
    let filtered = subCategories.filter(sc => 
      sc.sub_category_name.toLowerCase().includes(normalizedName)
    );
    
    // Si se especificó categoría, filtrar por ella
    if (categoryId) {
      filtered = filtered.filter(sc => sc.id_category === categoryId);
    }
    
    return filtered[0] || null;
  }
}

// Singleton
let productClientInstance: ProductClient | null = null;

export function getProductClient(): ProductClient {
  if (!productClientInstance) {
    productClientInstance = new ProductClient();
  }
  return productClientInstance;
}
