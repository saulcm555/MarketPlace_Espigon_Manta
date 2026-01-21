/**
 * MCP Tool: buscar_cliente
 * 
 * Busca un cliente por email o nombre.
 * Útil para obtener el ID del cliente antes de crear una orden.
 */

import { getClientClient, Client } from '../clients/ClientClient';

// ============================================
// TYPES
// ============================================

export interface BuscarClienteParams {
  email?: string;
  nombre?: string;
}

export interface BuscarClienteResult {
  success: boolean;
  client?: {
    id: number;
    name: string;
    email: string;
    address?: string;
  };
  clients?: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  error?: string;
}

// ============================================
// TOOL DEFINITION
// ============================================

export const buscarClienteTool = {
  name: 'buscar_cliente',
  description: 'Busca un cliente por su email o nombre. Usa esta herramienta para obtener el ID del cliente antes de crear una orden. Si el usuario dice su email o nombre, usa esta herramienta.',
  parameters: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Email del cliente para buscar (búsqueda exacta)'
      },
      nombre: {
        type: 'string',
        description: 'Nombre del cliente para buscar (búsqueda parcial)'
      }
    },
    required: [] // Al menos uno debería proporcionarse
  },

  /**
   * Ejecutar búsqueda de cliente
   */
  async execute(params: BuscarClienteParams): Promise<BuscarClienteResult> {
    try {
      const client = getClientClient();

      // Buscar por email (prioridad)
      if (params.email) {
        const found = await client.findByEmail(params.email);
        
        if (found) {
          return {
            success: true,
            client: {
              id: found.id_client,
              name: found.client_name,
              email: found.client_email,
              address: found.address
            }
          };
        }
        
        return {
          success: false,
          error: `No se encontró cliente con email: ${params.email}`
        };
      }

      // Buscar por nombre
      if (params.nombre) {
        const found = await client.findByName(params.nombre);
        
        if (found.length === 0) {
          return {
            success: false,
            error: `No se encontraron clientes con nombre: ${params.nombre}`
          };
        }

        if (found.length === 1) {
          return {
            success: true,
            client: {
              id: found[0].id_client,
              name: found[0].client_name,
              email: found[0].client_email,
              address: found[0].address
            }
          };
        }

        // Múltiples coincidencias
        return {
          success: true,
          clients: found.map(c => ({
            id: c.id_client,
            name: c.client_name,
            email: c.client_email
          }))
        };
      }

      return {
        success: false,
        error: 'Debes proporcionar email o nombre para buscar'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Formatear respuesta para el usuario
   */
  formatResponse(result: BuscarClienteResult): string {
    if (!result.success) {
      return `❌ ${result.error}`;
    }

    if (result.client) {
      return `✅ **Cliente encontrado:**\n` +
             `👤 Nombre: ${result.client.name}\n` +
             `📧 Email: ${result.client.email}\n` +
             `🆔 ID: ${result.client.id}\n` +
             `📍 Dirección: ${result.client.address || 'No especificada'}`;
    }

    if (result.clients && result.clients.length > 0) {
      let response = `📋 **Se encontraron ${result.clients.length} clientes:**\n\n`;
      result.clients.forEach((c, i) => {
        response += `${i + 1}. ${c.name} (${c.email}) - ID: ${c.id}\n`;
      });
      response += `\n¿Cuál de estos es tu cuenta?`;
      return response;
    }

    return '❌ No se encontraron clientes';
  }
};

/**
 * Función helper para ejecutar directamente
 */
export async function buscarCliente(params: BuscarClienteParams): Promise<BuscarClienteResult> {
  return buscarClienteTool.execute(params);
}
