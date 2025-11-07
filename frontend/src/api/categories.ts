/**
 * Categories API
 * Maneja operaciones de categorías y subcategorías
 */

import apiClient from './client';
import type { Category, SubCategory } from '@/types/api';

// ============================================
// Categories
// ============================================

/**
 * Obtener todas las categorías
 */
export const getAllCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<any>('/categories');
  // El backend puede devolver { categories: [...] } o un array directo
  return response.data.categories || response.data || [];
};

/**
 * Obtener categoría por ID
 */
export const getCategoryById = async (id: number): Promise<Category> => {
  const response = await apiClient.get<Category>(`/categories/${id}`);
  return response.data;
};

/**
 * Crear nueva categoría (Solo Admin)
 */
export const createCategory = async (data: Omit<Category, 'id' | 'created_at'>): Promise<Category> => {
  const response = await apiClient.post<Category>('/categories', data);
  return response.data;
};

/**
 * Actualizar categoría (Solo Admin)
 */
export const updateCategory = async (id: number, data: Partial<Category>): Promise<Category> => {
  const response = await apiClient.put<Category>(`/categories/${id}`, data);
  return response.data;
};

/**
 * Eliminar categoría (Solo Admin)
 */
export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/categories/${id}`);
};

// ============================================
// SubCategories
// ============================================

/**
 * Obtener todas las subcategorías
 */
export const getAllSubcategories = async (): Promise<SubCategory[]> => {
  const response = await apiClient.get<SubCategory[]>('/subcategories');
  return response.data;
};

/**
 * Obtener subcategoría por ID
 */
export const getSubcategoryById = async (id: number): Promise<SubCategory> => {
  const response = await apiClient.get<SubCategory>(`/subcategories/${id}`);
  return response.data;
};

/**
 * Obtener subcategorías de una categoría específica
 */
export const getSubcategoriesByCategory = async (categoryId: number): Promise<SubCategory[]> => {
  const response = await apiClient.get<SubCategory[]>('/subcategories', {
    params: { category: categoryId }
  });
  return response.data;
};

/**
 * Crear nueva subcategoría (Solo Admin)
 */
export const createSubcategory = async (data: Omit<SubCategory, 'id' | 'created_at'>): Promise<SubCategory> => {
  const response = await apiClient.post<SubCategory>('/subcategories', data);
  return response.data;
};

/**
 * Actualizar subcategoría (Solo Admin)
 */
export const updateSubcategory = async (id: number, data: Partial<SubCategory>): Promise<SubCategory> => {
  const response = await apiClient.put<SubCategory>(`/subcategories/${id}`, data);
  return response.data;
};

/**
 * Eliminar subcategoría (Solo Admin)
 */
export const deleteSubcategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/subcategories/${id}`);
};
