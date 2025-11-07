/**
 * Authentication API
 * Maneja login, registro y verificación de usuarios
 */

import apiClient from './client';
import type { 
  LoginRequest, 
  LoginResponse, 
  RegisterClientRequest,
  RegisterSellerRequest,
  User,
  UserRole 
} from '@/types/api';

// ============================================
// Login Endpoints
// ============================================

/**
 * Login para clientes
 */
export const loginClient = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login/client', credentials);
  return response.data;
};

/**
 * Login para vendedores
 */
export const loginSeller = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login/seller', credentials);
  return response.data;
};

/**
 * Login para administradores
 */
export const loginAdmin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login/admin', credentials);
  return response.data;
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
 */
export const registerClient = async (data: RegisterClientRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/register/client', data);
  return response.data;
};

/**
 * Registrar nuevo vendedor
 */
export const registerSeller = async (data: RegisterSellerRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/register/seller', data);
  return response.data;
};

// ============================================
// Token Verification
// ============================================

/**
 * Verificar si el token JWT es válido
 */
export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  try {
    const response = await apiClient.get('/auth/verify');
    return {
      valid: true,
      user: response.data.user,
    };
  } catch (error) {
    return { valid: false };
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Guardar token y usuario en localStorage
 */
export const saveAuthData = (token: string, user: User): void => {
  localStorage.setItem('auth_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Obtener usuario guardado en localStorage
 */
export const getSavedUser = (): User | null => {
  const userStr = localStorage.getItem('user');
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
 * Obtener token guardado en localStorage
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Cerrar sesión - limpiar localStorage
 */
export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
};

/**
 * Verificar si el usuario está autenticado
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
