/**
 * Clients API
 * Maneja operaciones de clientes
 */

import apiClient from './client';
import type { Client, CreateClientRequest, UpdateClientRequest } from '@/types/api';

/**
 * Obtener todos los clientes (solo admin)
 */
export const getClients = async (): Promise<Client[]> => {
  const response = await apiClient.get<Client[]>('/clients');
  return response.data;
};

/**
 * Obtener cliente por ID (cliente autenticado)
 */
export const getClientById = async (id: number): Promise<Client> => {
  const response = await apiClient.get<Client>(`/clients/${id}`);
  return response.data;
};

/**
 * Crear nuevo cliente (público para registro)
 * Nota: También se usa en auth.ts para registro
 */
export const createClient = async (data: CreateClientRequest): Promise<Client> => {
  const response = await apiClient.post<Client>('/clients', data);
  return response.data;
};

/**
 * Actualizar cliente (solo el cliente autenticado)
 */
export const updateClient = async (
  id: number,
  data: UpdateClientRequest
): Promise<Client> => {
  const response = await apiClient.put<Client>(`/clients/${id}`, data);
  return response.data;
};

/**
 * Eliminar cliente (solo admin)
 */
export const deleteClient = async (id: number): Promise<void> => {
  await apiClient.delete(`/clients/${id}`);
};
