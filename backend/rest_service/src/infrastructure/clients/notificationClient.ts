import { redisClient, isRedisConnected } from './redisClient';
import axios from 'axios';

const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || 'http://localhost:8080';

/**
 * Interfaz para las notificaciones que se envían a los clientes WebSocket
 */
export interface NotificationPayload {
  event: string;        // Tipo de evento: 'order_created', 'order_updated', 'product_updated', etc.
  data: any;            // Datos del evento
  user_id?: string;     // ID del usuario específico (opcional)
  room?: string;        // ID de la sala para broadcast (opcional)
}

/**
 * Publica un evento en Redis para que realtime_service lo distribuya por WebSocket.
 * Esta es la forma PREFERIDA (más rápida y eficiente).
 * 
 * @param room - Nombre de la sala (ej: 'seller-123', 'order-456')
 * @param event - Tipo de evento
 * @param data - Datos del evento
 */
export async function publishToRedis(room: string, event: string, data: any): Promise<void> {
  if (!isRedisConnected()) {
    console.warn('⚠️  Redis not connected, notification not sent');
    return;
  }

  try {
    const message = {
      event,
      data,
      to: room,
      timestamp: new Date().toISOString()
    };

    // Publicar en el canal con formato: ws:room:{room}
    const channel = `ws:room:${room}`;
    await redisClient.publish(channel, JSON.stringify(message));
    
    console.log(`✅ Notification published to Redis: ${channel} (event: ${event})`);
  } catch (error) {
    console.error('❌ Error publishing to Redis:', error);
    throw error;
  }
}

/**
 * Envía una notificación mediante HTTP al realtime_service.
 * Esta es una alternativa cuando Redis no está disponible o para casos especiales.
 * 
 * @param payload - Datos de la notificación
 */
export async function sendNotificationHTTP(payload: NotificationPayload): Promise<void> {
  try {
    await axios.post(`${REALTIME_SERVICE_URL}/api/notify`, payload, {
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Notification sent via HTTP (event: ${payload.event})`);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Error sending notification via HTTP:', error.message);
    } else {
      console.error('❌ Error sending notification via HTTP:', error);
    }
    // No lanzamos el error para no bloquear el flujo principal
  }
}

/**
 * Envía una notificación intentando primero Redis y cayendo a HTTP si falla.
 * Esta es la función RECOMENDADA para usar en los casos de uso.
 * 
 * @param payload - Datos de la notificación
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  // Validar que se especifique al menos user_id o room
  if (!payload.user_id && !payload.room) {
    console.warn('⚠️  Notification must specify user_id or room');
    return;
  }

  // Priorizar Redis si está disponible
  if (isRedisConnected() && payload.room) {
    try {
      await publishToRedis(payload.room, payload.event, payload.data);
      return;
    } catch (error) {
      console.warn('⚠️  Redis publish failed, falling back to HTTP');
    }
  }

  // Fallback: usar HTTP
  await sendNotificationHTTP(payload);
}

/**
 * Notificaciones específicas por dominio (helpers de alto nivel)
 */

/**
 * Notifica sobre una nueva orden creada
 */
export async function notifyOrderCreated(orderId: number, clientId: string, sellerId: string, orderData: any): Promise<void> {
  // Notificar al cliente
  await sendNotification({
    event: 'order_created',
    data: { order_id: orderId, ...orderData },
    room: `client-${clientId}`
  });

  // Notificar al vendedor
  await sendNotification({
    event: 'order_created',
    data: { order_id: orderId, ...orderData },
    room: `seller-${sellerId}`
  });
}

/**
 * Notifica sobre actualización de estado de orden
 */
export async function notifyOrderUpdated(orderId: number, clientId: string, sellerId: string, status: string, orderData: any): Promise<void> {
  const notification = {
    event: 'order_updated',
    data: { order_id: orderId, status, ...orderData }
  };

  // Notificar al cliente
  await sendNotification({
    ...notification,
    room: `client-${clientId}`
  });

  // Notificar al vendedor
  await sendNotification({
    ...notification,
    room: `seller-${sellerId}`
  });
}

/**
 * Notifica sobre actualización de producto
 */
export async function notifyProductUpdated(productId: number, sellerId: string, productData: any): Promise<void> {
  await sendNotification({
    event: 'product_updated',
    data: { product_id: productId, ...productData },
    room: `seller-${sellerId}`
  });
}

/**
 * Notifica sobre actualización de inventario
 */
export async function notifyInventoryUpdated(productId: number, sellerId: string, inventoryData: any): Promise<void> {
  await sendNotification({
    event: 'inventory_updated',
    data: { product_id: productId, ...inventoryData },
    room: `seller-${sellerId}`
  });
}

/**
 * Notifica sobre un nuevo mensaje o chat
 */
export async function notifyNewMessage(senderId: string, receiverId: string, messageData: any): Promise<void> {
  await sendNotification({
    event: 'new_message',
    data: { sender_id: senderId, ...messageData },
    room: `user-${receiverId}`
  });
}

/**
 * Broadcast a todos los administradores
 */
export async function notifyAdmins(event: string, data: any): Promise<void> {
  await sendNotification({
    event,
    data,
    room: 'admins'
  });
}
