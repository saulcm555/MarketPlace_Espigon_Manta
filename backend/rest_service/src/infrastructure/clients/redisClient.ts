import { createClient } from 'redis';

// Crear cliente Redis con configuración desde variables de entorno
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      // Reconectar con backoff exponencial, máximo 3 segundos
      if (retries > 10) {
        console.error('❌ Redis: Too many reconnection attempts');
        return new Error('Too many retries');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Event listeners para monitoreo
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis: Reconnecting...');
});

redisClient.on('end', () => {
  console.log('⚠️  Redis: Connection closed');
});

/**
 * Conecta el cliente Redis.
 * Debe llamarse durante la inicialización de la aplicación.
 */
export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    console.warn('⚠️  Application will continue without Redis (notifications disabled)');
  }
}

/**
 * Cierra la conexión Redis de forma ordenada.
 * Debe llamarse durante el shutdown de la aplicación.
 */
export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    console.log('✅ Redis disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error);
  }
}

/**
 * Verifica si Redis está conectado y listo.
 */
export function isRedisConnected(): boolean {
  return redisClient.isOpen && redisClient.isReady;
}

export { redisClient };
