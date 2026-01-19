# PILAR 3: MCP - CHATBOT MULTIMODAL
## Estado de Implementación y Roadmap Detallado

---

## ⚠️ ACLARACIONES ARQUITECTÓNICAS CRÍTICAS

### 1️⃣ NO MEZCLAR AI ORCHESTRATOR CON MCP SERVICE

**AI Orchestrator (Puerto 3004):**
- **ROL:** 🧠 Cerebro - Toma decisiones de IA
- **Responsabilidades:**
  - Recibe mensajes del usuario (texto, PDF)
  - Procesa con LLM (Gemini) para entender intención
  - Decide QUÉ tools ejecutar y con QUÉ parámetros
  - Construye respuesta final coherente para el usuario
  - Maneja contexto/historial de conversaciones
- **NO hace:** Llamadas directas a Payment/Rest/Report Service

**MCP Service (Puerto 3003):**
- **ROL:** ⚙️ Ejecutor - NO piensa, solo ejecuta
- **Responsabilidades:**
  - Expone MCP Tools como endpoints HTTP
  - Ejecuta llamadas a microservicios (Payment, Rest, Report)
  - Valida parámetros de entrada
  - Formatea respuestas para el LLM
  - Maneja errores de microservicios
- **NO hace:** Decidir qué tool ejecutar ni generar respuestas de IA

**Flujo Correcto:**
```
Usuario → AI Orchestrator → LLM (Gemini) → Decide tool → 
MCP Service → Ejecuta tool → Microservicio → Respuesta → 
MCP Service → Formatea → LLM → Respuesta final → Usuario
```

### 2️⃣ ENDPOINTS VERIFICADOS ✅

Todos los endpoints necesarios para las 5 MCP Tools existen:
- ✅ `buscar_productos` → `GET /api/products` (Rest Service)
- ✅ `crear_orden` → `POST /api/orders` (Rest Service)
- ✅ `resumen_ventas` → GraphQL `top_sellers_report` (Report Service)
- ✅ `procesar_pago` → `POST /api/payments/process` (Payment Service)
- ✅ `consultar_pago` → `GET /api/payments/transaction/:id` (Payment Service)

**NO necesitas crear endpoints nuevos en otros servicios.**

### 3️⃣ MULTIMODAL MÍNIMO: TEXTO + PDF ÚNICAMENTE

Para cumplir el requisito de "mínimo 2 tipos de entrada":
- ✅ **Texto:** Mensajes normales del usuario
- ✅ **PDF:** Facturas, catálogos, reportes (con pdf-parse)
- 🚫 **NO OCR:** Tesseract es complejo y menos confiable
- 🚫 **NO Imágenes:** Requiere Gemini Vision + vector DB (fase posterior)

---

## 📋 RESUMEN EJECUTIVO

### ¿Qué es el Pilar 3?
El Pilar 3 es el **Chatbot Inteligente Multimodal** que permite a usuarios interactuar con el marketplace usando lenguaje natural y documentos PDF. Utiliza:
- **Model Context Protocol (MCP)**: Protocolo estándar para exponer funciones del backend como "tools" ejecutables por LLMs
- **LLM (Gemini)**: Motor de procesamiento de lenguaje natural para entender intenciones y generar respuestas
- **Procesamiento Multimodal**: Capacidad de procesar texto + PDFs (imágenes en fase posterior)

### Estado Actual: 30% Completado
✅ **Completado:**
- Payment Service preparado con contratos y autenticación
- Estructura base del `mcp_service/` con 2 tools funcionales
- PaymentClient HTTP con autenticación automática
- Event constants y DTOs compartidos

❌ **Pendiente:**
- AI Orchestrator (núcleo del sistema)
- LLM Adapter con Gemini
- 3 MCP Tools adicionales
- Procesamiento PDF (único multimodal inicial)
- Chat UI o integración con Telegram

---

## 🏗️ ARQUITECTURA DEL PILAR 3

### 🔑 SEPARACIÓN DE RESPONSABILIDADES (CRÍTICO)

**AI ORCHESTRATOR (Puerto 3004)**
- Recibe mensajes del usuario (texto, PDF)
- Llama al LLM (Gemini) para entender intención
- Decide qué MCP Tools ejecutar
- Construye respuesta final coherente
- **NO ejecuta lógica de negocio directamente**

