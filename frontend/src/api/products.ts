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
 * Normalizar producto: convertir price de string a number
 */
const normalizeProduct = (product: any): Product => {
  return {
    ...product,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
    // Asegurar compatibilidad con subcategory
    subcategory: product.subcategory || product.subCategory
  };
};

/**
 * Obtener todos los productos
 */
export const getAllProducts = async (): Promise<Product[]> => {
  // Pedir el límite máximo permitido por el backend (100)
  // La paginación se maneja en el frontend
  const response = await apiClient.get<any>('/products', {
    params: { limit: 100 } // Límite máximo permitido por validación del backend
  });
  // El backend devuelve { products: [...], pagination: {...} }
  const products = response.data.products || response.data || [];
  return products.map(normalizeProduct);
};

/**
 * Obtener producto por ID
 */
export const getProductById = async (id: number): Promise<Product> => {
  const response = await apiClient.get<any>(`/products/${id}`);
  return normalizeProduct(response.data);
};

/**
 * Buscar productos por nombre o descripción
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products', {
    params: { search: query, limit: 100 }
  });
  const products = response.data.products || response.data || [];
  return products.map(normalizeProduct);
};

/**
 * Filtrar productos por categoría
 */
export const getProductsByCategory = async (categoryId: number): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products', {
    params: { id_category: categoryId, limit: 100 }
  });
  const products = response.data.products || response.data || [];
  return products.map(normalizeProduct);
};

/**
 * Filtrar productos por subcategoría
 */
export const getProductsBySubcategory = async (subcategoryId: number): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products', {
    params: { id_sub_category: subcategoryId, limit: 100 }
  });
  const products = response.data.products || response.data || [];
  return products.map(normalizeProduct);
};

/**
 * Obtener productos de un vendedor específico
 */
export const getProductsBySeller = async (sellerId: number): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products', {
    params: { id_seller: sellerId }
  });
  const products = response.data.products || response.data || [];
  return products.map(normalizeProduct);
};

/**
 * Obtener productos destacados (los más recientes o más vendidos)
 */
export const getFeaturedProducts = async (limit: number = 8): Promise<Product[]> => {
  const response = await apiClient.get<any>('/products', {
    params: { limit }
  });
  const products = response.data.products || response.data || [];
  return products.map(normalizeProduct);
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
