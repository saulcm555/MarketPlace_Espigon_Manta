/**
 * Orders API
 * Maneja operaciones de pedidos
 */

import apiClient from './client';
import type { Order, CreateOrderRequest, ProductOrder } from '@/types/api';

// ============================================
// Order Operations
// ============================================

/**
 * Obtener todos los pedidos del usuario actual
 */
export const getMyOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders/my-orders');
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
// Payment Receipt Operations
// ============================================

/**
 * Subir comprobante de pago
 */
export const uploadPaymentReceipt = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await apiClient.post<{ url: string }>('/upload/payment-receipt', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

/**
 * Actualizar comprobante de pago de una orden
 */
export const updateOrderPaymentReceipt = async (
  orderId: number, 
  receiptUrl: string
): Promise<Order> => {
  const response = await apiClient.patch<Order>(
    `/orders/${orderId}/payment-receipt`,
    { payment_receipt_url: receiptUrl }
  );
  return response.data;
};

/**
 * Verificar pago (aprobar o rechazar) - Solo para sellers
 */
export const verifyPayment = async (
  orderId: number, 
  approved: boolean
): Promise<Order> => {
  const response = await apiClient.patch<Order>(
    `/orders/${orderId}/verify-payment`,
    { approved }
  );
  return response.data;
};

/**
 * Obtener órdenes pendientes de verificación de pago - Para sellers
 */
export const getPendingPaymentOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders/seller/pending-payments');
  return response.data;
};

// ============================================
// Review Operations
// ============================================

/**
 * Agregar reseña a un producto de la orden
 */
export const addProductReview = async (
  idProductOrder: number, 
  rating: number, 
  reviewComment?: string
): Promise<any> => {
  const response = await apiClient.post(
    `/orders/product-order/${idProductOrder}/review`,
    { rating, review_comment: reviewComment }
  );
  return response.data;
};

/**
 * Obtener reseñas de un producto
 */
export const getProductReviews = async (idProduct: number): Promise<ProductOrder[]> => {
  const response = await apiClient.get<ProductOrder[]>(`/orders/products/${idProduct}/reviews`);
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
  const products = order.cart?.products || order.cart?.productCarts || [];
  if (products.length === 0) return 0;
  
  return products.reduce((total, item) => {
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
    payment_pending_verification: 'warning',
    payment_confirmed: 'success',
    payment_rejected: 'destructive',
    expired: 'secondary',
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
    payment_pending_verification: 'Esperando verificación de pago',
    payment_confirmed: 'Pago confirmado',
    payment_rejected: 'Pago rechazado',
    expired: 'Expirado',
  };
  
  return texts[status] || status;
};
