/**
 * Webhook Routes
 * Endpoints para recibir webhooks de partners y pasarelas
 */

import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { WebhookSecurity } from '../utils/webhookSecurity';
import { PaymentService } from '../services/PaymentService';
import { DeliveryEvents, isValidEvent } from '../contracts/events';
import { GymWebhookService } from '../services/GymWebhookService';

const router = Router();
const gymWebhookService = new GymWebhookService();

/**
 * POST /api/webhooks/partner
 * Recibir webhook de un partner B2B
 */
router.post('/partner', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    const partnerIdHeader = req.headers['x-partner-id'] as string;
    // Extract signature from body if present to avoid verification mismatch
    const bodyWithoutSignature = { ...req.body };
    if ('signature' in bodyWithoutSignature) {
      delete bodyWithoutSignature.signature;
    }
    const { event, data } = bodyWithoutSignature;

    // Validaciones
    if (!signature || !partnerIdHeader) {
      return res.status(400).json({ 
        error: 'Headers requeridos faltantes',
        required: ['x-webhook-signature', 'x-partner-id']
      });
    }

    const partnerId = parseInt(partnerIdHeader);

    // Buscar partner
    const partnerResult = await query(
      'SELECT * FROM partners WHERE id_partner = $1 AND active = true',
      [partnerId]
    );

    if (partnerResult.rows.length === 0) {
      await logWebhook(partnerId, 'received', event, req.body, signature, 'failed', null, 'Partner no encontrado');
      return res.status(404).json({ error: 'Partner no encontrado' });
    }

    const partner = partnerResult.rows[0];

    // Verificar firma HMAC (usando body sin signature)
    const isValid = WebhookSecurity.verifySignature(bodyWithoutSignature, signature, partner.secret);
    
    if (!isValid) {
      await logWebhook(partnerId, 'received', event, req.body, signature, 'failed', null, 'Firma inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    console.log(`📨 [WebhookRoutes] Webhook recibido de ${partner.name}: ${event}`);

    // Procesar evento según el tipo
    await processPartnerEvent(event, data);

    // Guardar log exitoso
    await logWebhook(partnerId, 'received', event, req.body, signature, 'success', 200);

    res.json({ 
      received: true,
      event,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ [WebhookRoutes] Error al procesar webhook de partner:', error);
    res.status(500).json({ 
      error: 'Error al procesar webhook',
      message: error.message 
    });
  }
});

/**
 * POST /api/gym/webhook
 * Recibir webhook directamente del Gym B2B
 * Este endpoint usa el secret compartido para verificación
 */
router.post(['/webhook', '/marketplace'], async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-webhook-signature'] as string;
    // Extract signature from body if present to avoid verification mismatch
    const bodyWithoutSignature = { ...req.body };
    if ('signature' in bodyWithoutSignature) {
      delete bodyWithoutSignature.signature;
    }
    const { event, data, timestamp } = bodyWithoutSignature;

    console.log(`📨 [GymWebhook] Recibido evento: ${event}`);
    console.log(`📨 [GymWebhook] Timestamp: ${timestamp}`);
    console.log(`📨 [GymWebhook] Data:`, JSON.stringify(data, null, 2));

    // Validar que exista la firma
    if (!signature) {
      console.error('❌ [GymWebhook] Falta header X-Webhook-Signature');
      return res.status(400).json({ 
        error: 'Header X-Webhook-Signature requerido'
      });
    }

    // Secret compartido con el Gym
    const GYM_SHARED_SECRET = process.env.GYM_WEBHOOK_SECRET || 'super-secure-gym-marketplace-2026';

    // Verificar firma HMAC (usando body sin signature)
    const isValid = WebhookSecurity.verifySignature(bodyWithoutSignature, signature, GYM_SHARED_SECRET);
    
    if (!isValid) {
      console.error('❌ [GymWebhook] Firma inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    console.log('✅ [GymWebhook] Firma verificada correctamente');

    // Procesar evento según el tipo
    await processPartnerEvent(event, data);

    // Responder éxito
    res.json({ 
      received: true,
      event,
      processed_at: new Date().toISOString(),
      message: `Evento ${event} procesado exitosamente`
    });
  } catch (error: any) {
    console.error('❌ [GymWebhook] Error al procesar webhook:', error);
    res.status(500).json({ 
      error: 'Error al procesar webhook',
      message: error.message 
    });
  }
});

/**
 * POST /api/webhooks/stripe
 * Recibir webhook de Stripe
 */
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Stripe signature requerida' });
    }

    const paymentService = new PaymentService('stripe');

    // Verificar webhook de Stripe
    const isValid = paymentService.verifyWebhook(req.body, signature);

    if (!isValid) {
      console.error('❌ [WebhookRoutes] Webhook de Stripe inválido');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    // Normalizar evento de Stripe
    const normalized = paymentService.normalizeWebhook(req.body);

    console.log(`📨 [WebhookRoutes] Webhook de Stripe: ${normalized.event}`);

    // Actualizar transacción en BD
    await query(
      `UPDATE transactions 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE transaction_id = $2`,
      [normalized.status, normalized.transactionId]
    );

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ [WebhookRoutes] Error al procesar webhook de Stripe:', error);
    res.status(500).json({ 
      error: 'Error al procesar webhook',
      message: error.message 
    });
  }
});

