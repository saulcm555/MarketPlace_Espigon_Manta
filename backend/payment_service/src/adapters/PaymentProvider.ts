/**
 * Payment Provider Interface
 * Define el contrato que todos los adapters de pago deben implementar
 * Patrón: Adapter / Strategy
 */

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
  errorMessage?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
}

export interface PaymentProvider {
  /**
   * Procesar un pago
   */
  processPayment(params: {
    amount: number;
    currency: string;
    description: string;
    customerId?: string;
    metadata?: any;
  }): Promise<PaymentResult>;

  /**
   * Reembolsar un pago
   */
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;

  /**
   * Verificar la firma de un webhook (específico de cada pasarela)
   */
  verifyWebhook(payload: any, signature: string): boolean;

  /**
   * Normalizar webhook a formato común
   */
  normalizeWebhook(payload: any): {
    event: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    metadata?: any;
  };
}
