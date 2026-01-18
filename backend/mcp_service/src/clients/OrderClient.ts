/**
 * Order Client - Cliente HTTP para Rest Service (Órdenes)
 * 
 * Usa Bearer Token (DEMO_CLIENT_TOKEN) para crear órdenes
 * El endpoint POST /api/orders requiere autenticación de cliente
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

export interface OrderItem {
  id_product: number;
  quantity: number;
  unit_price?: number;
}

export interface CreateOrderRequest {
  id_client: number;
  items: OrderItem[];
  shipping_address?: string;
  notes?: string;
}

export interface Order {
  id_order: number;
  id_client: number;
  order_status: string;
  total_amount: number;
  shipping_address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface OrderResponse {
  success: boolean;
  order?: Order;
  message?: string;
}

// ============================================
// CLIENT
// ============================================

export class OrderClient {
  private client: AxiosInstance;

  constructor(userToken?: string) {
    const baseURL = process.env.REST_SERVICE_URL || 'http://localhost:3000';
    const token = userToken || process.env.DEMO_CLIENT_TOKEN;

    if (!token) {
      console.warn('[OrderClient] No hay DEMO_CLIENT_TOKEN configurado');
    }

    this.client = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  }

  /**
   * Crear una nueva orden
   */
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    try {
      const response = await this.client.post('/api/orders', data);
      return response.data;
    } catch (error: any) {
      console.error('[OrderClient] Error creando orden:', error.response?.data || error.message);
      throw new Error(`Error al crear orden: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Obtener una orden por ID
   */
  async getOrder(orderId: number): Promise<Order> {
    try {
      const response = await this.client.get(`/api/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error('[OrderClient] Error obteniendo orden:', error.message);
      throw new Error(`Error al obtener orden: ${error.message}`);
    }
  }

  /**
   * Listar órdenes (requiere autenticación)
   */
  async listOrders(params: { page?: number; limit?: number } = {}): Promise<Order[]> {
    try {
      const response = await this.client.get('/api/orders', { params });
      return response.data.orders || response.data;
    } catch (error: any) {
      console.error('[OrderClient] Error listando órdenes:', error.message);
      throw new Error(`Error al listar órdenes: ${error.message}`);
    }
  }
}

// Singleton con token por defecto
let orderClientInstance: OrderClient | null = null;

export function getOrderClient(userToken?: string): OrderClient {
  if (userToken) {
    // Si se provee token específico, crear nueva instancia
    return new OrderClient(userToken);
  }
  if (!orderClientInstance) {
    orderClientInstance = new OrderClient();
  }
  return orderClientInstance;
}
