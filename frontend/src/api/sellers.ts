/**
 * Sellers API
 * Maneja operaciones relacionadas con vendedores
 */

import apiClient from './client';
import type { Seller, CreateSellerRequest } from '@/types/api';

// ============================================
// GET Endpoints
// ============================================

/**
 * Obtener todos los vendedores
 */
export const getAllSellers = async (): Promise<Seller[]> => {
  const response = await apiClient.get<Seller[]>('/sellers');
  return response.data;
};

/**
 * Obtener vendedor por ID
 */
export const getSellerById = async (id: number): Promise<Seller> => {
  const response = await apiClient.get<Seller>(`/sellers/${id}`);
  return response.data;
};

/**
 * Obtener productos de un vendedor específico
 */
export const getSellerProducts = async (sellerId: number) => {
  const response = await apiClient.get(`/sellers/${sellerId}/products`);
  return response.data;
};

// ============================================
// POST Endpoints
// ============================================

/**
 * Registrar nuevo vendedor
 * Endpoint público para registro
 */
export const registerSeller = async (data: CreateSellerRequest): Promise<Seller> => {
  const response = await apiClient.post<Seller>('/sellers', data);
  return response.data;
};

// ============================================
// PUT Endpoints
// ============================================

/**
 * Actualizar información del vendedor
 * Requiere autenticación como seller
 */
export const updateSeller = async (id: number, data: Partial<Seller>): Promise<Seller> => {
  const response = await apiClient.put<Seller>(`/sellers/${id}`, data);
  return response.data;
};

// ============================================
// DELETE Endpoints
// ============================================

/**
 * Eliminar vendedor (Solo Admin)
 */
export const deleteSeller = async (id: number): Promise<void> => {
  await apiClient.delete(`/sellers/${id}`);
};
