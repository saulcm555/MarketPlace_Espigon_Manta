/**
 * Gemini Adapter
 * Implementación del LLMAdapter para Google Gemini
 */

import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { LLMAdapter, LLMResponse, GenerateParams, MultimodalParams, ProcessedDocument } from './LLMAdapter';
import { Message } from '../models/Message';
import { MCPTool, ToolCall } from '../models/Tool';
import { env } from '../config/env';

export class GeminiAdapter implements LLMAdapter {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY no está configurado');
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = modelName || env.GEMINI_MODEL;
  }

  /**
   * Convertir MCP Tools a formato Gemini Function Declarations
   */
  private convertToolsToGemini(tools: MCPTool[]): any[] {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: this.convertProperties(tool.parameters.properties),
        required: tool.parameters.required
      }
    }));
  }

  /**
   * Convertir propiedades al formato de Gemini
   */
  private convertProperties(props: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    for (const [key, value] of Object.entries(props)) {
      converted[key] = this.convertProperty(value);
    }
    return converted;
  }

  /**
   * Convertir una propiedad individual al formato de Gemini
   */
  private convertProperty(value: any): any {
    const result: any = {
      type: this.mapType(value.type),
      description: value.description || ''
    };

    // Manejar enums
    if (value.enum) {
      result.enum = value.enum;
    }

    // Manejar arrays con items
    if (value.type === 'array' && value.items) {
      result.items = this.convertProperty(value.items);
    }

    // Manejar objetos anidados con properties
    if (value.type === 'object' && value.properties) {
      result.properties = this.convertProperties(value.properties);
      if (value.required) {
        result.required = value.required;
      }
    }

    return result;
  }

  /**
   * Mapear tipos de string a SchemaType
   */
  private mapType(type: string): SchemaType {
    const typeMap: Record<string, SchemaType> = {
      'string': SchemaType.STRING,
      'number': SchemaType.NUMBER,
      'integer': SchemaType.INTEGER,
      'boolean': SchemaType.BOOLEAN,
      'array': SchemaType.ARRAY,
      'object': SchemaType.OBJECT
    };
    return typeMap[type] || SchemaType.STRING;
  }

  /**
   * Convertir mensajes al formato de Gemini
   */
  private convertMessagesToGemini(messages: Message[]) {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
  }

  /**
   * Extraer system prompt de los mensajes
   */
  private getSystemPrompt(messages: Message[]): string {
    const systemMsg = messages.find(msg => msg.role === 'system');
    return systemMsg?.content || this.getDefaultSystemPrompt();
  }

  /**
   * System prompt por defecto para el chatbot del marketplace
   */
  private getDefaultSystemPrompt(): string {
    return `Eres un asistente inteligente del Marketplace Espigón Manta.

Tu rol es ayudar a los usuarios con:
- Buscar productos en el catálogo
- Crear órdenes de compra
- Consultar estados de pago
- Procesar pagos
- Ver resúmenes de ventas (para vendedores)

HERRAMIENTAS DISPONIBLES:
- buscar_productos: Para buscar productos. Parámetros: category_name (nombre de categoría), sub_category_name (nombre de subcategoría), search (texto de búsqueda), min_price, max_price
- crear_orden: Para crear una nueva orden de compra
- procesar_pago: Para procesar el pago de una orden
- consultar_pago: Para consultar el estado de una transacción
- resumen_ventas: Para obtener reportes de ventas

INSTRUCCIONES IMPORTANTES:
1. SIEMPRE ejecuta las herramientas cuando el usuario pregunte algo que requiera datos del sistema. NO muestres código, ejecuta la herramienta directamente.
2. Cuando el usuario dice "general", "todas", "todos" o no especifica subcategoría, NO envíes sub_category_name. Solo filtra por categoría.
3. Cuando busques productos por categoría, usa category_name con el nombre (ej: "electrónico", "ropa"), NO necesitas IDs.
4. Responde siempre en español de forma amigable y profesional.
5. Presenta los resultados de forma clara y legible, no como código.
6. Si no encuentras resultados, sugiere alternativas.

Ejemplos de interpretación:
- "productos electrónicos" → buscar_productos(category_name: "electronico")
- "productos de ropa subcategoría camisetas" → buscar_productos(category_name: "ropa", sub_category_name: "camisetas")
- "buscar laptop" → buscar_productos(search: "laptop")`;
  }

  /**
   * Generar respuesta basada en mensajes
   */
  async generateResponse(params: GenerateParams): Promise<LLMResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: this.getSystemPrompt(params.messages),
      });

      const functionDeclarations = this.convertToolsToGemini(params.tools);
      const history = this.convertMessagesToGemini(params.messages.slice(0, -1));
      const lastMessage = params.messages[params.messages.length - 1];

      const chat = model.startChat({
        history,
        tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
        generationConfig: {
          temperature: params.temperature ?? 0.7,
          maxOutputTokens: params.maxTokens ?? 2048,
        }
      });

      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;

      // Extraer function calls si existen
      const toolCalls = this.extractFunctionCalls(response);

      return {
        text: response.text() || '',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error: any) {
      console.error('[GeminiAdapter] Error generando respuesta:', error);
      throw new Error(`Error en Gemini: ${error.message}`);
    }
  }

  /**
   * Generar respuesta multimodal (texto + documentos PDF)
   */
  async generateMultimodalResponse(params: MultimodalParams): Promise<LLMResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: this.getDefaultSystemPrompt(),
      });

      // Construir contenido con texto extraído de documentos
      let fullPrompt = params.textPrompt;
      
      if (params.documents.length > 0) {
        fullPrompt += '\n\n--- Documentos adjuntos ---\n';
        for (const doc of params.documents) {
          fullPrompt += `\n📄 **${doc.name}** (${doc.pageCount} páginas):\n`;
          fullPrompt += doc.extractedText.substring(0, 5000); // Limitar texto
          if (doc.extractedText.length > 5000) {
            fullPrompt += '\n... [texto truncado]';
          }
          fullPrompt += '\n';
        }
      }

      const result = await model.generateContent(fullPrompt);
      const response = result.response;

      return {
        text: response.text() || '',
        finishReason: 'stop',
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount || 0,
          completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: response.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error: any) {
      console.error('[GeminiAdapter] Error multimodal:', error);
      throw new Error(`Error en Gemini multimodal: ${error.message}`);
    }
  }

  /**
   * Continuar conversación después de ejecutar tools
   */
  async continueWithToolResults(
    messages: Message[],
    toolResults: Array<{ toolName: string; result: any }>,
    tools: MCPTool[]
  ): Promise<LLMResponse> {
    // Agregar resultados de tools como mensaje del asistente
    const toolResultsText = toolResults
      .map(tr => `[Resultado de ${tr.toolName}]: ${JSON.stringify(tr.result)}`)
      .join('\n');

    const updatedMessages: Message[] = [
      ...messages,
      {
        id: `tool-result-${Date.now()}`,
        role: 'assistant',
        content: toolResultsText,
        timestamp: new Date()
      }
    ];

    return this.generateResponse({
      messages: updatedMessages,
      tools,
      temperature: 0.7
    });
  }

  /**
   * Extraer function calls de la respuesta de Gemini
   */
  private extractFunctionCalls(response: any): ToolCall[] {
    try {
      const functionCalls = response.functionCalls?.() || [];
      if (!functionCalls || functionCalls.length === 0) {
        return [];
      }

      return functionCalls.map((fc: any) => ({
        toolName: fc.name,
        arguments: fc.args || {}
      }));
    } catch {
      return [];
    }
  }
}

// Singleton
let geminiAdapterInstance: GeminiAdapter | null = null;

export function getGeminiAdapter(): GeminiAdapter {
  if (!geminiAdapterInstance) {
    geminiAdapterInstance = new GeminiAdapter();
  }
  return geminiAdapterInstance;
}
