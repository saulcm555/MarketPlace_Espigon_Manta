/**
 * Coupons API
 * Maneja operaciones de cupones de descuento (B2B con Gym)
 */

import apiClient from './client';

export interface Coupon {
  id_coupon: number;
  code: string;
  discount_percent: number;
  discount_type: 'percentage' | 'fixed';
  valid_for: string;
  expires_at?: string;
  issued_by: string;
  minimum_purchase: number;
  customer_email: string;
  customer_name?: string;
  is_active: boolean;
  used: boolean;
  created_at: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    code: string;
    discount_percent: number;
    discount_type: string;
    issued_by: string;
    expires_at?: string;
  };
  discount_amount: number;
  original_total: number;
  final_total: number;
  error?: string;
  minimum_required?: number;
}

export interface MyCouponsResponse {
  coupons: Coupon[];
  total: number;
}

/**
 * Obtener cupones del usuario autenticado
 */
export const getMyCoupons = async (): Promise<MyCouponsResponse> => {
  const response = await apiClient.get<MyCouponsResponse>('/coupons/my');
  return response.data;
};

/**
 * Validar un cupón antes de aplicarlo a una orden
 */
export const validateCoupon = async (code: string, orderTotal: number): Promise<CouponValidationResult> => {
  const response = await apiClient.post<CouponValidationResult>('/coupons/validate', {
    code,
    order_total: orderTotal
  });
  return response.data;
};
