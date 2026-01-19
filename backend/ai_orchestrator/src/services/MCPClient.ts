/**
 * MCP Client
 * Cliente HTTP para comunicarse con el MCP Service
 */

import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { MCPTool, ToolResult } from '../models/Tool';

export interface MCPToolExecuteRequest {
  arguments: Record<string, any>;
}

export interface MCPToolExecuteResponse {
  success: boolean;
  data?: any;
  formatted?: string;
  error?: string;
}

export class MCPClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || env.MCP_SERVICE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[MCPClient] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[MCPClient] Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[MCPClient] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Verificar la salud del MCP Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data?.status === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Obtener lista de herramientas disponibles
   */
  async getTools(): Promise<MCPTool[]> {
    try {
      const response = await this.client.get('/tools');
      return response.data?.tools || [];
    } catch (error: any) {
      console.error('[MCPClient] Error obteniendo tools:', error.message);
      throw new Error('No se pudieron obtener las herramientas del MCP Service');
    }
  }

  /**
   * Ejecutar una herramienta específica
   */
  async executeTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<ToolResult> {
    try {
      console.log(`[MCPClient] Ejecutando tool: ${toolName}`, args);

      const response = await this.client.post<MCPToolExecuteResponse>(
        `/tools/${toolName}/execute`,
        { arguments: args }
      );

      const result = response.data;

      if (!result.success) {
        return {
          toolName,
          success: false,
          error: result.error || 'Error desconocido ejecutando herramienta'
        };
      }

      return {
        toolName,
        success: true,
        data: result.data,
        formatted: result.formatted
      };
    } catch (error: any) {
      console.error(`[MCPClient] Error ejecutando ${toolName}:`, error.message);
      
      // Extraer mensaje de error de axios
      const errorMessage = error.response?.data?.error || error.message || 'Error de conexión';
      
      return {
        toolName,
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Ejecutar múltiples herramientas en secuencia
   */
  async executeTools(
    toolCalls: Array<{ toolName: string; arguments: Record<string, any> }>
  ): Promise<ToolResult[]> {
    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      const result = await this.executeTool(call.toolName, call.arguments);
      results.push(result);
    }

    return results;
  }
}

// Singleton
let mcpClientInstance: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
}
