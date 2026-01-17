/**
 * Payment Routes
 * Endpoints para procesar pagos y reembolsos
 */

import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { WebhookService } from '../services/WebhookService';
import { internalAuthMiddleware } from '../middlewares/internalAuth';
import { PaymentEvents } from '../contracts/events';
import { 
  ProcessPaymentRequest, 
  ProcessPaymentResponse,
  RefundRequest,
  RefundResponse,
  TransactionDTO,
  PaymentSuccessPayload,
  PaymentRefundedPayload
} from '../contracts/payment.dto';

const router = Router();
const paymentService = new PaymentService();

/**
 * POST /api/payments/process
 * Procesar un pago
 * 
 * @protected Requiere X-Internal-Api-Key header
 */
router.post('/process', internalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount, currency, description, orderId, customerId, metadata } = req.body as ProcessPaymentRequest;

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
      const successPayload: PaymentSuccessPayload = {
        transactionId: result.transactionId,
        orderId,
        amount,
        currency,
        timestamp: new Date().toISOString()
      };
      await WebhookService.broadcastEvent(PaymentEvents.PAYMENT_SUCCESS, successPayload);
    }

    res.json(result as ProcessPaymentResponse);
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
 * 
 * @protected Requiere X-Internal-Api-Key header
 */
router.post('/refund', internalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { transactionId, amount } = req.body as RefundRequest;

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID requerido' });
    }

    // Procesar reembolso
    const result = await paymentService.refundPayment(transactionId, amount);

    // Si el reembolso fue exitoso, notificar a partners
    if (result.success) {
      const refundPayload: PaymentRefundedPayload = {
        transactionId,
        refundId: result.refundId,
        amount: result.amount,
        timestamp: new Date().toISOString()
      };
      await WebhookService.broadcastEvent(PaymentEvents.PAYMENT_REFUNDED, refundPayload);
    }

    res.json(result as RefundResponse);
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
 * 
 * @protected Requiere X-Internal-Api-Key header
 */
router.get('/transaction/:id', internalAuthMiddleware, async (req: Request, res: Response) => {
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

    res.json(result.rows[0] as TransactionDTO);
  } catch (error: any) {
    console.error('❌ [PaymentRoutes] Error al obtener transacción:', error);
    res.status(500).json({ 
      error: 'Error al obtener transacción',
      message: error.message 
    });
  }
});

export default router;