**MCP SERVICE (Puerto 3003)**
- Expone MCP Tools como funciones ejecutables
- Ejecuta llamadas HTTP a microservicios (Payment, Rest, Report)
- Formatea respuestas de tools para el LLM
- **NO toma decisiones de IA, solo ejecuta**

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  ┌──────────────┐              ┌──────────────┐            │
│  │  Chat UI     │              │  Telegram    │            │
│  │  (React)     │              │  (n8n)       │            │
│  └──────┬───────┘              └──────┬───────┘            │
│         │                              │                    │
│         └──────────────┬───────────────┘                    │
└────────────────────────┼────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────┼────────────────────────────────────┐
│             AI ORCHESTRATOR (Puerto 3004)                   │
│             🧠 CEREBRO - TOMA DECISIONES                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ChatController                                     │    │
│  │  - POST /api/chat/message                          │    │
│  │  - POST /api/chat/multimodal (text + PDFs)         │    │
│  │  - GET  /api/chat/history/:userId                  │    │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  LLMService (Strategy Pattern)                      │   │
│  │  ┌─────────────┐                                    │   │
│  │  │GeminiAdapter│ (única implementación inicial)       │   │
│  │  └─────────────┘                                    │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  MCPClient (Cliente HTTP)                           │   │
│  │  - Llama a MCP Service para ejecutar tools          │   │
│  │  - Recibe resultados de tools                       │   │
│  │  - Pasa resultados al LLM para continuar            │   │
│  └──────────────┬──────────────────────────────────────┘   │
│                 │                                           │
│  ┌──────────────▼──────────────────────────────────────┐   │
│  │  PDFProcessor (Procesamiento Multimodal)            │   │
│  │  - Extrae texto de PDFs con pdf-parse               │   │
│  │  - Agrega texto extraído al contexto del LLM        │   │
│  │  - **SOLO PDF, no OCR ni imágenes (inicio)**       │   │
│  └──────────────┬──────────────────────────────────────┘   │
└─────────────────┼───────────────────────────────────────────┘
                  │ HTTP Calls (POST /tools/execute)
┌─────────────────┼───────────────────────────────────────────┐
│      MCP SERVICE (Puerto 3003) - ⚙️ EJECUTOR                │
│  ┌─────────────┴──────────────────────────────────────┐    │
│  │  MCP Tools (Funciones ejecutables por LLM)         │    │
│  │  ✅ procesar_pago (Payment Service)                │    │
│  │  ✅ consultar_pago (Payment Service)               │    │
│  │  ❌ buscar_productos (Rest Service - VERIFICADO)   │    │
│  │  ❌ crear_orden (Rest Service - VERIFICADO)        │    │
│  │  ❌ resumen_ventas (Report Service - VERIFICADO)   │    │
│  └─────────────┬──────────────────────────────────────┘    │
│                │                                            │
│  ┌─────────────▼──────────────────────────────────────┐    │
│  │  HTTP Clients (Autenticación automática)           │    │
│  │  ✅ PaymentClient → Payment Service                │    │
│  │  ❌ ProductClient → Rest Service                   │    │
│  │  ❌ OrderClient → Rest Service                     │    │
│  │  ❌ ReportClient → Report Service                  │    │
│  └─────────────┬──────────────────────────────────────┘    │
└─────────────────┼───────────────────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────────────────┐
│              MICROSERVICIOS EXISTENTES                      │
│  ✅ Payment Service (3001)  ✅ Rest Service (3002)         │
│  ✅ Report Service (3005)   ✅ Realtime Service (3006)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚧 COMPONENTES PENDIENTES (Detalle Técnico)

### 1️⃣ AI ORCHESTRATOR SERVICE (CRÍTICO - Núcleo del Pilar 3)

#### Descripción
Servicio central que coordina todo el procesamiento de IA. Recibe mensajes del usuario, los procesa con LLMs, ejecuta MCP Tools necesarios, y devuelve respuestas coherentes.

#### Estructura de Archivos
```
backend/ai_orchestrator/
├── package.json
├── tsconfig.json
├── .env.example
├── Dockerfile
├── README.md
└── src/
    ├── main.ts                          # Entry point, Express server
    ├── config/
    │   └── env.ts                       # Variables de entorno
    ├── controllers/
    │   └── ChatController.ts            # Endpoints HTTP
    ├── services/
    │   ├── LLMService.ts               # Lógica de procesamiento LLM
    │   ├── MCPService.ts               # Ejecutor de MCP Tools
    │   └── ConversationService.ts      # Manejo de contexto/historial
    ├── adapters/
    │   ├── LLMAdapter.ts               # Interface Strategy Pattern
    │   └── GeminiAdapter.ts            # Implementación Gemini (única inicial)
    ├── processors/
    │   └── PDFProcessor.ts             # Procesamiento de PDFs (único multimodal)
    ├── models/
    │   ├── Conversation.ts             # Modelo de conversación
    │   └── Message.ts                  # Modelo de mensaje
    └── utils/
        ├── promptBuilder.ts            # Constructor de prompts
        └── responseFormatter.ts        # Formateador de respuestas
```

