import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: parseInt(process.env.DB_PORT || '6543'),
  DB_USERNAME: process.env.DB_USERNAME!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_DATABASE: process.env.DB_DATABASE!,
  DB_SCHEMA: process.env.DB_SCHEMA || 'public',
  
  // Payment Provider
  PAYMENT_PROVIDER: (process.env.PAYMENT_PROVIDER || 'mock') as 'mock' | 'stripe' | 'mercadopago',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Webhooks
  WEBHOOK_TIMEOUT: parseInt(process.env.WEBHOOK_TIMEOUT || '10000'),
  WEBHOOK_RETRY_ATTEMPTS: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3'),
  
  // Internal API Key (service-to-service authentication)
  INTERNAL_API_KEY: process.env.INTERNAL_API_KEY,
};
