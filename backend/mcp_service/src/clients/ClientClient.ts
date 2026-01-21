/**
 * Client API Client
 * 
 * Cliente HTTP para operaciones de clientes en el Rest Service.
 * Endpoint base: /api/clients
 */

import axios, { AxiosInstance } from 'axios';

// ============================================
// TYPES
// ============================================

export interface Client {
  id_client: number;
  user_id?: string;
  client_name: string;
  client_email: string;
  address?: string;
  created_at: string;
}

export interface ClientSearchParams {
  email?: string;
  name?: string;
}

// ============================================
// CLIENT CLASS
// ============================================

export class ClientClient {
  private http: AxiosInstance;

  constructor(baseUrl?: string) {
    const baseURL = baseUrl || process.env.REST_SERVICE_URL || 'http://localhost:3000';
    
    this.http = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Token': 'internal-service-graphql-reports-2024',
        'X-Internal-Service': 'mcp-service'
      }
    });
  }

  /**
   * Obtener todos los clientes
   */
  async getClients(): Promise<Client[]> {
    const response = await this.http.get<Client[]>('/api/clients');
    return response.data;
  }

  /**
   * Buscar cliente por email
   */
  async findByEmail(email: string): Promise<Client | null> {
    try {
      const clients = await this.getClients();
      const client = clients.find(c => 
        c.client_email.toLowerCase() === email.toLowerCase()
      );
      return client || null;
    } catch (error) {
      console.error('[ClientClient] Error buscando por email:', error);
      return null;
    }
  }

  /**
   * Buscar cliente por nombre (parcial)
   */
  async findByName(name: string): Promise<Client[]> {
    try {
      const clients = await this.getClients();
      const searchTerm = name.toLowerCase();
      return clients.filter(c => 
        c.client_name.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('[ClientClient] Error buscando por nombre:', error);
      return [];
    }
  }

  /**
   * Obtener cliente por ID
   */
  async getById(id: number): Promise<Client | null> {
    try {
      const response = await this.http.get<Client>(`/api/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error('[ClientClient] Error obteniendo cliente:', error);
      return null;
    }
  }
}

// ============================================
// SINGLETON
// ============================================

let clientClientInstance: ClientClient | null = null;

export function getClientClient(): ClientClient {
  if (!clientClientInstance) {
    clientClientInstance = new ClientClient();
  }
  return clientClientInstance;
}