#### Endpoints a Implementar
```typescript
// POST /api/chat/message - Mensaje (texto + opcional PDF)
// FORMATO: FormData (no JSON)
// Campos:
//   - userId: string
//   - message: string
//   - conversationId?: string (null = nueva conversación)
//   - files?: File[] (PDFs opcionales)

Example Request (FormData):
  userId: "uuid"
  message: "Busca productos de electrónica bajo $100"
  conversationId: "uuid-123" (opcional)
  files: [File] (opcional, solo PDFs)

→ Response: {
  "conversationId": "uuid",
  "response": "Encontré 5 productos...",
  "toolsUsed": ["buscar_productos"],
  "confidence": 0.95,
  "extractedText": "..." // solo si hay PDFs
}

// GET /api/chat/history/:userId - Historial de conversaciones
→ Response: {
  "conversations": [
    {"id": "uuid", "createdAt": "timestamp", "messages": [...]}
  ]
}
```

#### Dependencias Clave
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",      // SDK Gemini
    "axios": "^1.7.0",                       // HTTP calls a MCP Service
    "express": "^4.18.0",                    // Server HTTP
    "pdf-parse": "^1.1.1",                   // Parseo de PDFs (único multimodal)
    "multer": "^1.4.5",                      // Upload de archivos
    "ioredis": "^5.3.0"                     // Cache de conversaciones (opcional)
  }
}

