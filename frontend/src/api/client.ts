/**
 * Axios Client Configuration
 * Cliente HTTP configurado con interceptores para manejo de auth y errores
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from '@/config/env';
import type { ApiError } from '@/types/api';

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
// Response Interceptor - Manejo de errores
// ============================================
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, retornar data
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Token inválido o expirado
          console.error('🔒 No autorizado - Token inválido');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
          
        case 403:
          // Sin permisos
          console.error('🚫 Acceso denegado - Sin permisos');
          break;
          
        case 404:
          console.error('🔍 Recurso no encontrado');
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
