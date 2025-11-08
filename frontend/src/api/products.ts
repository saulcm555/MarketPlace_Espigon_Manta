/**
 * Products API
 * Maneja todas las operaciones CRUD de productos
 */

import apiClient from './client';
import type { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest 
} from '@/types/api';

// ============================================
// GET Endpoints
// ============================================

/**
 * Obtener todos los productos
 */
export const getAllProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products');
  // El backend devuelve { products: [...] } en lugar de un array directo
  return response.data.products || response.data || [];
};

/**
 * Obtener producto por ID
 */
export const getProductById = async (id: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/products/${id}`);
  return response.data;
};

/**
 * Buscar productos por nombre o descripción
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products', {
    params: { search: query }
  });
  return response.data;
};

/**
 * Filtrar productos por categoría
 */
export const getProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products', {
    params: { category: categoryId }
  });
  return response.data;
};

/**
 * Filtrar productos por subcategoría
 */
export const getProductsBySubcategory = async (subcategoryId: number): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products', {
    params: { subcategory: subcategoryId }
  });
  return response.data;
};

/**
 * Obtener productos de un vendedor específico
 */
export const getProductsBySeller = async (sellerId: number): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products', {
    params: { id_seller: sellerId }
  });
  return response.data.products || response.data || [];
};

/**
 * Obtener productos destacados (los más recientes o más vendidos)
 */
export const getFeaturedProducts = async (limit: number = 8): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products', {
    params: { limit, featured: true }
  });
  return response.data;
};

// ============================================
// POST Endpoints (Solo Vendedores)
// ============================================

/**
 * Crear nuevo producto
 * Requiere autenticación como seller
 */
export const createProduct = async (data: CreateProductRequest): Promise<Product> => {
  const response = await apiClient.post<Product>('/products', data);
  return response.data;
};

// ============================================
// PUT Endpoints (Solo Vendedores)
// ============================================

/**
 * Actualizar producto existente
 * Requiere autenticación como seller
 */
export const updateProduct = async (id: number, data: UpdateProductRequest): Promise<Product> => {
  const response = await apiClient.put<Product>(`/products/${id}`, data);
  return response.data;
};

// ============================================
// DELETE Endpoints (Solo Admin)
// ============================================

/**
 * Eliminar producto
 * Requiere autenticación como admin
 */
export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};

// ============================================
// Helper Functions
// ============================================

/**
 * Verificar si un producto tiene stock disponible
 */
export const hasStock = (product: Product): boolean => {
  return product.stock > 0;
};

/**
 * Formatear precio del producto
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};