// ❌ NO instalar: openai, tesseract.js, sharp (no necesarios en MVP)
```

#### Decisiones Arquitectónicas a Tomar
1. **¿Persistir conversaciones en PostgreSQL o Redis?**
   - PostgreSQL: Búsquedas complejas, analytics
   - Redis: Ultra-rápido, temporal, buen cache
   - **Recomendación**: PostgreSQL + Redis como cache

2. **¿Streaming de respuestas (tipo ChatGPT) o respuesta completa?**
   - Streaming: Mejor UX, más complejo (WebSocket/SSE)
   - Completa: Más simple, espera total
   - **Recomendación**: Empezar con respuesta completa, agregar streaming después

3. **¿Límite de tokens por conversación?**
   - Gemini Pro: 32k tokens contexto
   - **Recomendación**: Mantener últimos 10 mensajes + system prompt

4. **¿Retry logic en caso de fallo del LLM?**
   - **Recomendación**: 3 reintentos con exponential backoff

---

### 2️⃣ LLM ADAPTER (CRÍTICO - Cerebro del Sistema)

#### Descripción
Implementación del patrón Strategy para soportar múltiples proveedores de LLM (Gemini, OpenAI, Claude). Permite cambiar de proveedor sin afectar el resto del código.

#### Interface Base
```typescript
// src/adapters/LLMAdapter.ts
export interface LLMAdapter {
  generateResponse(params: {
    messages: Message[];
    tools: MCPTool[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<LLMResponse>;

  generateMultimodalResponse(params: {
    textPrompt: string;
    images: Buffer[];
    documents: ProcessedDocument[];
    tools: MCPTool[];
  }): Promise<LLMResponse>;

  streamResponse(params: {
    messages: Message[];
    tools: MCPTool[];
  }): AsyncGenerator<string, void, unknown>;
}

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

export interface ToolCall {
  toolName: string;
  arguments: Record<string, any>;
}
```

#### Implementación Gemini (Principal)
```typescript
// src/adapters/GeminiAdapter.ts
import { GoogleGenerativeAI, FunctionDeclarationSchemaType } from '@google/generative-ai';

export class GeminiAdapter implements LLMAdapter {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
  }

  async generateResponse(params: {
    messages: Message[];
    tools: MCPTool[];
    temperature?: number;
  }): Promise<LLMResponse> {
    // Convertir MCP Tools a formato Gemini Function Calling
    const functionDeclarations = params.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: FunctionDeclarationSchemaType.OBJECT,
        properties: tool.parameters.properties,
        required: tool.parameters.required
      }
    }));

    // Construir prompt con historial de mensajes
    const chat = this.model.startChat({
      history: this.convertMessagesToGemini(params.messages),
      tools: [{ functionDeclarations }],
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: 2048
      }
    });

    const result = await chat.sendMessage(params.messages[params.messages.length - 1].content);
    const response = result.response;

    // Detectar si hay function calls
    const toolCalls = this.extractFunctionCalls(response);
    
    return {
      text: response.text() || '',
      toolCalls,
      finishReason: toolCalls.length > 0 ? 'tool_calls' : 'stop',
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  async generateMultimodalResponse(params: {
    textPrompt: string;
    images: Buffer[];
    documents: ProcessedDocument[];
  }): Promise<LLMResponse> {
    // Usar gemini-2.0-flash para multimodal
    const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Construir contenido multimodal
    const parts = [
      { text: params.textPrompt }
    ];

    // Agregar imágenes
    for (const imageBuffer of params.images) {
      parts.push({
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      });
    }

    // Agregar texto extraído de documentos
    for (const doc of params.documents) {
      parts.push({ text: `[Documento ${doc.name}]:\n${doc.extractedText}` });
    }

    const result = await visionModel.generateContent(parts);
    const response = result.response;

    return {
      text: response.text(),
      finishReason: 'stop',
      usage: {
        promptTokens: 0, // Gemini no expone métricas en multimodal
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  private convertMessagesToGemini(messages: Message[]) {
    return messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  private extractFunctionCalls(response: any): ToolCall[] {
    const functionCalls = response.functionCalls();
    if (!functionCalls) return [];

    return functionCalls.map((fc: any) => ({
      toolName: fc.name,
      arguments: fc.args
    }));
  }
}
```

#### Preguntas Clave
1. **¿Usar Gemini 2.0 Flash Pro**
   - Flash: 1M tokens/min, $0.075/1M tokens
   - Pro: 2M tokens/min, $1.25/1M tokens
   - **Recomendación**: Flash para producción, Pro para testing

2. **¿Implementar OpenAI como fallback?**
   - Pros: Mayor disponibilidad, menor latencia en ciertos países
   - Contras: Más caro ($10/1M tokens), requiere otra API key
   - **Recomendación**: Solo Gemini inicialmente, agregar OpenAI si hay problemas de disponibilidad

3. **¿System Prompt global o personalizado por usuario?**
   - Global: Más simple, comportamiento uniforme
   - Personalizado: Mejor UX, adapta tono/idioma
   - **Recomendación**: System Prompt global + parámetros por usuario (idioma, rol)

---

### 3️⃣ MCP TOOLS ADICIONALES (Alta Prioridad)

#### Tool 3: buscar_productos ✅ ENDPOINT VERIFICADO

**Endpoint Real:** `GET /api/products` (Rest Service)  
**Filtros disponibles:** search, id_category, id_sub_category, id_seller, min_price, max_price, page, limit

```typescript
// mcp_service/src/tools/buscar_productos.ts
import { MCPTool } from '../types/MCPTool';
import { ProductClient } from '../clients/ProductClient';

export const buscar_productos: MCPTool = {
  name: 'buscar_productos',
  description: 'Busca productos en el marketplace por nombre, categoría o precio. Usa el endpoint GET /api/products del Rest Service.',
  parameters: {
    type: 'object',
    properties: {
      search: {
        type: 'string',
        description: 'Término de búsqueda (nombre o descripción del producto)'
      },
      id_category: {
        type: 'string',
        description: 'ID de la categoría (UUID)'
      },
      id_seller: {
        type: 'string',
        description: 'ID del vendedor (UUID)'
      },
      min_price: {
        type: 'number',
        description: 'Precio mínimo en dólares'
      },
      max_price: {
        type: 'number',
        description: 'Precio máximo en dólares'
      },
      page: {
        type: 'number',
        description: 'Número de página (default: 1)'
      },
      limit: {
        type: 'number',
        description: 'Productos por página (default: 10)'
      }
    },
    required: [] // Todos opcionales
  },
  
  async execute(args: {
    search?: string;
    id_category?: string;
    id_seller?: string;
    min_price?: number;
    max_price?: number;
    page?: number;
    limit?: number;
  }) {
    const client = new ProductClient();
    
    // Llamar a Rest Service: GET /api/products con query params
    const response = await client.listProducts(args);

    return {
      success: true,
      products: response.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        description: p.description,
        price: p.price,
        stock: p.stock
      })),
      totalFound: response.pagination.totalItems,
      currentPage: response.pagination.page
    };
  },

  formatResponse(result: any): string {
    if (!result.success || result.products.length === 0) {
      return 'No encontré productos con esos criterios.';
    }

    let response = `Encontré ${result.totalFound} producto(s):\n\n`;
    for (const product of result.products) {
      response += `📦 **${product.name}**\n`;
      response += `   💰 Precio: $${product.price}\n`;
      response += `   📊 Stock: ${product.stock} unidades\n\n`;
    }
    return response;
  }
};
```

**Cliente HTTP Necesario:**
```typescript
// mcp_service/src/clients/ProductClient.ts
import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export class ProductClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.REST_SERVICE_URL, // http://localhost:3002
      headers: {
        'X-Internal-Api-Key': env.INTERNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  // \u00daNICO M\u00c9TODO: GET /api/products con query params
  async listProducts(params: {
    search?: string;
    id_category?: string;
    id_seller?: string;
    min_price?: number;
    max_price?: number;
    page?: number;
    limit?: number;
  }) {
    const response = await this.client.get('/api/products', { params });
    return response.data; // { products: [], pagination: {} }
  }

  async getProduct(productId: string) {
    const response = await this.client.get(`/api/products/${productId}`);
    return response.data;
  }
}
```

#### Tool 4: crear_orden ✅ ENDPOINT VERIFICADO

**Endpoint Real:** `POST /api/orders` (Rest Service)  
**Autenticación:** 🔒 Requiere Bearer token (rol `client`)

### ✅ AUTH RESUELTA: USAR TOKEN DEMO FIJO (Opción B)

El endpoint `POST /api/orders` requiere un Bearer token del cliente.

**DECISIÓN TOMADA:** Usar **Opción B (Token Demo)** para desarrollo.
- Crear un usuario client de prueba en Auth Service
- Hacer login y copiar su Bearer token al .env del MCP Service
- Más adelante migrar a Opción A (token del usuario real desde frontend)

**Implementación Opción B (Demo):**
```typescript
// mcp_service/.env
DEMO_CLIENT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// mcp_service/src/clients/OrderClient.ts
export class OrderClient {
  constructor(userToken?: string) {
    this.client = axios.create({
      baseURL: env.REST_SERVICE_URL,
      headers: {
        'Authorization': `Bearer ${userToken || env.DEMO_CLIENT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  }
}
```

---

// mcp_service/src/tools/crear_orden.ts
export const crear_orden: MCPTool = {
  name: 'crear_orden',
  description: 'Crea una orden de compra. Requiere autenticación del cliente. Endpoint: POST /api/orders del Rest Service.',
  parameters: {
    type: 'object',
    properties: {
      customerId: {
        type: 'string',
        description: 'ID del cliente que realiza la orden'
      },
      products: {
        type: 'array',
        description: 'Lista de productos a comprar',
        items: {
          type: 'object',
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'number' }
          },
          required: ['productId', 'quantity']
        }
      },
      shippingAddress: {
        type: 'object',
        description: 'Dirección de envío',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          zipCode: { type: 'string' }
        },
        required: ['street', 'city', 'state', 'zipCode']
      }
    },
    required: ['customerId', 'products', 'shippingAddress']
  },

  async execute(args: any) {
    const orderClient = new OrderClient();
    
    // POST /api/orders
    const order = await orderClient.createOrder({
      customer_id: args.customerId,
      items: args.products,
      shipping_address: args.shippingAddress,
      status: 'pending'
    });

    return {
      success: true,
      orderId: order.order_id,
      total: order.total_amount,
      status: order.status,
      estimatedDelivery: order.estimated_delivery
    };
  },

  formatResponse(result: any): string {
    return `✅ Orden creada exitosamente!\n` +
           `🆔 ID: ${result.orderId}\n` +
           `💵 Total: $${result.total}\n` +
           `📦 Estado: ${result.status}\n` +
           `🚚 Entrega estimada: ${result.estimatedDelivery}`;
  }
};
```

#### Tool 5: resumen_ventas ✅ QUERY VERIFICADO

**Query Real:** `top_sellers_report` (Report Service - GraphQL)  
**Endpoint:** `POST /graphql`

```typescript
// mcp_service/src/tools/resumen_ventas.ts
export const resumen_ventas: MCPTool = {
  name: 'resumen_ventas',
  description: 'Obtiene un resumen de ventas de los top vendedores. Usa el query top_sellers_report del Report Service (GraphQL).',
  parameters: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Fecha inicio del período (YYYY-MM-DD)'
      },
      endDate: {
        type: 'string',
        description: 'Fecha fin del período (YYYY-MM-DD)'
      },
      limit: {
        type: 'number',
        description: 'Número de top vendedores (default: 5)'
      }
    },
    required: ['startDate', 'endDate']
  },

  async execute(args: {
    startDate: string;
    endDate: string;
    limit?: number;
  }) {
    const reportClient = new ReportClient();
    
    // GraphQL Query
    const query = `
      query TopSellers($startDate: String!, $endDate: String!, $limit: Int) {
        top_sellers_report(
          date_range: { start_date: $startDate, end_date: $endDate }
          limit: $limit
        ) {
          top_sellers {
            seller_id
            seller_name
            total_sales
            total_orders
          }
        }
      }
    `;

    const response = await reportClient.executeGraphQLQuery(query, {
      startDate: args.startDate,
      endDate: args.endDate,
      limit: args.limit || 5
    });

    return {
      success: true,
      topSellers: response.data.top_sellers_report.top_sellers
    };
  },

  formatResponse(result: any): string {
    let response = `📊 **Top Vendedores**\n\n`;
    for (const seller of result.topSellers) {
      response += `🏆 ${seller.seller_name}\n`;
      response += `   💰 Ventas totales: $${seller.total_sales}\n`;
      response += `   📦 Órdenes: ${seller.total_orders}\n\n`;
    }
    return response;
  }
};
```

**Pregunta Clave:**
- **¿El Rest Service ya tiene estos endpoints implementados?**
  - Verificar en [rest_service/readmes/API_ENDPOINTS.md](backend/rest_service/readmes/API_ENDPOINTS.md)
  - Si no existen, se deben crear PRIMERO en Rest Service antes de implementar estos tools

---

### 4️⃣ PROCESAMIENTO MULTIMODAL (Media Prioridad)

#### ⚠️ REQUISITO MÍNIMO: TEXTO + 1 TIPO ADICIONAL

**Decisión:** Implementar **TEXTO + PDF** (más estable que OCR)

**Razón:**
- pdf-parse es más confiable que Tesseract.js
- Menos dependencias nativas
- Casos de uso claros: catálogos, facturas, reportes
- Se puede agregar OCR después si es necesario

#### PDF Processor (ÚNICO PROCESADOR MULTIMODAL INICIAL)
```typescript
// ai_orchestrator/src/processors/PDFProcessor.ts
import pdfParse from 'pdf-parse';

