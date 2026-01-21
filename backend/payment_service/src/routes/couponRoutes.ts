/**
 * Coupon Routes
 * Endpoint específico para recibir webhooks del Gym (sistema aliado)
 */

import { Router, Request, Response } from 'express';
import { GymWebhookService } from '../services/GymWebhookService';
import crypto from 'crypto';
import { env } from '../config/env';

const router = Router();
const gymWebhookService = new GymWebhookService();

/**
 * POST /api/coupons/webhook/marketplace
 * Endpoint específico para recibir webhooks del Gym
 * Este endpoint espera:
 * - Header: x-signature (HMAC-SHA256)
 * - Body: { event, data }
 */
router.post('/webhook/marketplace', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const { event, data } = req.body;

    console.log(`🔔 [CouponRoutes] Webhook recibido del Gym: ${event}`);
    console.log(`📦 [CouponRoutes] Data:`, JSON.stringify(data, null, 2));

    // Validar headers
    if (!signature) {
      console.error('❌ [CouponRoutes] Falta header x-signature');
      return res.status(400).json({ 
        error: 'Header x-signature requerido'
      });
    }

    if (!event || !data) {
      console.error('❌ [CouponRoutes] Falta event o data en el body');
      return res.status(400).json({ 
        error: 'Body debe contener event y data'
      });
    }

    // Verificar firma HMAC
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', env.GYM_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ [CouponRoutes] Firma inválida');
      console.error(`   Recibida: ${signature}`);
      console.error(`   Esperada: ${expectedSignature}`);
      return res.status(401).json({ error: 'Firma inválida' });
    }

    console.log('✅ [CouponRoutes] Firma válida');

    // Procesar evento según el tipo
    switch (event) {
      case 'coupon.issued':
        console.log(`🎟️  [CouponRoutes] Cupón recibido del Gym para ${data.customer_email || data.email}`);
        await gymWebhookService.processCouponIssued(data);
        break;

      case 'coupon.redeemed':
        console.log(`🎉 [CouponRoutes] Cupón canjeado en Gym: ${data.coupon_code}`);
        await gymWebhookService.processCouponRedeemed(data);
        break;

      case 'membership.activated':
        console.log(`🏋️  [CouponRoutes] Membresía activada en Gym para ${data.customer_email || data.email}`);
        await gymWebhookService.processMembershipActivated(data);
        break;

      default:
        console.warn(`⚠️  [CouponRoutes] Evento desconocido: ${event}`);
        return res.status(400).json({ 
          error: 'Evento no soportado',
          supportedEvents: ['coupon.issued', 'coupon.redeemed', 'membership.activated']
        });
    }

    res.json({ 
      received: true,
      event,
      timestamp: new Date().toISOString(),
      message: 'Webhook procesado exitosamente'
    });
  } catch (error: any) {
    console.error('❌ [CouponRoutes] Error al procesar webhook del Gym:', error);
    res.status(500).json({ 
      error: 'Error al procesar webhook',
      message: error.message 
    });
  }
});

/**
 * GET /api/coupons/test
 * Endpoint de prueba para verificar que el servicio está disponible
 */
router.get('/test', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Coupon webhook endpoint disponible',
    endpoint: 'POST /api/coupons/webhook/marketplace',
    authentication: 'HMAC-SHA256 en header x-signature',
    secret_configured: !!env.GYM_WEBHOOK_SECRET,
    timestamp: new Date().toISOString()
  });
});

export default router;
