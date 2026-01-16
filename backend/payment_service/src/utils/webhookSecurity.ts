/**
 * Webhook Security Utilities
 * Generación y verificación de firmas HMAC-SHA256
 */

import crypto from 'crypto';

export class WebhookSecurity {
  /**
   * Generar firma HMAC-SHA256 para un payload
   */
  static generateSignature(payload: any, secret: string): string {
    const payloadString = typeof payload === 'string' 
      ? payload 
      : JSON.stringify(payload);
    
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verificar firma HMAC-SHA256
   */
  static verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    
    // Comparación segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generar secret aleatorio para partners
   */
  static generateSecret(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
