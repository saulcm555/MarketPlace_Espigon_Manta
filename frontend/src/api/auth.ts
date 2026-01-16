/**
 * Authentication API
 * Maneja login, registro y verificación de usuarios
 * ACTUALIZADO: Ahora usa Auth Service (Pilar 1) en puerto 4001
 */

import axios from 'axios';
import apiClient from './client';
import { config } from '@/config/env';
import type { 
  LoginRequest, 
  LoginResponse, 
  TokenResponse,
  RegisterClientRequest,
  RegisterSellerRequest,
  User,
  UserRole 
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
// Login Endpoints (Auth Service Directo)
// ============================================

/**
 * Login unificado via Auth Service
 * El Auth Service maneja todos los tipos de usuarios
 */
export const loginViaAuthService = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
};

/**
 * Login para clientes (via REST Service para compatibilidad)
 * Este endpoint crea el usuario en Auth Service si no existe
 */
export const loginClient = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // Primero intentamos login directo en Auth Service
  try {
    return await loginViaAuthService(credentials);
  } catch (error: any) {
    // Si el usuario no existe en Auth Service, usar REST Service
    if (error.response?.status === 401) {
      const response = await apiClient.post<LoginResponse>('/auth/login/client', credentials);
      return response.data;
    }
    throw error;
  }
};

/**
 * Login para vendedores
 */
export const loginSeller = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    return await loginViaAuthService(credentials);
  } catch (error: any) {
    if (error.response?.status === 401) {
      const response = await apiClient.post<LoginResponse>('/auth/login/seller', credentials);
      return response.data;
    }
    throw error;
  }
};

/**
 * Login para administradores
 */
export const loginAdmin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    return await loginViaAuthService(credentials);
  } catch (error: any) {
    if (error.response?.status === 401) {
      const response = await apiClient.post<LoginResponse>('/auth/login/admin', credentials);
      return response.data;
    }
    throw error;
  }
};

/**
 * Login genérico - detecta el tipo de usuario automáticamente
 */
export const login = async (credentials: LoginRequest, role: UserRole = 'client'): Promise<LoginResponse> => {
  switch (role) {
    case 'client':
      return loginClient(credentials);
    case 'seller':
      return loginSeller(credentials);
    case 'admin':
      return loginAdmin(credentials);
    default:
      return loginClient(credentials);
  }
};

// ============================================
// Register Endpoints
// ============================================

/**
 * Registrar nuevo cliente
 * 1. Crea el cliente en REST Service
 * 2. Registra en Auth Service para JWT
 */
export const registerClient = async (data: RegisterClientRequest): Promise<LoginResponse> => {
  // Registrar en REST Service (crea el cliente en la BD principal)
  const response = await apiClient.post<any>('/auth/register/client', data);
  
  // Si el REST Service retorna el formato nuevo del Auth Service, usarlo
  if (response.data.access_token) {
    return response.data as LoginResponse;
  }
  
  // Si es formato legacy, intentar login en Auth Service
  try {
    const authResponse = await loginViaAuthService({
      email: data.email,
      password: data.password
    });
    return authResponse;
  } catch {
    // Fallback: retornar respuesta del REST Service
    return response.data;
  }
};

/**
 * Registrar nuevo vendedor
 */
export const registerSeller = async (data: RegisterSellerRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<any>('/auth/register/seller', data);
  
  if (response.data.access_token) {
    return response.data as LoginResponse;
  }
  
  try {
    const authResponse = await loginViaAuthService({
      email: data.seller_email,
      password: data.seller_password
    });
    return authResponse;
  } catch {
    return response.data;
  }
};

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
