/**
 * Deliveries API
 * Maneja operaciones de métodos de entrega
 */

import apiClient from './client';
import type { Delivery } from '@/types/api';

/**
 * Obtener todos los métodos de entrega disponibles
 */
export const getDeliveries = async (): Promise<Delivery[]> => {
  const response = await apiClient.get<Delivery[]>('/deliveries');
  return response.data;
};

/**
 * Obtener método de entrega por ID
 */
export const getDeliveryById = async (id: number): Promise<Delivery> => {
  const response = await apiClient.get<Delivery>(`/deliveries/${id}`);
  return response.data;
};

/**
 * Crear nuevo método de entrega (admin)
 */
export const createDelivery = async (data: Omit<Delivery, 'id'>): Promise<Delivery> => {
  const response = await apiClient.post<Delivery>('/deliveries', data);
  return response.data;
};

/**
 * Actualizar método de entrega (admin)
 */
export const updateDelivery = async (id: number, data: Partial<Delivery>): Promise<Delivery> => {
  const response = await apiClient.put<Delivery>(`/deliveries/${id}`, data);
  return response.data;
};

/**
 * Eliminar método de entrega (admin)
 */
export const deleteDelivery = async (id: number): Promise<void> => {
  await apiClient.delete(`/deliveries/${id}`);
};
