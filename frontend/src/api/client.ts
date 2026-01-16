/**
 * Axios Client Configuration
 * Cliente HTTP configurado con interceptores para manejo de auth y errores
 * ACTUALIZADO: Auto-refresh de tokens cuando expiran (Pilar 1)
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from '@/config/env';
import type { ApiError } from '@/types/api';

// Flag para evitar múltiples refreshes simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Crear instancia de Axios
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Request Interceptor - Agregar token JWT
// ============================================
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del localStorage
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor - Manejo de errores y auto-refresh
// ============================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Si la respuesta es exitosa, retornar data
    return response;
  },
  async (error: AxiosError<ApiError & { code?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      // Si es 401 con TOKEN_EXPIRED, intentar refresh
      if (status === 401 && data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        if (isRefreshing) {
          // Ya hay un refresh en progreso, esperar
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Importar dinámicamente para evitar circular dependency
          const { refreshTokens } = await import('./auth');
          const tokenResponse = await refreshTokens();
          
          if (tokenResponse) {
            // Actualizar el header con el nuevo token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${tokenResponse.access_token}`;
            }
            
            processQueue(null, tokenResponse.access_token);
            isRefreshing = false;
            
            // Reintentar la petición original
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Refresh falló, limpiar auth y redirigir
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('token_expiry');
          window.location.href = '/login';
          
          return Promise.reject(refreshError);
        }
      }
      
      switch (status) {
        case 401:
          // Token inválido o expirado (sin auto-refresh posible)
          console.error('🔒 No autorizado - Token inválido');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          localStorage.removeItem('token_expiry');
          window.location.href = '/login';
          break;
          
        case 403:
          // Sin permisos
          console.error('🚫 Acceso denegado - Sin permisos');
          break;
          
        case 404:
          console.error('🔍 Recurso no encontrado');
          break;
          
        case 429:
          // Rate limit excedido
          console.error('⏱️ Demasiadas peticiones - Intente más tarde');
          break;
          
        case 500:
          console.error('⚠️ Error del servidor');
          break;
          
        default:
          console.error(`❌ Error ${status}:`, data?.message || 'Error desconocido');
      }
      
      return Promise.reject({
        message: data?.message || 'Error en la petición',
        status,
        code: data?.code,
        errors: data?.errors,
      } as ApiError);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.error('🌐 Sin respuesta del servidor');
      return Promise.reject({
        message: 'No se pudo conectar con el servidor',
        status: 0,
      } as ApiError);
    } else {
      // Error al configurar la petición
      console.error('⚙️ Error configurando petición:', error.message);
      return Promise.reject({
        message: error.message,
        status: 0,
      } as ApiError);
    }
  }
);

export default apiClient;
