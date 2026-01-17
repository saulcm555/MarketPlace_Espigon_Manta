/**
 * Payment DTOs - Contratos de Datos
 * 
 * Define las interfaces para requests, responses y entidades
 * del Payment Service. Alineados con la tabla `transactions`.
 * 
 * @module contracts/payment.dto
 */

// ============================================
// REQUEST DTOs
// ============================================

/**
 * Request para procesar un pago
 * POST /api/payments/process
 */
export interface ProcessPaymentRequest {
  /** Monto a cobrar (requerido) */
  amount: number;
  
  /** Código de moneda ISO 4217 (requerido, ej: 'USD', 'EUR') */
  currency: string;
  
  /** Descripción del pago (opcional) */
  description?: string;
  
  /** ID de la orden asociada (opcional) */
  orderId?: number;
  
  /** ID del cliente (opcional) */
  customerId?: number;
  
  /** Datos adicionales (opcional) */
  metadata?: Record<string, any>;
}

/**
 * Request para reembolsar un pago
 * POST /api/payments/refund
 */
export interface RefundRequest {
  /** ID de transacción a reembolsar (requerido) */
  transactionId: string;
  
  /** Monto a reembolsar (opcional, si no se especifica reembolsa todo) */
  amount?: number;
  
  /** Razón del reembolso (opcional) */
  reason?: string;
}

/**
 * Request para consultar transacción
 * GET /api/payments/transaction/:id
 */
export interface GetTransactionRequest {
  /** ID de transacción */
  transactionId: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Estados posibles de una transacción
 */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Response de procesamiento de pago
 */
export interface ProcessPaymentResponse {
  /** Indica si el pago fue exitoso */
  success: boolean;
  
  /** ID único de la transacción */
  transactionId: string;
  
  /** Monto procesado */
  amount: number;
  
  /** Moneda del pago */
  currency: string;
  
  /** Estado de la transacción */
  status: TransactionStatus;
  
  /** Metadata adicional */
  metadata?: Record<string, any>;
  
  /** Mensaje de error (solo si success=false) */
  errorMessage?: string;
}

/**
 * Response de reembolso
 */
export interface RefundResponse {
  /** Indica si el reembolso fue exitoso */
  success: boolean;
  
  /** ID del reembolso */
  refundId: string;
  
  /** Monto reembolsado */
  amount: number;
  
  /** Estado del reembolso */
  status: TransactionStatus;
  
  /** Mensaje de error (solo si success=false) */
  errorMessage?: string;
}

// ============================================
// ENTITY DTOs
// ============================================

/**
 * Representa una transacción de la tabla `transactions`
 * Mapea directamente a las columnas de la BD
 */
export interface TransactionDTO {
  /** ID autoincremental de la BD */
  id?: number;
  
  /** ID único de transacción del provider */
  transaction_id: string;
  
  /** Monto de la transacción */
  amount: number;
  
  /** Código de moneda */
  currency: string;
  
  /** Estado actual */
  status: TransactionStatus;
  
  /** ID de orden asociada */
  order_id?: number | null;
  
  /** ID del cliente */
  customer_id?: number | null;
  
  /** Proveedor de pago usado */
  provider: 'mock' | 'stripe' | 'mercadopago';
  
  /** Datos adicionales en JSON */
  metadata?: Record<string, any> | null;
  
  /** ID de reembolso (si aplica) */
  refund_id?: string | null;
  
  /** Mensaje de error (si falló) */
  error_message?: string | null;
  
  /** Fecha de creación */
  created_at?: Date | string;
  
  /** Fecha de última actualización */
  updated_at?: Date | string;
}

/**
 * Representa un partner B2B de la tabla `partners`
 */
export interface PartnerDTO {
  /** ID del partner */
  id_partner: number;
  
  /** Nombre del partner */
  name: string;
  
  /** URL del webhook */
  webhook_url: string;
  
  /** Eventos suscritos */
  events: string[];
  
  /** Secret para HMAC (solo en respuesta de registro) */
  secret?: string;
  
  /** Estado activo/inactivo */
  active: boolean;
  
  /** Fecha de creación */
  created_at?: Date | string;
  
  /** Fecha de actualización */
  updated_at?: Date | string;
}

/**
 * Log de webhook de la tabla `webhook_logs`
 */
export interface WebhookLogDTO {
  /** ID del log */
  id: number;
  
  /** ID del partner */
  partner_id: number;
  
  /** Dirección del webhook */
  direction: 'sent' | 'received';
  
  /** Nombre del evento */
  event: string;
  
  /** Payload enviado/recibido */
  payload: Record<string, any>;
  
  /** Firma HMAC */
  signature: string;
  
  /** Estado del envío */
  status: 'pending' | 'success' | 'failed';
  
  /** Código de respuesta HTTP */
  response_code?: number;
  
  /** Cuerpo de respuesta */
  response_body?: string;
  
  /** Mensaje de error */
  error_message?: string;
  
  /** Fecha de creación */
  created_at?: Date | string;
}

// ============================================
// EVENT PAYLOADS
// ============================================

/**
 * Payload base para todos los eventos de webhook
 */
export interface BaseEventPayload {
  /** Timestamp ISO 8601 */
  timestamp: string;
}

/**
 * Payload del evento payment.success
 */
export interface PaymentSuccessPayload extends BaseEventPayload {
  /** ID de transacción */
  transactionId: string;
  
  /** ID de orden */
  orderId?: number;
  
  /** Monto pagado */
  amount: number;
  
  /** Moneda */
  currency: string;
}

/**
 * Payload del evento payment.failed
 */
export interface PaymentFailedPayload extends BaseEventPayload {
  /** ID de transacción */
  transactionId: string;
  
  /** ID de orden */
  orderId?: number;
  
  /** Monto intentado */
  amount: number;
  
  /** Moneda */
  currency: string;
  
  /** Razón del fallo */
  errorMessage: string;
}

/**
 * Payload del evento payment.refunded
 */
export interface PaymentRefundedPayload extends BaseEventPayload {
  /** ID de transacción original */
  transactionId: string;
  
  /** ID de reembolso */
  refundId: string;
  
  /** Monto reembolsado */
  amount: number;
}

/**
 * Union de todos los payloads de eventos
 */
export type PaymentEventPayload = 
  | PaymentSuccessPayload 
  | PaymentFailedPayload 
  | PaymentRefundedPayload;

// ============================================
// API ERROR
// ============================================

/**
 * Estructura estándar de error de la API
 */
export interface ApiError {
  /** Mensaje de error */
  error: string;
  
  /** Detalles adicionales */
  message?: string;
  
  /** Código de error interno */
  code?: string;
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Response del endpoint /health
 */
export interface HealthCheckResponse {
  /** Estado del servicio */
  status: 'ok' | 'error';
  
  /** Nombre del servicio */
  service: string;
  
  /** Timestamp */
  timestamp: string;
  
  /** Versión */
  version: string;
  
  /** Ambiente */
  environment: string;
  
  /** Provider de pago activo */
  provider: string;
}
