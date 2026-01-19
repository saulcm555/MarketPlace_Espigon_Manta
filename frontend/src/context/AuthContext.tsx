/**
 * Authentication Context
 * Maneja el estado global de autenticación del usuario
 * ACTUALIZADO: Soporte para access + refresh tokens (Pilar 1)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  saveAuthData,
  getSavedUser,
  getAuthToken,
  getRefreshToken,
  verifyToken,
  refreshTokens,
  isTokenExpiringSoon
} from '@/api/auth';
import { clearLoginAttempts } from '@/utils/securityConfig';
import type { User, UserRole, LoginRequest, LoginResponse } from '@/types/api';

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshAuth: () => Promise<boolean>;
}

// ============================================
// Context Creation
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // Refresh Auth - Refrescar tokens si es necesario
  // ============================================
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    const currentRefreshToken = getRefreshToken();
    
    if (!currentRefreshToken) {
      return false;
    }
    
    try {
      const tokenResponse = await refreshTokens();
      
      if (tokenResponse) {
        setToken(tokenResponse.access_token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return false;
    }
  }, []);

  // ============================================
  // Initialize auth state from localStorage
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = getAuthToken();
        const savedUser = getSavedUser();

        if (savedToken && savedUser) {
          // Verificar si el token está próximo a expirar
          if (isTokenExpiringSoon()) {
            console.log('🔄 Token próximo a expirar, refrescando...');
            const refreshed = await refreshAuth();
            
            if (refreshed) {
              setToken(getAuthToken());
              setUser(savedUser);
            } else {
              // No se pudo refrescar, verificar token actual
              const { valid } = await verifyToken();
              
              if (valid) {
                setToken(savedToken);
                setUser(savedUser);
              } else {
                await apiLogout();
              }
            }
          } else {
            // Token aún válido
            const { valid, user: verifiedUser } = await verifyToken();
            
            if (valid) {
              setToken(savedToken);
              setUser(verifiedUser || savedUser);
            } else {
              await apiLogout();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        await apiLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshAuth]);

  // ============================================
  // Auto-refresh timer (cada 13 minutos)
  // ============================================
  useEffect(() => {
    if (!token) return;
    
    // Refrescar 2 minutos antes de que expire (tokens de 15 min)
    const refreshInterval = setInterval(async () => {
      if (isTokenExpiringSoon()) {
        console.log('🔄 Auto-refresh de token...');
        await refreshAuth();
      }
    }, 13 * 60 * 1000); // 13 minutos
    
    return () => clearInterval(refreshInterval);
  }, [token, refreshAuth]);

  // ============================================
  // Login Function
  // ============================================
  const login = async (credentials: LoginRequest, role: UserRole = 'client') => {
    try {
      const response: LoginResponse = await apiLogin(credentials, role);
      
      // Determinar el token a usar (nuevo formato vs legacy)
      const accessToken = response.access_token || (response as any).token;
      const refreshToken = response.refresh_token;
      const expiresIn = response.expires_in;
      
      // Guardar user básico primero
      let enrichedUser = response.user;
      
      // Save to state
      setToken(accessToken);
      setUser(enrichedUser);
      
      // Save to localStorage
      saveAuthData(accessToken, enrichedUser, refreshToken, expiresIn);
      
      // Limpiar intentos fallidos de login para este email
      clearLoginAttempts(credentials.email);
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // ============================================
  // Logout Function
  // ============================================
  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  // ============================================
  // Update User Function
  // ============================================
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // ============================================
  // Context Value
  // ============================================
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================
// Custom Hook
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