export interface ProcessedDocument {
  name: string;
  extractedText: string;
  pageCount: number;
  metadata: any;
}

export class PDFProcessor {
  async extractTextFromPDF(pdfBuffer: Buffer, filename: string): Promise<ProcessedDocument> {
    const data = await pdfParse(pdfBuffer);

    return {
      name: filename,
      extractedText: data.text,
      pageCount: data.numpages,
      metadata: data.info
    };
  }

  async extractTextBatch(pdfs: Array<{name: string, data: Buffer}>): Promise<ProcessedDocument[]> {
    return Promise.all(pdfs.map(pdf => this.extractTextFromPDF(pdf.data, pdf.name)));
  }
}
```

**Casos de Uso:**
- Usuario sube catálogo PDF → Extrae lista de productos
- Usuario sube factura → Extrae datos de compra
- Usuario sube reporte → Genera resumen automático

**📌 IMPORTANTE:** NO implementar OCR ni análisis de imágenes inicialmente. Si después necesitas búsqueda visual, se puede agregar Gemini Vision en una fase posterior.

---

### 5️⃣ CHAT UI / INTERFAZ DE USUARIO (Baja Prioridad - Puede ser Pilar 4)

#### Opción A: Chat Component en React (Frontend)
```
frontend/src/components/ChatBot/
├── ChatWindow.tsx           # Contenedor principal
├── MessageList.tsx          # Lista de mensajes con scroll
├── MessageInput.tsx         # Input con soporte multimodal
├── FileUpload.tsx           # Drag & drop para imágenes/PDFs
├── TypingIndicator.tsx      # "AI está escribiendo..."
└── chatbot.css
```

**Endpoints Frontend:**
```typescript
// frontend/src/api/chat.ts
export const sendMessage = async (params: {
  userId: string;
  message: string;
  conversationId?: string;
  files?: File[];
}) => {
  const formData = new FormData();
  formData.append('userId', params.userId);
  formData.append('message', params.message);
  if (params.conversationId) {
    formData.append('conversationId', params.conversationId);
  }
  params.files?.forEach(file => formData.append('files', file));

  const response = await fetch('http://localhost:3004/api/chat/message', {
    method: 'POST',
    body: formData
  });

  return response.json();
};
```

#### Opción B: Telegram Bot (via n8n)
```
n8n Workflow:
┌─────────────────┐
│ Telegram Trigger│ → Detecta mensajes/imágenes de usuarios
└────────┬────────┘
         │
