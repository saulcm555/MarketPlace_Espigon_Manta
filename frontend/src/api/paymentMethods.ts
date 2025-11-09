/**
 * Payment Methods API
 * Maneja operaciones de métodos de pago
 */

import apiClient from './client';
import type { PaymentMethod } from '@/types/api';

/**
 * Obtener todos los métodos de pago disponibles
 */
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await apiClient.get<PaymentMethod[]>('/payment-methods');
  return response.data;
};

/**
 * Obtener método de pago por ID
 */
export const getPaymentMethodById = async (id: number): Promise<PaymentMethod> => {
  const response = await apiClient.get<PaymentMethod>(`/payment-methods/${id}`);
  return response.data;
};
