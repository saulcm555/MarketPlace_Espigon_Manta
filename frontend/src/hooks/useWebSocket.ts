import { useEffect, useRef, useCallback, useState } from 'react';
import config from '@/config/env';

/**
 * Evento de estadísticas recibido desde el WebSocket
 */
export interface StatsEvent {
  event: string;
  type: 'ADMIN_STATS_UPDATED' | 'SELLER_STATS_UPDATED';
  seller_id?: string;
  timestamp: string;
  metadata?: {
    order_id?: number;
    status?: string;
    action?: string;
  };
}

/**
 * Opciones para el hook useWebSocket
 */
export interface UseWebSocketOptions {
  /**
   * Token JWT para autenticación
   */
  token: string | null;
  
  /**
   * Callback que se ejecuta cuando llega un evento de estadísticas
   */
  onStatsUpdate?: (event: StatsEvent) => void;
  
  /**
   * Callback que se ejecuta cuando se conecta exitosamente
   */
  onConnect?: () => void;
  
  /**
   * Callback que se ejecuta cuando se desconecta
   */
  onDisconnect?: () => void;
  
  /**
   * Intervalo de reconexión en milisegundos (default: 5000)
   */
  reconnectInterval?: number;
  
  /**
   * Habilitar logs de debug
   */
  debug?: boolean;
}

/**
 * Hook personalizado para conectar al WebSocket del realtime_service
 * Maneja reconexión automática y eventos de estadísticas
 * 
 * @param options Opciones de configuración
 * @returns Estado de conexión
 * 
 * @example
 * const { isConnected } = useWebSocket({
 *   token: authToken,
 *   onStatsUpdate: (event) => {
 *     if (event.type === 'SELLER_STATS_UPDATED') {
 *       refetch(); // Refetch GraphQL queries
 *     }
 *   }
 * });
 */
export function useWebSocket(options: UseWebSocketOptions) {
  const {
    token,
    onStatsUpdate,
    onConnect,
    onDisconnect,
    reconnectInterval = 5000,
    debug = false
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const shouldReconnectRef = useRef(true);
  const isCleaningUpRef = useRef(false); // Prevenir múltiples limpiezas

  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log('[WebSocket]', ...args);
    }
  }, [debug]);

  const connect = useCallback(() => {
    if (!token) {
      log('No token provided, skipping connection');
      return;
    }

    // Prevenir múltiples conexiones simultáneas
    if (isCleaningUpRef.current) {
      log('Cleanup in progress, skipping connection');
      return;
    }

    // Limpiar conexión anterior si existe
    if (wsRef.current) {
      const oldWs = wsRef.current;
      wsRef.current = null;
      
      // Cerrar sin intentar reconectar
      if (oldWs.readyState === WebSocket.OPEN || oldWs.readyState === WebSocket.CONNECTING) {
        oldWs.close();
      }
    }

    try {
      // Construir URL con token como query param
      const wsUrl = `${config.wsUrl}/ws?token=${token}`;
      log('Connecting to:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        log('Connected');
        setIsConnected(true);
        onConnect?.();
        
        // Limpiar timeout de reconexión si existe
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          log('Message received:', data);

          // Verificar si es un evento que debemos procesar
          // Los eventos pueden venir con 'type' o 'event' dependiendo del origen
          const eventType = data.type || data.event;
          
          if (eventType === 'ADMIN_STATS_UPDATED' || 
              eventType === 'SELLER_STATS_UPDATED' ||
              eventType === 'PRODUCT_CREATED' ||
              eventType === 'PRODUCT_UPDATED' ||
              eventType === 'PRODUCT_DELETED' ||
              eventType === 'product_updated') {
            onStatsUpdate?.(data as StatsEvent);
          }
        } catch (error) {
          log('Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        log('Error:', error);
      };

      ws.onclose = (event) => {
        log('Disconnected');
        setIsConnected(false);
        
        // Solo limpiar si este es el WebSocket actual
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
        
        onDisconnect?.();

        // Intentar reconectar si está habilitado y no fue un cierre limpio
        if (shouldReconnectRef.current && token && !isCleaningUpRef.current && event.code !== 1000) {
          log(`Reconnecting in ${reconnectInterval}ms...`);
          
          // Limpiar timeout anterior si existe
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      log('Connection error:', error);
    }
  }, [token, onConnect, onDisconnect, onStatsUpdate, reconnectInterval, log]);

  // Conectar al montar y cuando cambie el token
  useEffect(() => {
    if (token) {
      shouldReconnectRef.current = true;
      isCleaningUpRef.current = false;
      connect();
    }

    // Cleanup al desmontar
    return () => {
      log('Cleaning up WebSocket connection');
      isCleaningUpRef.current = true;
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Solo reconectar cuando cambie el token

  return {
    isConnected,
    reconnect: connect
  };
}