┌────────▼────────┐
│ Extract User ID │ → Identifica usuario de Telegram
└────────┬────────┘
         │
┌────────▼────────┐
│ HTTP Request    │ → POST http://localhost:3004/api/chat/message
│ (AI Orchestrator)│   Body: { userId, message, images }
└────────┬────────┘
         │
┌────────▼────────┐
│ Send Response   │ → Envía respuesta del AI al chat de Telegram
└─────────────────┘
```

**Pregunta Clave:**
- **¿Qué interfaz prefieres implementar primero?**
  - React Chat: Integrado en el marketplace, mejor UX, más control
  - Telegram Bot: Más rápido de implementar, accesible desde cualquier dispositivo
  - Ambos: Máxima flexibilidad pero más complejidad

---

## 📊 MATRIZ DE PRIORIDADES

| Componente | Prioridad | Esfuerzo | Bloqueante para | Estado |
|------------|-----------|----------|-----------------|--------|
| AI Orchestrator | 🔴 CRÍTICO | 3 días | Todo el Pilar 3 | ❌ Pendiente |
| LLM Adapter (Gemini) | 🔴 CRÍTICO | 2 días | Todo el Pilar 3 | ❌ Pendiente |
| buscar_productos Tool | 🟡 ALTA | 4 horas | Búsqueda conversacional | ✅ Endpoint verificado |
| crear_orden Tool | 🟡 ALTA | 4 horas | Compra conversacional | ✅ Endpoint verificado |
| resumen_ventas Tool | 🟡 ALTA | 4 horas | Analytics conversacional | ✅ Query verificado |
| PDF Processor | 🟢 MEDIA | 6 horas | Multimodal (mínimo) | ❌ Pendiente |
| Chat UI (React) | 🔵 BAJA | 2 días | UX final | ❌ Pendiente |
| Telegram Bot | 🔵 BAJA | 1 día | UX alternativa | ❌ Pendiente |

**🚫 NO IMPLEMENTAR (fuera del MVP):**
- OCR Processor (Tesseract) - Complejidad innecesaria
- Image Analyzer (Gemini Vision) - Requiere vector DB
- OpenAI Adapter - Solo Gemini inicialmente

---

## 🎯 PLAN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Núcleo Funcional (Semana 1)
```
DÍA 1-2: AI Orchestrator Service
- Setup proyecto (package.json, tsconfig, estructura)
- Implementar ChatController básico
- Implementar LLMService con Gemini
- Implementar MCPService (ejecutor de tools)

