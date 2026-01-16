import axios from 'axios';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';

/**
 * Cliente HTTP para comunicarse con el Payment Service
 */

export interface ProcessPaymentParams {
  orderId: string | number;
  customerId: string | number;
  amount: number;
  currency: string;
  description: string;
  metadata?: any;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  metadata?: any;
}

export interface RefundParams {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

/**
 * Procesar un pago a través del Payment Service
 */
export async function processPayment(params: ProcessPaymentParams): Promise<PaymentResult> {
  try {
    const response = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/process`, params, {
      timeout: 30000 // 30 segundos
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error procesando pago:', error.message);
    
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      success: false,
      transactionId: '',
      amount: params.amount,
      currency: params.currency,
      status: 'failed',
      errorMessage: error.message || 'Error de conexión con Payment Service'
    };
  }
}

/**
 * Procesar un reembolso
 */
export async function processRefund(params: RefundParams): Promise<RefundResult> {
  try {
    const response = await axios.post(`${PAYMENT_SERVICE_URL}/api/payments/refund`, params, {
      timeout: 30000
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error procesando reembolso:', error.message);
    
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      success: false,
      refundId: '',
      amount: params.amount || 0,
      status: 'failed',
      errorMessage: error.message || 'Error de conexión con Payment Service'
    };
  }
}

/**
 * Obtener información de una transacción
 */
export async function getTransaction(transactionId: string): Promise<any> {
  try {
    const response = await axios.get(`${PAYMENT_SERVICE_URL}/api/payments/transaction/${transactionId}`);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error obteniendo transacción:', error.message);
    throw error;
  }
}
