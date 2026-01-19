import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const GYM_WEBHOOK_URL = process.env.GYM_WEBHOOK_URL || 'http://localhost:3004/api/marketplace/webhook';
const GYM_SECRET = process.env.GYM_WEBHOOK_SECRET || 'super-secure-gym-marketplace-2026';

interface OrderWebhookData {
  order_id: number;
  customer_email: string;
  customer_name: string;
  total_amount: number;
}

/**
 * Servicio para enviar webhooks al sistema Gym
 */
export class GymWebhookService {
  /**
   * Genera un código de cupón basado en el monto de la compra
   */
  private static generateCouponCode(orderId: number): string {
    const timestamp = Date.now();
    return `MARKETPLACE-GYM-${orderId}-${timestamp}`;
  }

  /**
   * Calcula el descuento según el monto de compra
   * NOTA: Umbrales reducidos para pruebas
   * $5-9.99: 10%
   * $10-19.99: 20%
   * $20+: 30%
   * 
   * PRODUCCIÓN: Cambiar a $100/$150/$300
   */
  private static calculateDiscount(totalAmount: number): number {
    if (totalAmount >= 20) return 30;
    if (totalAmount >= 10) return 20;
    if (totalAmount >= 5) return 10;
    return 0;
  }

  /**
   * Genera firma HMAC-SHA256 para el payload
   */
  private static generateSignature(payload: string): string {
    return crypto
      .createHmac('sha256', GYM_SECRET)
      .update(payload)
      .digest('hex');
  }

  /**
   * Envía webhook al Gym cuando se completa un pedido
   */
  static async sendOrderCompletedWebhook(orderData: OrderWebhookData): Promise<void> {
    try {
      const discountValue = this.calculateDiscount(orderData.total_amount);
      
      // Si el monto no califica para cupón, no enviar webhook
      if (discountValue === 0) {
        console.log(`[GymWebhookService] Pedido ${orderData.order_id} no califica para cupón Gym (monto: $${orderData.total_amount})`);
        return;
      }

      const couponCode = this.generateCouponCode(orderData.order_id);
      const validFrom = new Date().toISOString();
      const validUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 días

      const payload = {
        event: 'order.completed',
        data: {
          order_id: orderData.order_id,
          customer_email: orderData.customer_email,
          customer_name: orderData.customer_name,
          total_amount: orderData.total_amount,
          coupon_earned: {
            coupon_code: couponCode,
            discount_type: 'percentage',
            discount_value: discountValue,
            valid_from: validFrom,
            valid_until: validUntil,
            description: `Cupón ${discountValue}% descuento en Gym por compra de $${orderData.total_amount} en Marketplace`
          },
          timestamp: new Date().toISOString()
        }
      };

      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString);

      console.log(`[GymWebhookService] Enviando webhook a Gym para pedido ${orderData.order_id}`);
      console.log(`[GymWebhookService] URL: ${GYM_WEBHOOK_URL}`);
      console.log(`[GymWebhookService] Cupón generado: ${couponCode} - ${discountValue}% descuento`);

      const response = await fetch(GYM_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-signature': signature
        },
        body: payloadString
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      console.log(`[GymWebhookService] ✅ Webhook enviado exitosamente:`, responseData);
    } catch (error) {
      console.error(`[GymWebhookService] ❌ Error enviando webhook al Gym:`, error);
      // No lanzamos el error para que no afecte la creación del pedido
    }
  }

  /**
   * Envía webhook de prueba al Gym
   */
  static async sendTestWebhook(): Promise<boolean> {
    try {
      await this.sendOrderCompletedWebhook({
        order_id: 99999,
        customer_email: 'test@marketplace.com',
        customer_name: 'Test User',
        total_amount: 150.00
      });
      return true;
    } catch (error) {
      console.error('[GymWebhookService] Error en webhook de prueba:', error);
      return false;
    }
  }
}