DÍA 3: LLM Adapter
- Implementar GeminiAdapter completo
- Pruebas de function calling con tools existentes
- Manejo de errores y retries

DÍA 4-5: MCP Tools Adicionales
- Implementar ProductClient + buscar_productos
- Implementar OrderClient + crear_orden
- Implementar ReportClient + resumen_ventas
- Testing end-to-end
```

### Fase 2: Multimodalidad MÍNIMA (Semana 2)
```
DÍA 6: PDF Processor ÚNICO
- PDFProcessor con pdf-parse (6 horas)
- Testing con facturas/catálogos reales

DÍA 7-8: Integración Multimodal
- Endpoint POST /api/chat/multimodal
- Manejo de archivos PDF (multer)
- Validación MIME: application/pdf únicamente
- Agregado de texto extraído al contexto LLM
- Testing end-to-end: texto + PDF → respuesta

DÍA 9: Buffer/Refinamiento
- Fix de bugs encontrados
- Mejoras de prompts
- Documentación
```

### Fase 3: UI (Semana 3 - Opcional)
```
DÍA 10-12: Chat Component React
- ChatWindow con manejo de estado
- MessageList con renderizado dinámico
- FileUpload con drag & drop
- Integración con AI Orchestrator

ALTERNATIVA: Telegram Bot (1 día)
- Workflow n8n
- Manejo de comandos /start, /help
- Envío/recepción de imágenes
```

---

## 🔧 CONFIGURACIÓN NECESARIA

### Variables de Entorno
```bash
# ai_orchestrator/.env
PORT=3004
NODE_ENV=development

# Gemini API
GEMINI_API_KEY=tu_api_key_aquí
GEMINI_MODEL=gemini-2.0-flash

# MCP Service
MCP_SERVICE_URL=http://localhost:3003
INTERNAL_API_KEY=shared_secret_key

# Microservicios
REST_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3001
REPORT_SERVICE_URL=http://localhost:3005

# Base de datos (opcional - para persistir conversaciones)
DATABASE_URL=postgresql://user:pass@localhost:5432/marketplace

