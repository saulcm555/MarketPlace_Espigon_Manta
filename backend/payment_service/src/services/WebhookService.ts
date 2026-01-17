/**
 * Webhook Service
 * Gestiona el envío de webhooks a partners B2B
 */

import axios from 'axios';
import { query } from '../config/database';
import { WebhookSecurity } from '../utils/webhookSecurity';
import { env } from '../config/env';

export class WebhookService {
  /**
   * Enviar webhook a un partner específico
   */
  static async sendToPartner(
    partnerId: number,
    event: string,
    data: any
  ): Promise<boolean> {
    try {
      // Buscar partner en BD
      const partnerResult = await query(
        'SELECT * FROM partners WHERE id_partner = $1 AND active = true',
        [partnerId]
      );

      if (partnerResult.rows.length === 0) {
        console.warn(`⚠️ [WebhookService] Partner ${partnerId} no encontrado o inactivo`);
        return false;
      }

      const partner = partnerResult.rows[0];

      // Verificar si el partner está suscrito a este evento
      if (!partner.events.includes(event)) {
        console.log(`ℹ️ [WebhookService] Partner ${partner.name} no está suscrito a ${event}`);
        return false;
      }

      return await this.sendWebhook(
        partner.webhook_url,
        partner.secret,
        partnerId,
        event,
        data
      );
    } catch (error: any) {
      console.error(`❌ [WebhookService] Error al enviar webhook:`, error.message);
      return false;
    }
  }

  /**
   * Enviar webhook a todos los partners suscritos a un evento
   */
  static async broadcastEvent(event: string, data: any): Promise<void> {
    try {
      const partnersResult = await query(
        'SELECT * FROM partners WHERE $1 = ANY(events) AND active = true',
        [event]
      );

      console.log(`📢 [WebhookService] Broadcasting ${event} a ${partnersResult.rows.length} partners`);

      // Enviar webhooks en paralelo
      const promises = partnersResult.rows.map(partner =>
        this.sendWebhook(
          partner.webhook_url,
          partner.secret,
          partner.id_partner,
          event,
          data
        )
      );

      await Promise.allSettled(promises);
    } catch (error: any) {
      console.error(`❌ [WebhookService] Error en broadcast:`, error.message);
    }
  }

  /**
   * Enviar webhook HTTP con firma HMAC
   */
  private static async sendWebhook(
    webhookUrl: string,
    secret: string,
    partnerId: number,
    event: string,
    data: any
  ): Promise<boolean> {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    // Generar firma HMAC
    const signature = WebhookSecurity.generateSignature(payload, secret);

    let attempt = 0;
    const maxAttempts = env.WEBHOOK_RETRY_ATTEMPTS;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        console.log(`📤 [WebhookService] Enviando webhook a ${webhookUrl} (intento ${attempt}/${maxAttempts})`);

        const response = await axios.post(webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-Event': event,
            'X-Partner-Id': partnerId.toString()
          },
          timeout: env.WEBHOOK_TIMEOUT
        });

        // Guardar log exitoso
        await this.logWebhook({
          partnerId,
          direction: 'sent',
          event,
          payload,
          signature,
          status: 'success',
          responseCode: response.status,
          responseBody: JSON.stringify(response.data)
        });

        console.log(`✅ [WebhookService] Webhook enviado exitosamente a ${webhookUrl}`);
        return true;

      } catch (error: any) {
        const isLastAttempt = attempt === maxAttempts;
        const status = isLastAttempt ? 'failed' : 'pending';

        // Guardar log de error
        await this.logWebhook({
          partnerId,
          direction: 'sent',
          event,
          payload,
          signature,
          status,
          responseCode: error.response?.status || 0,
          errorMessage: error.message
        });

        if (isLastAttempt) {
          console.error(`❌ [WebhookService] Webhook falló después de ${maxAttempts} intentos: ${error.message}`);
          return false;
        }

        // Esperar antes de reintentar (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  /**
   * Guardar log de webhook en BD
   */
  private static async logWebhook(data: {
    partnerId: number;
    direction: 'sent' | 'received';
    event: string;
    payload: any;
    signature: string;
    status: string;
    responseCode?: number;
    responseBody?: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO webhook_logs 
         (partner_id, direction, event, payload, signature, status, response_code, response_body, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          data.partnerId,
          data.direction,
          data.event,
          JSON.stringify(data.payload),
          data.signature,
          data.status,
          data.responseCode || null,
          data.responseBody || null,
          data.errorMessage || null
        ]
      );
    } catch (error) {
      console.error('❌ [WebhookService] Error al guardar log:', error);
    }
  }
}
