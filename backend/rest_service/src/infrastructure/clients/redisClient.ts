import { createClient } from 'redis';

// Variable para rastrear si Redis está disponible
let redisAvailable = true;

// Crear cliente Redis con configuración desde variables de entorno
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      // Si Redis no está disponible, no intentar reconectar
      if (!redisAvailable) {
        return false;
      }
      // Limitar a 3 intentos solamente
      if (retries > 3) {
        console.log('⚠️  Redis: Deshabilitando reconexión automática');
        redisAvailable = false;
        return false;
      }
      return Math.min(retries * 100, 1000);
    }
  }
});

// Event listeners para monitoreo (solo si Redis está habilitado)
redisClient.on('error', (err: Error) => {
  // Silenciar errores de conexión repetitivos
  if (redisAvailable && err.message && !err.message.includes('ECONNREFUSED')) {
    console.error('❌ Redis Client Error:', err.message);
  }
});

redisClient.on('connect', () => {
  console.log('🔄 Redis: Connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis: Connected and ready');
  redisAvailable = true;
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
  } catch (error: any) {
    redisAvailable = false;
    console.warn('⚠️  Redis not available - Application will continue without Redis');
    console.warn('   (Real-time notifications will be disabled)');
    // No mostrar el stack trace completo, solo el mensaje
    if (error?.code === 'ECONNREFUSED') {
      console.warn('   Tip: Start Redis with: docker run -p 6379:6379 redis');
    }
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
  return redisAvailable && redisClient.isOpen && redisClient.isReady;
}

/**
 * Verifica si Redis está habilitado/disponible en el sistema.
 */
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export { redisClient };
