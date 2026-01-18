/**
 * Environment Configuration
 * AI Orchestrator - Pilar 3
 */

import dotenv from 'dotenv';
dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3004', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Gemini API
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',

  // MCP Service
  MCP_SERVICE_URL: process.env.MCP_SERVICE_URL || 'http://localhost:3003',

  // Microservicios
  REST_SERVICE_URL: process.env.REST_SERVICE_URL || 'http://localhost:3000',
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001',
  REPORT_SERVICE_URL: process.env.REPORT_SERVICE_URL || 'http://localhost:4000',

  // Flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validar configuración crítica
export function validateConfig(): void {
  if (!env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY no está configurado. El chatbot no funcionará.');
  }
}
