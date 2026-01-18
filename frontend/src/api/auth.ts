/**
 * Authentication API
 * Maneja login, registro y verificación de usuarios
 * ACTUALIZADO: 100% Auth Service (Pilar 1) - Sin fallbacks
 */

import axios from 'axios';
import { config } from '@/config/env';
import type { 
  LoginRequest, 
  LoginResponse, 
  TokenResponse,
  User
} from '@/types/api';

// ============================================
// Auth Service Client (Puerto 4001)
// ============================================

const authClient = axios.create({
  baseURL: config.authServiceUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// Token Storage Keys
// ============================================
const ACCESS_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// ============================================
// Login Endpoints (Solo Auth Service)
// ============================================

/**
 * Login unificado - Todos los usuarios (client/seller/admin) usan el mismo endpoint
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

// Alias para compatibilidad
export const loginClient = login;
export const loginSeller = login;
export const loginAdmin = login;

// ============================================
// Register Endpoints (Auth Service + REST Service en 2 pasos)
// ============================================

/**
 * Registrar nuevo usuario
 * Paso 1: POST /auth/register en Auth Service (crea user con JWT)
 * Paso 2: Frontend debe crear perfil (client/seller/admin) en REST Service con user_id del token
 */
export const register = async (data: {
  email: string;
  password: string;
  role: 'client' | 'seller' | 'admin';
  name: string;
}): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/register', data);
  return response.data;
};

// Alias para compatibilidad (el frontend debe llamar a REST Service después con el user_id)
export const registerClient = register;
export const registerSeller = register;

// ============================================
// Token Refresh
// ============================================

/**
 * Refrescar tokens usando el refresh token
 */
export const refreshTokens = async (): Promise<TokenResponse | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await authClient.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken
    });
    
    // Guardar nuevos tokens
    saveTokens(response.data.access_token, response.data.refresh_token, response.data.expires_in);
    
    return response.data;
  } catch (error) {
    console.error('Error refreshing tokens:', error);
    // Si falla el refresh, limpiar todo
    logout();
    return null;
  }
};

// ============================================
// Token Verification
// ============================================

/**
 * Verificar si el token JWT es válido
 */
export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  const token = getAuthToken();
  
  if (!token) {
    return { valid: false };
  }
  
  try {
    // Primero verificamos con Auth Service
    const response = await authClient.post('/auth/validate', {
      token: token
    });
    
    return {
      valid: response.data.valid,
      user: response.data.payload ? {
        id: response.data.payload.sub,
        email: response.data.payload.email,
        role: response.data.payload.role,
        name: response.data.payload.email.split('@')[0], // Temporal
        reference_id: response.data.payload.reference_id
      } : undefined
    };
  } catch (error) {
    // Si falla Auth Service, intentar refresh
    const refreshed = await refreshTokens();
    if (refreshed) {
      return verifyToken(); // Reintentar con nuevo token
    }
    return { valid: false };
  }
};

/**
 * Obtener información del usuario actual desde Auth Service
 */
export const getMe = async (): Promise<User | null> => {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }
  
  try {
    const response = await authClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.user;
  } catch (error) {
    return null;
  }
};

// ============================================
// Helper Functions - Token Management
// ============================================

/**
 * Guardar tokens y usuario en localStorage
 */
export const saveAuthData = (accessToken: string, user: User, refreshToken?: string, expiresIn?: number): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  
  if (expiresIn) {
    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
  }
};

/**
 * Guardar solo tokens (para refresh)
 */
export const saveTokens = (accessToken: string, refreshToken: string, expiresIn: number): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

/**
 * Obtener usuario guardado en localStorage
 */
export const getSavedUser = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Obtener access token guardado en localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Obtener refresh token guardado en localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Verificar si el token está próximo a expirar (< 1 minuto)
 */
export const isTokenExpiringSoon = (): boolean => {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  
  const expiry = parseInt(expiryStr, 10);
  const oneMinute = 60 * 1000;
  
  return Date.now() > (expiry - oneMinute);
};

/**
 * Cerrar sesión - limpiar localStorage y revocar en Auth Service
 */
export const logout = async (): Promise<void> => {
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  
  // Intentar revocar token en Auth Service
  if (token && refreshToken) {
    try {
      await authClient.post('/auth/logout', {
        refresh_token: refreshToken
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      // Ignorar errores de logout
      console.warn('Error al revocar token:', error);
    }
  }
  
  // Limpiar localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
