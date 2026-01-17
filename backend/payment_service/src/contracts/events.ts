/**
 * Payment Events - Constantes de Eventos
 * 
 * Centraliza todos los nombres de eventos del Payment Service.
 * Usar estas constantes en lugar de strings hardcodeados.
 * 
 * @module contracts/events
 */

/**
 * Eventos de pago
 */
export const PaymentEvents = {
  /** Pago completado exitosamente */
  PAYMENT_SUCCESS: 'payment.success',
  
  /** Pago fallido */
  PAYMENT_FAILED: 'payment.failed',
  
  /** Pago reembolsado */
  PAYMENT_REFUNDED: 'payment.refunded',
  
  /** Pago cancelado */
  PAYMENT_CANCELLED: 'payment.cancelled',
  
  /** Pago pendiente de confirmación */
  PAYMENT_PENDING: 'payment.pending',
} as const;

/**
 * Eventos de órdenes (recibidos de otros servicios)
 */
export const OrderEvents = {
  /** Nueva orden creada */
  ORDER_CREATED: 'order.created',
  
  /** Orden actualizada */
  ORDER_UPDATED: 'order.updated',
  
  /** Orden cancelada */
  ORDER_CANCELLED: 'order.cancelled',
} as const;

/**
 * Eventos de delivery (recibidos de partners)
 */
export const DeliveryEvents = {
  /** Repartidor asignado */
  DELIVERY_ASSIGNED: 'delivery.assigned',
  
  /** Pedido en tránsito */
  DELIVERY_IN_TRANSIT: 'delivery.in_transit',
  
  /** Pedido entregado */
  DELIVERY_COMPLETED: 'delivery.completed',
  
  /** Fallo en entrega */
  DELIVERY_FAILED: 'delivery.failed',
} as const;

/**
 * Todos los eventos disponibles
 */
export const WebhookEvents = {
  ...PaymentEvents,
  ...OrderEvents,
  ...DeliveryEvents,
} as const;

/**
 * Tipos de eventos
 */
export type PaymentEventType = typeof PaymentEvents[keyof typeof PaymentEvents];
export type OrderEventType = typeof OrderEvents[keyof typeof OrderEvents];
export type DeliveryEventType = typeof DeliveryEvents[keyof typeof DeliveryEvents];
export type WebhookEventType = typeof WebhookEvents[keyof typeof WebhookEvents];

/**
 * Lista de eventos disponibles para suscripción de partners
 */
export const AVAILABLE_EVENTS: WebhookEventType[] = [
  PaymentEvents.PAYMENT_SUCCESS,
  PaymentEvents.PAYMENT_FAILED,
  PaymentEvents.PAYMENT_REFUNDED,
  OrderEvents.ORDER_CREATED,
  OrderEvents.ORDER_UPDATED,
];

/**
 * Valida si un string es un evento válido
 */
export function isValidEvent(event: string): event is WebhookEventType {
  return Object.values(WebhookEvents).includes(event as WebhookEventType);
}
