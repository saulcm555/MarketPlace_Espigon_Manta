/**
 * LLM Adapter Interface
 * Patrón Strategy para soportar múltiples proveedores de LLM
 */

import { Message } from '../models/Message';
import { MCPTool, ToolCall } from '../models/Tool';

export interface LLMResponse {
  text: string;
  toolCalls?: ToolCall[];
  finishReason: 'stop' | 'length' | 'tool_calls';
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ProcessedDocument {
  name: string;
  extractedText: string;
  pageCount: number;
  metadata?: any;
}

export interface GenerateParams {
  messages: Message[];
  tools: MCPTool[];
  temperature?: number;
  maxTokens?: number;
}

export interface MultimodalParams {
  textPrompt: string;
  documents: ProcessedDocument[];
  tools: MCPTool[];
}

/**
 * Interface base para adaptadores de LLM
 */
export interface LLMAdapter {
  /**
   * Generar respuesta basada en mensajes
   */
  generateResponse(params: GenerateParams): Promise<LLMResponse>;

  /**
   * Generar respuesta multimodal (texto + documentos)
   */
  generateMultimodalResponse(params: MultimodalParams): Promise<LLMResponse>;

  /**
   * Continuar conversación después de ejecutar tools
   */
  continueWithToolResults(
    messages: Message[],
    toolResults: Array<{ toolName: string; result: any }>,
    tools: MCPTool[]
  ): Promise<LLMResponse>;
}
