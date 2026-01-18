/**
 * MCP Tool: buscar_productos
 * 
 * Busca productos en el marketplace por nombre, categoría o precio.
 * Endpoint: GET /api/products (Rest Service)
 */

import { getProductClient, ProductSearchParams, Product } from '../clients/ProductClient';

// ============================================
// TYPES
// ============================================

export interface BuscarProductosParams {
  search?: string;
  id_category?: string;
  category_name?: string;
  id_sub_category?: string;
  sub_category_name?: string;
  id_seller?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export interface BuscarProductosResult {
  success: boolean;
  products: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
  }>;
  totalFound: number;
  currentPage: number;
  error?: string;
}

// ============================================
// TOOL DEFINITION
// ============================================

export const buscarProductosTool = {
  name: 'buscar_productos',
  description: 'Busca productos en el marketplace por nombre, categoría o precio. Puede buscar por nombre de categoría o subcategoría (no necesita IDs).',
  parameters: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Término de búsqueda (nombre o descripción del producto)'
      },
      category_name: {
        type: 'string',
        description: 'Nombre de la categoría (ej: "electrónico", "ropa", "alimentos"). Se buscará automáticamente el ID.'
      },
      sub_category_name: {
        type: 'string',
        description: 'Nombre de la subcategoría (ej: "general", "celulares", "laptops"). Se buscará automáticamente el ID.'
      },
      id_category: {
        type: 'string',
        description: 'ID de la categoría (UUID) - usar solo si ya tienes el ID'
      },
      id_sub_category: {
        type: 'string',
        description: 'ID de la subcategoría (UUID) - usar solo si ya tienes el ID'
      },
      id_seller: {
        type: 'string',
        description: 'ID del vendedor (UUID)'
      },
      min_price: {
        type: 'number',
        description: 'Precio mínimo en dólares'
      },
      max_price: {
        type: 'number',
        description: 'Precio máximo en dólares'
      },
      page: {
        type: 'number',
        description: 'Número de página (default: 1)'
      },
      limit: {
        type: 'number',
        description: 'Productos por página (default: 10)'
      }
    },
    required: [] // Todos opcionales
  },

  /**
   * Ejecutar búsqueda de productos
   */
  async execute(params: BuscarProductosParams): Promise<BuscarProductosResult> {
    try {
      const client = getProductClient();
      
      // Resolver nombre de categoría a ID si se proporcionó
      let categoryId = params.id_category;
      if (!categoryId && params.category_name) {
        const category = await client.findCategoryByName(params.category_name);
        if (category) {
          categoryId = category.id_category;
          console.log(`[buscar_productos] Categoría "${params.category_name}" → ID: ${categoryId}`);
        } else {
          console.log(`[buscar_productos] Categoría "${params.category_name}" no encontrada`);
        }
      }
      
      // Resolver nombre de subcategoría a ID si se proporcionó
      let subCategoryId = params.id_sub_category;
      if (!subCategoryId && params.sub_category_name) {
        const subCategory = await client.findSubCategoryByName(params.sub_category_name, categoryId);
        if (subCategory) {
          subCategoryId = subCategory.id_sub_category;
          console.log(`[buscar_productos] Subcategoría "${params.sub_category_name}" → ID: ${subCategoryId}`);
        } else {
          console.log(`[buscar_productos] Subcategoría "${params.sub_category_name}" no encontrada`);
        }
      }
      
      const searchParams: ProductSearchParams = {
        search: params.search,
        id_category: categoryId,
        id_sub_category: subCategoryId,
        id_seller: params.id_seller,
        min_price: params.min_price,
        max_price: params.max_price,
        page: params.page || 1,
        limit: params.limit || 10
      };

      const response = await client.listProducts(searchParams);

      return {
        success: true,
        products: response.products.map((p: Product) => ({
          id: p.id_product,
          name: p.product_name,
          description: p.description || '',
          price: p.price,
          stock: p.stock
        })),
        totalFound: response.pagination.totalItems,
        currentPage: response.pagination.page
      };
    } catch (error: any) {
      return {
        success: false,
        products: [],
        totalFound: 0,
        currentPage: 1,
        error: error.message
      };
    }
  },

  /**
   * Formatear respuesta para el usuario
   */
  formatResponse(result: BuscarProductosResult): string {
    if (!result.success) {
      return `❌ Error al buscar productos: ${result.error}`;
    }

    if (result.products.length === 0) {
      return '🔍 No encontré productos con esos criterios.';
    }

    let response = `📦 Encontré ${result.totalFound} producto(s):\n\n`;
    
    for (const product of result.products) {
      const price = typeof product.price === 'number' 
        ? product.price.toFixed(2) 
        : parseFloat(String(product.price)).toFixed(2);
      
      response += `📦 **${product.name}**\n`;
      response += `   💰 Precio: $${price}\n`;
      response += `   📊 Stock: ${product.stock} unidades\n\n`;
    }

    if (result.totalFound > result.products.length) {
      response += `\n📄 Mostrando página ${result.currentPage}. Hay más resultados disponibles.`;
    }

    return response;
  }
};

/**
 * Función helper para ejecutar directamente
 */
export async function buscarProductos(params: BuscarProductosParams): Promise<BuscarProductosResult> {
  return buscarProductosTool.execute(params);
}
