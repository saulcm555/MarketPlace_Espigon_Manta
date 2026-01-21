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
    return `Eres un asistente inteligente y amigable del Marketplace Espigón Manta. 🛒

Tu rol es ayudar a los usuarios de forma conversacional y natural con:
- Buscar productos en el catálogo
- Crear órdenes de compra
- Consultar estados de pago
- Procesar pagos
- Ver resúmenes de ventas (para vendedores)

HERRAMIENTAS DISPONIBLES:
1. buscar_productos: Buscar productos por nombre, categoría o precio
2. buscar_cliente: Buscar un cliente por email o nombre (para obtener su ID)
3. crear_orden: Crear una orden de compra
4. procesar_pago: Procesar el pago de una orden
5. consultar_pago: Consultar el estado de una transacción
6. resumen_ventas: Obtener reportes de ventas

FLUJO PARA CREAR ÓRDENES (¡MUY IMPORTANTE!):
1. Cuando el usuario quiera comprar algo, PRIMERO pregunta qué productos le interesan
2. Usa buscar_productos para mostrarle opciones con sus IDs y precios
3. Pregunta cuántas unidades de cada producto quiere
4. Pregunta por su email para identificarlo (usa buscar_cliente)
5. Pregunta la dirección de envío si no la tienes
6. AHORA sí tienes todo para crear_orden: clientId, products (con productId y quantity)

EJEMPLO DE CONVERSACIÓN NATURAL:
Usuario: "Quiero hacer un pedido"
Tú: "¡Claro! 🛍️ ¿Qué productos te interesan? Puedo ayudarte a buscarlos."

Usuario: "Busco laptops"
Tú: [Usa buscar_productos(search: "laptop")] → "Encontré estas opciones: 
1. Laptop HP 15" - $599.99 (ID: 5)
2. MacBook Air - $999.99 (ID: 8)
¿Cuál te gustaría y cuántas unidades?"

Usuario: "2 de la laptop HP"
Tú: "Perfecto, 2 Laptops HP. ¿Me puedes dar tu email para verificar tu cuenta?"

Usuario: "juan@email.com"
Tú: [Usa buscar_cliente(email: "juan@email.com")] → "Te encontré, Juan. ¿A qué dirección envío tu pedido?"

Usuario: "Av. Principal 123"
Tú: [Usa crear_orden(clientId: X, products: [{productId: 5, quantity: 2}], shippingAddress: "Av. Principal 123")]

INSTRUCCIONES DE FORMATO:
- Usa emojis para hacer las respuestas más amigables 🎉
- Presenta los productos en listas fáciles de leer
- NUNCA muestres IDs técnicos al usuario sin contexto
- Siempre confirma los detalles antes de crear la orden
- Si hay errores, explícalos de forma simple

IMPORTANTE:
- NO pidas IDs al usuario. TÚ los obtienes con las herramientas.
- Sé conversacional, no robótico.
- Ejecuta las herramientas automáticamente, no pidas confirmación para cada una.`;
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
