/**
 * Extended Express Request types
 * Extiende la interfaz Request de Express para incluir propiedades personalizadas
 */

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: 'client' | 'seller' | 'admin';
        id_client?: number;
        id_seller?: number;
        id_admin?: number;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
