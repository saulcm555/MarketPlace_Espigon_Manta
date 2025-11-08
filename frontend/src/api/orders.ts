/**
 * Orders API
 * Maneja operaciones de pedidos
 */

import apiClient from './client';
import type { Order, CreateOrderRequest } from '@/types/api';

// ============================================
// Order Operations
// ============================================

/**
 * Obtener todos los pedidos del usuario actual
 */
export const getMyOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders');
  return response.data;
};

/**
 * Obtener pedido por ID
 */
export const getOrderById = async (id: number): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/${id}`);
  return response.data;
};

/**
 * Crear nuevo pedido
 */
export const createOrder = async (data: CreateOrderRequest): Promise<Order> => {
  const response = await apiClient.post<Order>('/orders', data);
  return response.data;
};

/**
 * Actualizar estado del pedido
 */
export const updateOrderStatus = async (id: number, status: string): Promise<Order> => {
  const response = await apiClient.put<Order>(`/orders/${id}/status`, { status });
  return response.data;
};

/**
 * Cancelar pedido
 */
export const cancelOrder = async (id: number): Promise<Order> => {
  const response = await apiClient.put<Order>(`/orders/${id}/cancel`);
  return response.data;
};

// ============================================
// Helper Functions
// ============================================

/**
 * Calcular total del pedido
 */
export const calculateOrderTotal = (order: Order): number => {
  // Si ya tiene el total calculado, devolverlo
  if (order.total_amount) return order.total_amount;
  
  // Si tiene carrito con productos, calcularlo
  if (!order.cart?.products) return 0;
  
  return order.cart.products.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + (price * item.quantity);
  }, 0);
};

/**
 * Obtener color del estado
 */
export const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    pending: 'warning',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'destructive',
  };
  
  return colors[status] || 'secondary';
};

/**
 * Obtener texto del estado en español
 */
export const getOrderStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En proceso',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };
  
  return texts[status] || status;
};
