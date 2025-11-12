/**
 * Authentication Context
 * Maneja el estado global de autenticación del usuario
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  saveAuthData,
  getSavedUser,
  getAuthToken,
  verifyToken 
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
  logout: () => void;
  updateUser: (user: User) => void;
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
  // Initialize auth state from localStorage
  // ============================================
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = getAuthToken();
        const savedUser = getSavedUser();

        if (savedToken && savedUser) {
          // Verify token is still valid
          const { valid } = await verifyToken();
          
          if (valid) {
            setToken(savedToken);
            setUser(savedUser);
          } else {
            // Token expired, clear auth
            apiLogout();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        apiLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // ============================================
  // Login Function
  // ============================================
  const login = async (credentials: LoginRequest, role: UserRole = 'client') => {
    try {
      const response: LoginResponse = await apiLogin(credentials, role);
      
      // Save to state
      setToken(response.token);
      setUser(response.user);
      
      // Save to localStorage
      saveAuthData(response.token, response.user);
      
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
  const logout = () => {
    setToken(null);
    setUser(null);
    apiLogout();
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