# Redis (opcional - cache de conversaciones)
REDIS_URL=redis://localhost:6379
```

### API Keys Necesarias
1. **Gemini API Key**
   - Ir a: https://ai.google.dev/
   - Crear proyecto en Google AI Studio
   - Generar API key
   - Límites gratis: 1500 requests/día, 1M tokens/min

2. **OpenAI API Key (Opcional)**
   - Ir a: https://platform.openai.com/api-keys
   - Crear API key
   - Límites: Pay-as-you-go, $5 crédito inicial

---

## ❓ PREGUNTAS CRÍTICAS ANTES DE EMPEZAR

### Decisiones de Producto
1. ¿Qué idiomas debe soportar el chatbot? (Español, Inglés, ambos)
2. ¿Los usuarios podrán realizar compras completas vía chat? (búsqueda → orden → pago)
3. ¿Se necesita memoria a largo plazo de las conversaciones? (sí = PostgreSQL, no = Redis temporal)
4. ¿Qué rol debe tener el chatbot? (asistente de compras, soporte técnico, ambos)

### Decisiones Técnicas
5. ¿Usar Gemini Flash (económico) o Pro (potente)? **→ RECOMENDADO: Flash**
6. ¿Implementar streaming de respuestas o respuestas completas? **→ RECOMENDADO: Completas (más simple)**
7. ¿Persistir conversaciones en DB o solo en memoria? **→ RECOMENDADO: PostgreSQL + Redis cache**
8. ¿Implementar rate limiting por usuario? **→ SÍ (opcional pero recomendado)**
9. ¿Prefieren React Chat UI o Telegram Bot como primera interfaz? **→ Decidir según UX deseada**

### ⚠️ Validación de Infraestructura
10. ¿El Rest Service ya tiene endpoints de búsqueda de productos? **✅ SÍ: GET /api/products con filtros**
11. ¿El Rest Service tiene endpoints de creación de órdenes? **✅ SÍ: POST /api/orders (requiere Bearer token)**
12. ¿El Report Service tiene endpoint de resumen de ventas? **✅ SÍ: query GraphQL top_sellers_report**
13. ¿Todos los microservicios aceptan autenticación con `X-Internal-Api-Key`? **⚠️ VERIFICAR:**
    - ✅ Payment Service: Ya configurado
    - ❓ Rest Service: Revisar si tiene middleware de X-Internal-Api-Key
    - ❓ Report Service: Revisar si tiene middleware de X-Internal-Api-Key
    - **Si NO tienen:** Opciones:
      - Agregar middleware en Rest/Report (recomendado)
      - Usar Bearer token de servicio
      - Dejar endpoints públicos temporalmente (solo demo)

---

## 📚 RECURSOS Y DOCUMENTACIÓN

### Documentación Oficial
- [Gemini Function Calling Guide](https://ai.google.dev/docs/function_calling)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/introduction)
- [pdf-parse Documentation](https://www.npmjs.com/package/pdf-parse)

### Arquitectura Existente
- [Payment Service Integration Guide](backend/payment_service/docs/iniciopilar3.md)
- [Rest Service API Endpoints](backend/rest_service/readmes/API_ENDPOINTS.md)
- [Backend Architecture](backend/ARQUITECTURA_BACKEND_EXPLICADA.md)

### Patrones de Diseño Aplicados
- Strategy Pattern (LLM Adapters)
- Factory Pattern (Tool execution)
- Adapter Pattern (Payment providers)
- Saga Pattern (Eventual consistency)

---

## ✅ CHECKLIST DE PREPARACIÓN

Antes de empezar a codificar, asegúrate de:

- [ ] Tener Gemini API Key activa
- [ ] Verificar que Rest Service tenga endpoints necesarios
- [ ] Verificar que Report Service tenga endpoints necesarios
- [ ] Confirmar que todos los servicios usan `X-Internal-Api-Key`
- [ ] Decidir si usar PostgreSQL o Redis para conversaciones
- [ ] Decidir si implementar streaming o respuestas completas
- [ ] Decidir qué UI implementar (React Chat o Telegram)
- [ ] Decidir si necesitan búsqueda visual (vector DB)
- [ ] Leer la documentación de Gemini Function Calling
- [ ] Tener claro el System Prompt del chatbot (personalidad, capacidades)

---

## 🚀 COMANDO PARA EMPEZAR

Una vez respondidas las preguntas críticas:

```bash
# Crear estructura del AI Orchestrator
cd backend
mkdir ai_orchestrator
cd ai_orchestrator
npm init -y
npm install express @google/generative-ai axios pdf-parse multer
npm install --save-dev typescript @types/node @types/express @types/multer ts-node nodemon

# Copiar tsconfig base
cp ../mcp_service/tsconfig.json .

# Crear estructura de carpetas (SIN OCRProcessor ni ImageAnalyzer)
mkdir -p src/{config,controllers,services,adapters,processors,models,utils}

# Iniciar desarrollo
npm run dev
```

---

## 📌 NOTAS FINALES

- **No bloquea Pilar 4 (Event Bus)**: Puedes implementar Pilar 3 y 4 en paralelo
- **Iterativo**: Empieza con lo mínimo funcional (AI Orchestrator + Gemini + 2 tools)
- **Escalable**: La arquitectura permite agregar más tools sin cambiar el núcleo
- **Testeable**: Cada componente es independiente y se puede probar aisladamente

**Este documento debe ser tu guía completa para implementar el Pilar 3. Revísalo, haz preguntas específicas sobre cualquier sección, y empezamos cuando estés listo.** 🎯
