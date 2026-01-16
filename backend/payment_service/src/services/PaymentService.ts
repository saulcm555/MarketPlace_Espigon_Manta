/**
 * Payment Service
 * Servicio principal que orquesta los pagos usando el adapter apropiado
 * Patrón: Factory + Strategy
 */

import { PaymentProvider } from '../adapters/PaymentProvider';
import { MockAdapter } from '../adapters/MockAdapter';
import { StripeAdapter } from '../adapters/StripeAdapter';
import { env } from '../config/env';
import { query } from '../config/database';

export class PaymentService {
  private provider: PaymentProvider;

  constructor(providerType?: 'mock' | 'stripe' | 'mercadopago') {
    const type = providerType || env.PAYMENT_PROVIDER;
    
    // Factory Pattern: Crear el adapter apropiado
    switch (type) {
      case 'stripe':
        this.provider = new StripeAdapter();
        console.log('💳 [PaymentService] Usando Stripe adapter');
        break;
      case 'mock':
      default:
        this.provider = new MockAdapter();
        console.log('🎭 [PaymentService] Usando Mock adapter (desarrollo)');
        break;
    }
  }

  /**
   * Procesar un pago
   */
  async processPayment(params: {
    amount: number;
    currency: string;
    description: string;
    orderId?: number;
    customerId?: number;
    metadata?: any;
  }) {
    console.log(`💰 [PaymentService] Procesando pago: $${params.amount} ${params.currency}`);

    // Agregar metadata adicional
    const enrichedMetadata = {
      ...params.metadata,
      orderId: params.orderId,
      customerId: params.customerId,
      timestamp: new Date().toISOString()
    };

    // Procesar pago con el adapter
    const result = await this.provider.processPayment({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
      metadata: enrichedMetadata
    });

    // Guardar transacción en BD
    await this.saveTransaction({
      transactionId: result.transactionId,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      orderId: params.orderId,
      customerId: params.customerId,
      provider: env.PAYMENT_PROVIDER,
      metadata: enrichedMetadata,
      errorMessage: result.errorMessage
    });

    return result;
  }

  /**
   * Reembolsar un pago
   */
  async refundPayment(transactionId: string, amount?: number) {
    console.log(`💸 [PaymentService] Procesando reembolso para: ${transactionId}`);

    const result = await this.provider.refundPayment(transactionId, amount);

    // Actualizar transacción en BD
    if (result.success) {
      await this.updateTransactionStatus(transactionId, 'refunded', result.refundId);
    }

    return result;
  }

  /**
   * Verificar webhook de pasarela
   */
  verifyWebhook(payload: any, signature: string): boolean {
    return this.provider.verifyWebhook(payload, signature);
  }

  /**
   * Normalizar webhook a formato común
   */
  normalizeWebhook(payload: any) {
    return this.provider.normalizeWebhook(payload);
  }

  /**
   * Guardar transacción en BD
   */
  private async saveTransaction(data: {
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    orderId?: number;
    customerId?: number;
    provider: string;
    metadata?: any;
    errorMessage?: string;
  }) {
    try {
      await query(
        `INSERT INTO transactions 
         (transaction_id, amount, currency, status, order_id, customer_id, provider, metadata, error_message) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          data.transactionId,
          data.amount,
          data.currency,
          data.status,
          data.orderId || null,
          data.customerId || null,
          data.provider,
          JSON.stringify(data.metadata),
          data.errorMessage || null
        ]
      );
      console.log(`💾 [PaymentService] Transacción guardada: ${data.transactionId}`);
    } catch (error) {
      console.error('❌ [PaymentService] Error al guardar transacción:', error);
    }
  }

  /**
   * Actualizar estado de transacción
   */
  private async updateTransactionStatus(
    transactionId: string,
    status: string,
    refundId?: string
  ) {
    try {
      await query(
        `UPDATE transactions 
         SET status = $1, refund_id = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE transaction_id = $3`,
        [status, refundId || null, transactionId]
      );
      console.log(`🔄 [PaymentService] Transacción actualizada: ${transactionId} -> ${status}`);
    } catch (error) {
      console.error('❌ [PaymentService] Error al actualizar transacción:', error);
    }
  }
}
