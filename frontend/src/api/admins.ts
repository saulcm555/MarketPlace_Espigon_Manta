/**
 * Admins API
 * Maneja operaciones de administradores (solo admin)
 */

import apiClient from './client';
import type { Admin, CreateAdminRequest, UpdateAdminRequest } from '@/types/api';

/**
 * Obtener todos los administradores (solo admin)
 */
export const getAdmins = async (): Promise<Admin[]> => {
  const response = await apiClient.get<Admin[]>('/admins');
  return response.data;
};

/**
 * Obtener administrador por ID (solo admin)
 */
export const getAdminById = async (id: number): Promise<Admin> => {
  const response = await apiClient.get<Admin>(`/admins/${id}`);
  return response.data;
};

/**
 * Crear nuevo administrador (solo admin)
 */
export const createAdmin = async (data: CreateAdminRequest): Promise<Admin> => {
  const response = await apiClient.post<Admin>('/admins', data);
  return response.data;
};

/**
 * Actualizar administrador (solo admin)
 */
export const updateAdmin = async (
  id: number,
  data: UpdateAdminRequest
): Promise<Admin> => {
  const response = await apiClient.put<Admin>(`/admins/${id}`, data);
  return response.data;
};

/**
 * Eliminar administrador (solo admin)
 */
export const deleteAdmin = async (id: number): Promise<void> => {
  await apiClient.delete(`/admins/${id}`);
};
