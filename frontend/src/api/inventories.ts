/**
 * Inventories API
 * Maneja operaciones de inventarios de vendedores
 */

import apiClient from './client';
import type { Inventory, CreateInventoryRequest, UpdateInventoryRequest } from '@/types/api';

/**
 * Obtener todos los inventarios (requiere autenticación)
 */
export const getInventories = async (): Promise<Inventory[]> => {
  const response = await apiClient.get<Inventory[]>('/inventories');
  return response.data;
};

/**
 * Obtener inventario por ID (requiere autenticación)
 */
export const getInventoryById = async (id: number): Promise<Inventory> => {
  const response = await apiClient.get<Inventory>(`/inventories/${id}`);
  return response.data;
};

/**
 * Crear nuevo inventario (solo seller)
 */
export const createInventory = async (data: CreateInventoryRequest): Promise<Inventory> => {
  const response = await apiClient.post<Inventory>('/inventories', data);
  return response.data;
};

/**
 * Actualizar inventario (solo seller)
 */
export const updateInventory = async (
  id: number,
  data: UpdateInventoryRequest
): Promise<Inventory> => {
  const response = await apiClient.put<Inventory>(`/inventories/${id}`, data);
  return response.data;
};

/**
 * Eliminar inventario (solo admin)
 */
export const deleteInventory = async (id: number): Promise<void> => {
  await apiClient.delete(`/inventories/${id}`);
};