/**
 * GET /api/webhooks/logs
 * Obtener logs de webhooks (para auditoría)
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { partner_id, event, status, limit = 50 } = req.query;

    let queryText = 'SELECT * FROM webhook_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (partner_id) {
      queryText += ` AND partner_id = $${paramIndex++}`;
      params.push(partner_id);
    }

    if (event) {
      queryText += ` AND event = $${paramIndex++}`;
      params.push(event);
    }

    if (status) {
      queryText += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(queryText, params);

    res.json({
      logs: result.rows,
      total: result.rows.length
    });
  } catch (error: any) {
    console.error('❌ [WebhookRoutes] Error al obtener logs:', error);
    res.status(500).json({ 
      error: 'Error al obtener logs',
      message: error.message 
    });
  }
});

// ============================================
// Funciones auxiliares
// ============================================

/**
 * Procesar evento de partner según el tipo
 */
async function processPartnerEvent(event: string, data: any): Promise<void> {
  switch (event) {
    case 'coupon.issued':
      console.log(`🎟️  Cupón recibido del Gym para ${data.customer_email}`);
      await gymWebhookService.processCouponIssued(data);
      break;

    case 'coupon.redeemed':
      console.log(`🎉 Cupón canjeado en Gym: ${data.coupon_code}`);
      await gymWebhookService.processCouponRedeemed(data);
      break;

    case 'membership.activated':
      console.log(`🏋️ Membresía activada en Gym para ${data.customer_email || data.user_email}`);
      await gymWebhookService.processMembershipActivated(data);
      break;

    case 'membership.created':
      console.log(`🏋️ Nueva membresía creada en Gym para ${data.customer_email || data.user_email}`);
      await gymWebhookService.processMembershipCreated(data);
      break;

    case DeliveryEvents.DELIVERY_ASSIGNED:
      console.log(`🚚 Repartidor asignado a orden #${data.order_id}`);
      // Actualizar orden en tu sistema
      break;

    case DeliveryEvents.DELIVERY_IN_TRANSIT:
      console.log(`🚗 Pedido en tránsito: orden #${data.order_id}`);
      // Actualizar tracking
      break;

    case DeliveryEvents.DELIVERY_COMPLETED:
      console.log(`✅ Pedido entregado: orden #${data.order_id}`);
      // Marcar orden como entregada
      break;

    case DeliveryEvents.DELIVERY_FAILED:
      console.log(`❌ Fallo en entrega: orden #${data.order_id}`);
      // Manejar fallo
      break;

    default:
      if (!isValidEvent(event)) {
        console.warn(`⚠️ Evento desconocido: ${event}`);
      } else {
        console.log(`ℹ️ Evento válido pero no manejado: ${event}`);
      }
  }
}

/**
 * Guardar log de webhook
 */
async function logWebhook(
  partnerId: number,
  direction: 'sent' | 'received',
  event: string,
  payload: any,
  signature: string,
  status: string,
  responseCode: number | null = null,
  errorMessage: string | null = null
): Promise<void> {
  try {
    await query(
      `INSERT INTO webhook_logs 
       (partner_id, direction, event, payload, signature, status, response_code, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        partnerId,
        direction,
        event,
        JSON.stringify(payload),
        signature,
        status,
        responseCode,
        errorMessage
      ]
    );
  } catch (error) {
    console.error('❌ Error al guardar log de webhook:', error);
  }
}

export default router;
