import Stripe from 'stripe';
import { PaymentProvider, PaymentResult, RefundResult } from './PaymentProvider';

/**
 * Stripe Payment Adapter
 * Implementación real de Stripe como pasarela de pago
 */

export class StripeAdapter implements PaymentProvider {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY no está configurada');
    }

    // ✅ Usar versión API estable
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2023-10-16'
    });

    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  async processPayment(params: {
    amount: number;
    currency: string;
    description: string;
    customerId?: string;
    metadata?: any;
  }): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        description: params.description,
        customer: params.customerId,
        metadata: params.metadata,
        automatic_payment_methods: { enabled: true }
      });

      return {
        success: paymentIntent.status === 'succeeded',
        transactionId: paymentIntent.id,
        amount: params.amount,
        currency: params.currency,
        status: this.mapStripeStatus(paymentIntent.status),
        metadata: paymentIntent.metadata
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: '',
        amount: params.amount,
        currency: params.currency,
        status: 'failed',
        errorMessage: error.message,
        metadata: { error: error.message }
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: transactionId,
        amount: amount ? Math.round(amount * 100) : undefined
      });

      return {
        success: refund.status === 'succeeded',
        refundId: refund.id,
        amount: refund.amount / 100,
        status: this.mapStripeStatus(refund.status || 'pending')
      };
    } catch (error: any) {
      return {
        success: false,
        refundId: '',
        amount: amount || 0,
        status: 'failed',
        errorMessage: error.message
      };
    }
  }

  verifyWebhook(payload: any, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('⚠️ STRIPE_WEBHOOK_SECRET no configurado');
      return true;
    }

    try {
      // Si payload es string, úsalo directamente. Si no, conviértelo
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      this.stripe.webhooks.constructEvent(
        payloadString,
        signature,
        this.webhookSecret
      );
      return true;
    } catch (error) {
      console.error('❌ Verificación webhook falló:', error);
      return false;
    }
  }

  normalizeWebhook(payload: any) {
    const event = payload.type;
    const data = payload.data.object;

    return {
      event: this.mapStripeEvent(event),
      transactionId: data.id,
      amount: data.amount / 100,
      currency: data.currency.toUpperCase(),
      status: this.mapStripeStatus(data.status),
      metadata: data.metadata
    };
  }

  private mapStripeStatus(stripeStatus: string): 'pending' | 'completed' | 'failed' {
    const statusMap: Record<string, 'pending' | 'completed' | 'failed'> = {
      'succeeded': 'completed',
      'processing': 'pending',
      'requires_payment_method': 'pending',
      'requires_confirmation': 'pending',
      'requires_action': 'pending',
      'canceled': 'failed',
      'failed': 'failed'
    };
    return statusMap[stripeStatus] || 'pending';
  }

  private mapStripeEvent(stripeEvent: string): string {
    const eventMap: Record<string, string> = {
      'payment_intent.succeeded': 'payment.success',
      'payment_intent.payment_failed': 'payment.failed',
      'payment_intent.canceled': 'payment.cancelled',
      'charge.refunded': 'payment.refunded'
    };
    return eventMap[stripeEvent] || 'payment.unknown';
  }
}