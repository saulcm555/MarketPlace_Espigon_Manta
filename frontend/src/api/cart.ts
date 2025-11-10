/**
 * Cart API
 * Maneja operaciones del carrito de compras
 */

import apiClient from './client';
import type { Cart, AddToCartRequest } from '@/types/api';

// ============================================
// Cart Operations
// ============================================

/**
 * Obtener carrito del usuario actual
 */
export const getMyCart = async (): Promise<Cart[]> => {
  const response = await apiClient.get<Cart[]>('/carts');
  return response.data;
};

/**
 * Obtener carrito del usuario actual con productos incluidos
 */
export const getMyCartWithProducts = async (): Promise<Cart[]> => {
  const carts = await getMyCart();
  if (carts.length === 0) return [];
  
  // Obtener el primer carrito con productos
  const cartWithProducts = await getCartWithProducts(carts[0].id_cart);
  return [cartWithProducts];
};

/**
 * Obtener carrito por ID
 */
export const getCartById = async (id: number): Promise<Cart> => {
  const response = await apiClient.get<Cart>(`/carts/${id}`);
  return response.data;
};

/**
 * Obtener carrito con productos incluidos
 */
export const getCartWithProducts = async (id: number): Promise<Cart> => {
  const response = await apiClient.get<Cart>(`/carts/${id}/with-products`);
  return response.data;
};

/**
 * Crear nuevo carrito
 */
export const createCart = async (clientId: number): Promise<Cart> => {
  const response = await apiClient.post<Cart>('/carts', {
    id_client: clientId
  });
  return response.data;
};

// ============================================
// Cart Items Operations
// ============================================

/**
 * Agregar producto al carrito
 */
export const addProductToCart = async (cartId: number, data: AddToCartRequest): Promise<Cart> => {
  const response = await apiClient.post<Cart>(`/carts/${cartId}/products`, data);
  return response.data;
};

/**
 * Actualizar cantidad de un producto en el carrito
 */
export const updateCartItemQuantity = async (
  cartId: number, 
  productId: number, 
  quantity: number
): Promise<Cart> => {
  const response = await apiClient.put<Cart>(`/carts/${cartId}/products/${productId}`, {
    quantity
  });
  return response.data;
};

/**
 * Eliminar producto del carrito
 */
export const removeProductFromCart = async (cartId: number, productId: number): Promise<Cart> => {
  const response = await apiClient.delete<Cart>(`/carts/${cartId}/products/${productId}`);
  return response.data;
};

/**
 * Vaciar carrito (eliminar todos los productos)
 */
export const clearCart = async (cartId: number, products?: Array<{ id_product: number }>): Promise<void> => {
  if (!products || products.length === 0) {
    return;
  }
  
  try {
    await Promise.all(
      products.map((item) => {
        return apiClient.delete(`/carts/${cartId}/products/${item.id_product}`);
      })
    );
  } catch (error) {
    console.error('Error al eliminar productos del carrito:', error);
    throw error;
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Calcular total del carrito
 */
export const calculateCartTotal = (cart: Cart): number => {
  const products = cart.products || cart.productCarts || [];
  if (products.length === 0) return 0;
  
  return products.reduce((total, item) => {
    const price = item.product?.price || 0;
    return total + (price * item.quantity);
  }, 0);
};

/**
 * Contar total de items en el carrito
 */
export const getCartItemCount = (cart: Cart): number => {
  const products = cart.products || cart.productCarts || [];
  if (products.length === 0) return 0;
  
  return products.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Verificar si el carrito está vacío
 */
export const isCartEmpty = (cart: Cart): boolean => {
  const products = cart.products || cart.productCarts || [];
  return products.length === 0;
};
