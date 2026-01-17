/**
 * Payment Service Client
 * 
 * Cliente HTTP reutilizable para comunicarse con el Payment Service.
 * Incluye autenticación automática via X-Internal-Api-Key.
 * 
 * @module clients/PaymentClient
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ============================================
// TYPES (copiados de payment_service/contracts)
// ============================================

export interface ProcessPaymentRequest {
  amount: number;
  currency: string;
  description?: string;
  orderId?: number;
  customerId?: number;
  metadata?: Record<string, any>;
}

export interface ProcessPaymentResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export interface RefundRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  errorMessage?: string;
}

export interface TransactionDTO {
  id?: number;
  transaction_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  order_id?: number | null;
  customer_id?: number | null;
  provider: 'mock' | 'stripe' | 'mercadopago';
  metadata?: Record<string, any> | null;
  refund_id?: string | null;
  error_message?: string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  version: string;
  environment: string;
  provider: string;
}

export interface PaymentClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

// ============================================
// CLIENT IMPLEMENTATION
// ============================================

/**
 * Cliente HTTP para el Payment Service
 * 
 * @example
 * ```typescript
 * const client = new PaymentClient();
 * 
 * // Procesar un pago
 * const result = await client.processPayment({
 *   amount: 50.00,
 *   currency: 'USD',
 *   orderId: 123
 * });
 * 
 * // Consultar transacción
 * const transaction = await client.getTransaction('txn_123');
 * ```
 */
export class PaymentClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(config?: PaymentClientConfig) {
    this.baseUrl = config?.baseUrl || process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';
    const apiKey = config?.apiKey || process.env.INTERNAL_API_KEY;
    const timeout = config?.timeout || 30000;

    if (!apiKey) {
      console.warn('⚠️ [PaymentClient] INTERNAL_API_KEY no configurada');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Key': apiKey || ''
      }
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`📤 [PaymentClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ [PaymentClient] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`📥 [PaymentClient] ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        const status = error.response?.status;
        const message = (error.response?.data as any)?.error || error.message;
        console.error(`❌ [PaymentClient] ${status} ${message}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Procesar un pago
   * 
   * @param data Datos del pago
   * @returns Resultado del procesamiento
   */
  async processPayment(data: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    try {
      const response = await this.client.post<ProcessPaymentResponse>(
        '/api/payments/process',
        data
      );
      return response.data;
    } catch (error) {
      return this.handleError(error, 'processPayment');
    }
  }

  /**
   * Reembolsar un pago
   * 
   * @param data Datos del reembolso
   * @returns Resultado del reembolso
   */
  async refund(data: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await this.client.post<RefundResponse>(
        '/api/payments/refund',
        data
      );
      return response.data;
    } catch (error) {
      return this.handleError(error, 'refund');
    }
  }

  /**
   * Obtener información de una transacción
   * 
   * @param transactionId ID de la transacción
   * @returns Datos de la transacción
   */
  async getTransaction(transactionId: string): Promise<TransactionDTO | null> {
    try {
      const response = await this.client.get<TransactionDTO>(
        `/api/payments/transaction/${transactionId}`
      );
      return response.data;
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Verificar estado del servicio
   * 
   * @returns Estado de salud del Payment Service
   */
  async health(): Promise<HealthCheckResponse> {
    try {
      const response = await this.client.get<HealthCheckResponse>('/health');
      return response.data;
    } catch (error) {
      return {
        status: 'error',
        service: 'payment-service',
        timestamp: new Date().toISOString(),
        version: 'unknown',
        environment: 'unknown',
        provider: 'unknown'
      };
    }
  }

  /**
   * Manejar errores de la API
   */
  private handleError(error: unknown, operation: string): never {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status || 500;
    const message = (axiosError.response?.data as any)?.error || axiosError.message;
    
    console.error(`❌ [PaymentClient.${operation}] Error ${status}: ${message}`);
    
    throw new Error(`Payment Service error: ${message}`);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let _instance: PaymentClient | null = null;

/**
 * Obtener instancia singleton del PaymentClient
 */
export function getPaymentClient(config?: PaymentClientConfig): PaymentClient {
  if (!_instance) {
    _instance = new PaymentClient(config);
  }
  return _instance;
}

/**
 * Resetear instancia (útil para tests)
 */
export function resetPaymentClient(): void {
  _instance = null;
}

// Export default
export default PaymentClient;
