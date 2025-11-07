/**
 * Environment Configuration
 * Centraliza todas las variables de entorno
 */

export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8081',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Marketplace El Espigón',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Development
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

export default config;
