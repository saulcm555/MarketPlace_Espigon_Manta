/**
 * LLM Service
 * Orquesta el flujo de conversación: Usuario → Gemini → MCP Tools → Respuesta
 */

import { GeminiAdapter, getGeminiAdapter } from '../adapters/GeminiAdapter';
import { LLMResponse, ProcessedDocument } from '../adapters/LLMAdapter';
import { MCPClient, getMCPClient } from './MCPClient';
import { Message, Conversation, createMessage, createConversation } from '../models/Message';
import { MCPTool, ToolCall, ToolResult } from '../models/Tool';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  documents?: ProcessedDocument[];
}

export interface ChatResponse {
  conversationId: string;
  message: string;
  toolsUsed?: Array<{
    name: string;
    success: boolean;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMService {
  private gemini: GeminiAdapter;
  private mcpClient: MCPClient;
  private conversations: Map<string, Conversation>;
  private tools: MCPTool[];
  private maxToolIterations: number;

  constructor() {
    this.gemini = getGeminiAdapter();
    this.mcpClient = getMCPClient();
    this.conversations = new Map();
    this.tools = [];
    this.maxToolIterations = 5; // Prevenir loops infinitos
  }

  /**
   * Inicializar servicio (cargar tools del MCP)
   */
  async initialize(): Promise<void> {
    try {
      console.log('[LLMService] Inicializando...');
      this.tools = await this.mcpClient.getTools();
      console.log(`[LLMService] Cargadas ${this.tools.length} herramientas:`,
        this.tools.map(t => t.name).join(', '));
    } catch (error: any) {
      console.warn('[LLMService] No se pudieron cargar tools:', error.message);
      this.tools = [];
    }
  }

  /**
   * Refrescar tools del MCP Service
   */
  async refreshTools(): Promise<MCPTool[]> {
    this.tools = await this.mcpClient.getTools();
    return this.tools;
  }

  /**
   * Procesar mensaje del usuario
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    // Obtener o crear conversación
    let conversation = request.conversationId 
      ? this.conversations.get(request.conversationId)
      : null;

    if (!conversation) {
      conversation = createConversation();
      this.conversations.set(conversation.id, conversation);
    }

    // Agregar mensaje del usuario
    const userMessage = createMessage('user', request.message);
    conversation.messages.push(userMessage);

    // Procesar con o sin documentos
    let response: LLMResponse;
    
    if (request.documents && request.documents.length > 0) {
      // Modo multimodal con documentos
      response = await this.gemini.generateMultimodalResponse({
        textPrompt: request.message,
        documents: request.documents,
        tools: this.tools
      });
    } else {
      // Modo texto normal
      response = await this.gemini.generateResponse({
        messages: conversation.messages,
        tools: this.tools
      });
    }

    // Manejar tool calls si existen
    const toolsUsed: Array<{ name: string; success: boolean }> = [];
    let iterations = 0;

    while (response.toolCalls && response.toolCalls.length > 0 && iterations < this.maxToolIterations) {
      iterations++;
      console.log(`[LLMService] Iteración ${iterations}: Ejecutando ${response.toolCalls.length} tools`);

      // Ejecutar cada tool
      const toolResults: Array<{ toolName: string; result: any }> = [];
      
      for (const toolCall of response.toolCalls) {
        const result = await this.mcpClient.executeTool(
          toolCall.toolName,
          toolCall.arguments
        );
        
        toolsUsed.push({
          name: toolCall.toolName,
          success: result.success
        });

        toolResults.push({
          toolName: toolCall.toolName,
          result: result.success 
            ? (result.formatted || result.data) 
            : { error: result.error }
        });
      }

      // Continuar conversación con resultados
      response = await this.gemini.continueWithToolResults(
        conversation.messages,
        toolResults,
        this.tools
      );
    }

    // Agregar respuesta del asistente
    const assistantMessage = createMessage('assistant', response.text);
    conversation.messages.push(assistantMessage);
    conversation.updatedAt = new Date();

    return {
      conversationId: conversation.id,
      message: response.text,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
      usage: response.usage
    };
  }

  /**
   * Obtener historial de conversación
   */
  getConversation(conversationId: string): Conversation | null {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Eliminar conversación
   */
  deleteConversation(conversationId: string): boolean {
    return this.conversations.delete(conversationId);
  }

  /**
   * Obtener lista de tools disponibles
   */
  getAvailableTools(): MCPTool[] {
    return this.tools;
  }

  /**
   * Limpiar conversaciones antiguas (más de 1 hora)
   */
  cleanupOldConversations(): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let cleaned = 0;

    for (const [id, conv] of this.conversations.entries()) {
      if (conv.updatedAt < oneHourAgo) {
        this.conversations.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[LLMService] Limpiadas ${cleaned} conversaciones antiguas`);
    }

    return cleaned;
  }
}

// Singleton
let llmServiceInstance: LLMService | null = null;

export function getLLMService(): LLMService {
  if (!llmServiceInstance) {
    llmServiceInstance = new LLMService();
  }
  return llmServiceInstance;
}
