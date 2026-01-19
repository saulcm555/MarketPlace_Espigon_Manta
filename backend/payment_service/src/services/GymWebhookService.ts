import crypto from 'crypto';

/**
 * Servicio para manejar webhooks entrantes del Gym Management System
 * Maneja la recepción y procesamiento de cupones emitidos por el Gym
 */
export class GymWebhookService {
  private readonly gymSecret: string;

  constructor() {
    // Secret que el Gym nos proporciona para validar sus webhooks
    this.gymSecret = process.env.GYM_WEBHOOK_SECRET || '';
    
    if (!this.gymSecret) {
      console.warn('⚠️  GYM_WEBHOOK_SECRET no está configurado en .env');
    }
  }

  /**
   * Verifica la firma HMAC del webhook recibido del Gym
   */
  verifySignature(payload: string, receivedSignature: string): boolean {
    if (!this.gymSecret) {
      console.error('❌ No se puede verificar firma sin GYM_WEBHOOK_SECRET');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.gymSecret)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison para prevenir timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(receivedSignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('❌ Error al verificar firma HMAC:', error);
      return false;
    }
  }

  /**
   * Procesa el evento coupon.issued del Gym
   * Guarda el cupón en la base de datos para que el usuario lo pueda usar
   */
  async processCouponIssued(data: any): Promise<void> {
    console.log('📨 Procesando cupón recibido del Gym:', data);

    try {
      // Validar datos requeridos
      if (!data.customer_email || !data.coupon_code) {
        throw new Error('Datos de cupón incompletos: se requiere email y código');
      }

      // En una implementación real, aquí guardarías en la base de datos
      // Por ahora, notificamos al REST Service para que lo guarde
      const restServiceUrl = process.env.REST_SERVICE_URL || 'http://rest-service:3000';
      
      const response = await fetch(`${restServiceUrl}/api/coupons/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluir token interno para autenticar servicio-a-servicio
          'X-Service-Token': process.env.INTERNAL_SERVICE_TOKEN || 'dev-token'
        },
        body: JSON.stringify({
          code: data.coupon_code,
          discount_percent: data.discount_percent || 15,
          discount_type: data.discount_type || 'percentage',
          valid_for: data.valid_for || 'marketplace_products',
          expires_at: data.expires_at,
          issued_by: data.issued_by || 'Gym Management',
          minimum_purchase: data.minimum_purchase || 0,
          customer_email: data.customer_email,
          customer_name: data.customer_name,
          is_active: true,
          used: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Error al guardar cupón en REST Service: ${error}`);
      }

      const result = await response.json();
      console.log('✅ Cupón guardado exitosamente:', result);

    } catch (error) {
      console.error('❌ Error al procesar cupón del Gym:', error);
      throw error;
    }
  }

  /**
   * Procesa el evento coupon.redeemed del Gym (opcional)
   * Registra cuando un cupón que nosotros enviamos fue usado en el Gym
   */
  async processCouponRedeemed(data: any): Promise<void> {
    console.log('🎟️  Cupón canjeado en Gym:', data);

    // Aquí podrías actualizar estadísticas o notificar al usuario
    // Por ahora solo loggeamos el evento
    try {
      console.log(`✅ El usuario ${data.customer_email} usó el cupón ${data.coupon_code} en el Gym`);
    } catch (error) {
      console.error('❌ Error al procesar redención:', error);
    }
  }

  /**
   * Procesa el evento membership.activated del Gym (opcional)
   * Notifica cuando un usuario activa su membresía usando nuestro cupón
   */
  async processMembershipActivated(data: any): Promise<void> {
    console.log('🏋️ Membresía activada en Gym:', data);

    try {
      const email = data.customer_email || data.user_email;
      console.log(`✅ Usuario ${email} activó membresía: ${data.membership_type}`);
    } catch (error) {
      console.error('❌ Error al procesar activación de membresía:', error);
    }
  }

  /**
   * Procesa el evento membership.created del Gym
   * Cuando un usuario del Gym crea una nueva membresía, le damos un cupón de bienvenida
   */
  async processMembershipCreated(data: any): Promise<void> {
    console.log('🏋️ Nueva membresía creada en Gym:', data);

    try {
      const email = data.customer_email || data.user_email;
      const membershipType = data.membership_type || 'standard';
      
      console.log(`✅ Usuario ${email} creó membresía ${membershipType}`);
      
      // Generar cupón de bienvenida para el nuevo miembro del Gym
      const discountPercent = membershipType === 'premium' ? 20 : 10;
      const couponCode = `GYM-WELCOME-${Date.now().toString(36).toUpperCase()}`;
      
      console.log(`🎁 Generando cupón de bienvenida: ${couponCode} (${discountPercent}% descuento)`);
      
      // En una implementación real, guardarías el cupón y notificarías al usuario
      // Por ahora solo loggeamos
      console.log(`📧 Cupón ${couponCode} listo para usuario ${email}`);
      
    } catch (error) {
      console.error('❌ Error al procesar creación de membresía:', error);
    }
  }
}
