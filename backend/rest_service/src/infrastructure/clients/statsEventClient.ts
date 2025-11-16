import { redisClient, isRedisConnected } from './redisClient';

/**
 * Cliente para publicar eventos de actualización de estadísticas
 * Estos eventos son escuchados por realtime_service y enviados a los clientes WebSocket correspondientes
 */

export interface StatsEvent {
  type: 'ADMIN_STATS_UPDATED' | 'SELLER_STATS_UPDATED';
  seller_id?: string;  // Requerido para SELLER_STATS_UPDATED
  timestamp: string;
  metadata?: {
    order_id?: number;
    status?: string;
    action?: string;
  };
}

/**
 * Publica un evento de actualización de estadísticas en el canal 'events' de Redis
 * El realtime_service escucha este canal y distribuye los eventos a los clientes WebSocket
 * 
 * @param event - Evento de estadísticas a publicar
 */
export async function publishStatsEvent(event: StatsEvent): Promise<void> {
  if (!isRedisConnected()) {
    console.warn('⚠️  Redis not connected, stats event not published:', event.type);
    return;
  }

  try {
    const message = JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    });

    // Publicar en el canal 'events' que escucha el realtime_service
    await redisClient.publish('events', message);
    
    console.log(`✅ Stats event published: ${event.type}${event.seller_id ? ` (seller: ${event.seller_id})` : ' (global)'}`);
  } catch (error) {
    console.error('❌ Error publishing stats event:', error);
    // No lanzamos el error para no bloquear el flujo principal
  }
}

/**
 * Notifica que las estadísticas de un vendedor deben actualizarse
 * El frontend del vendedor recibirá esta notificación y hará refetch de GraphQL
 * 
 * @param sellerId - ID del vendedor afectado
 * @param metadata - Información adicional sobre el cambio
 */
export async function notifySellerStatsUpdated(
  sellerId: string | number,
  metadata?: { order_id?: number; status?: string; action?: string }
): Promise<void> {
  await publishStatsEvent({
    type: 'SELLER_STATS_UPDATED',
    seller_id: sellerId.toString(),
    timestamp: new Date().toISOString(),
    ...(metadata && { metadata })
  });
}

/**
 * Notifica que las estadísticas globales (admin) deben actualizarse
 * El frontend del admin recibirá esta notificación y hará refetch de GraphQL
 * 
 * @param metadata - Información adicional sobre el cambio
 */
export async function notifyAdminStatsUpdated(
  metadata?: { order_id?: number; status?: string; action?: string }
): Promise<void> {
  await publishStatsEvent({
    type: 'ADMIN_STATS_UPDATED',
    timestamp: new Date().toISOString(),
    ...(metadata && { metadata })
  });
}
