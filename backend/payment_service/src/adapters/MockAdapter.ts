/**
 * Mock Payment Adapter
 * Simula una pasarela de pago sin costos reales
 * OBLIGATORIO para desarrollo y pruebas
 */

import { PaymentProvider, PaymentResult, RefundResult } from './PaymentProvider';

export class MockAdapter implements PaymentProvider {
  private readonly SUCCESS_RATE = 0.9; // 90% de pagos exitosos

  async processPayment(params: {
    amount: number;
    currency: string;
    description: string;
    customerId?: string;
    metadata?: any;
  }): Promise<PaymentResult> {
    // Simular delay de red (500ms - 2s)
    await this.simulateNetworkDelay(500, 2000);

    // Simular éxito/fallo basado en SUCCESS_RATE
    const success = Math.random() < this.SUCCESS_RATE;
    
    // Generar ID de transacción único
    const transactionId = this.generateTransactionId();

    if (success) {
      console.log(`✅ [MockAdapter] Pago procesado exitosamente: ${transactionId}`);
      return {
        success: true,
        transactionId,
        amount: params.amount,
        currency: params.currency,
        status: 'completed',
        metadata: params.metadata
      };
    } else {
      console.log(`❌ [MockAdapter] Pago fallido: ${transactionId}`);
      return {
        success: false,
        transactionId,
        amount: params.amount,
        currency: params.currency,
        status: 'failed',
        errorMessage: 'Insufficient funds (Mock error)',
        metadata: params.metadata
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    // Simular delay de red
    await this.simulateNetworkDelay(300, 1000);

    const refundId = this.generateRefundId();

    console.log(`💰 [MockAdapter] Reembolso procesado: ${refundId}`);
    
    return {
      success: true,
      refundId,
      amount: amount || 0,
      status: 'completed'
    };
  }

  verifyWebhook(payload: any, signature: string): boolean {
    // Mock siempre válido para desarrollo
    console.log('🔐 [MockAdapter] Verificando webhook (siempre válido en mock)');
    return true;
  }

  normalizeWebhook(payload: any) {
    // Formato normalizado desde webhook mock
    return {
      event: payload.event || 'payment.success',
      transactionId: payload.transactionId || payload.id,
      amount: payload.amount || 0,
      currency: payload.currency || 'USD',
      status: payload.status || 'completed',
      metadata: payload.metadata || {}
    };
  }

  // Métodos auxiliares privados
  private async simulateNetworkDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `mock_txn_${timestamp}_${random}`;
  }

  private generateRefundId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `mock_ref_${timestamp}_${random}`;
  }
}
