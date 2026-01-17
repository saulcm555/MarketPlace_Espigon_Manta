/**
 * Payment Routes
 * Endpoints para procesar pagos y reembolsos
 */

import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { WebhookService } from '../services/WebhookService';

const router = Router();
const paymentService = new PaymentService();

/**
 * POST /api/payments/process
 * Procesar un pago
 */
router.post('/process', async (req: Request, res: Response) => {
  try {
    const { amount, currency, description, orderId, customerId, metadata } = req.body;

    // Validaciones
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    if (!currency) {
      return res.status(400).json({ error: 'Moneda requerida' });
    }

    // Procesar pago
    const result = await paymentService.processPayment({
      amount,
      currency: currency.toUpperCase(),
      description: description || `Pago orden #${orderId}`,
      orderId,
      customerId,
      metadata
    });

    // Si el pago fue exitoso, enviar webhook a partners
    if (result.success && result.status === 'completed') {
      await WebhookService.broadcastEvent('payment.success', {
        transactionId: result.transactionId,
        orderId,
        amount,
        currency,
        timestamp: new Date().toISOString()
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ [PaymentRoutes] Error al procesar pago:', error);
    res.status(500).json({ 
      error: 'Error al procesar pago',
      message: error.message 
    });
  }
});

/**
 * POST /api/payments/refund
 * Reembolsar un pago
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { transactionId, amount } = req.body;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID requerido' });
    }

    // Procesar reembolso
    const result = await paymentService.refundPayment(transactionId, amount);

    // Si el reembolso fue exitoso, notificar a partners
    if (result.success) {
      await WebhookService.broadcastEvent('payment.refunded', {
        transactionId,
        refundId: result.refundId,
        amount: result.amount,
        timestamp: new Date().toISOString()
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error('❌ [PaymentRoutes] Error al procesar reembolso:', error);
    res.status(500).json({ 
      error: 'Error al procesar reembolso',
      message: error.message 
    });
  }
});

/**
 * GET /api/payments/transaction/:id
 * Obtener información de una transacción
 */
router.get('/transaction/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { query } = await import('../config/database');

    const result = await query(
      'SELECT * FROM transactions WHERE transaction_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('❌ [PaymentRoutes] Error al obtener transacción:', error);
    res.status(500).json({ 
      error: 'Error al obtener transacción',
      message: error.message 
    });
  }
});

export default router;
