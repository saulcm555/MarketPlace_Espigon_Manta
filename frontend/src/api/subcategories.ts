/**
 * SubCategories API
 * Maneja operaciones de subcategorías
 */

import apiClient from './client';
import type { SubCategory } from '@/types/api';

/**
 * Obtener todas las subcategorías (público)
 */
export const getSubCategories = async (): Promise<SubCategory[]> => {
  const response = await apiClient.get<SubCategory[]>('/subcategories');
  return response.data;
};

/**
 * Obtener subcategoría por ID (público)
 */
export const getSubCategoryById = async (id: number): Promise<SubCategory> => {
  const response = await apiClient.get<SubCategory>(`/subcategories/${id}`);
  return response.data;
};

/**
 * Crear nueva subcategoría (solo admin)
 */
export const createSubCategory = async (
  data: Omit<SubCategory, 'id_sub_category' | 'created_at'>
): Promise<SubCategory> => {
  const response = await apiClient.post<SubCategory>('/subcategories', data);
  return response.data;
};

/**
 * Actualizar subcategoría (solo admin)
 */
export const updateSubCategory = async (
  id: number,
  data: Partial<Omit<SubCategory, 'id_sub_category' | 'created_at'>>
): Promise<SubCategory> => {
  const response = await apiClient.put<SubCategory>(`/subcategories/${id}`, data);
  return response.data;
};

/**
 * Eliminar subcategoría (solo admin)
 */
export const deleteSubCategory = async (id: number): Promise<void> => {
  await apiClient.delete(`/subcategories/${id}`);
};
