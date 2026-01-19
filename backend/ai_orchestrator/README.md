# AI Orchestrator

**Pilar 3: Chatbot Multimodal con IA**

El AI Orchestrator es el "cerebro" del chatbot. Toma decisiones usando Google Gemini y ejecuta herramientas a través del MCP Service.

## 🚀 Puerto

**3004**

## 📋 Descripción

- **Rol**: Procesamiento de lenguaje natural y toma de decisiones de IA
- **LLM**: Google Gemini (gemini-2.0-flash)
- **Function Calling**: Sí, para invocar herramientas del MCP
- **Multimodal**: Texto + PDF (extracción de texto)

## 🏗️ Arquitectura

```
Usuario → AI Orchestrator → Gemini (decide qué hacer)
                ↓
         MCP Service (ejecuta herramientas)
                ↓
         Microservicios (Rest, Payment, Report)
```

## 🛠️ Instalación

```bash
cd backend/ai_orchestrator
npm install
```

## ⚙️ Configuración

Copiar `.env.example` a `.env`:

```env
PORT=3004
NODE_ENV=development

# Gemini API
GEMINI_API_KEY=tu_api_key_aqui
GEMINI_MODEL=gemini-2.0-flash

# MCP Service
MCP_SERVICE_URL=http://localhost:3003
```

## 🚀 Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## 📡 Endpoints

### Health Check
```
GET /health
```

### Info del Servicio
```
GET /info
```

### Chat (FormData)
```
POST /api/chat/message
Content-Type: multipart/form-data

Fields:
- message: string (requerido) - Mensaje del usuario
- conversationId: string (opcional) - ID para mantener contexto
- files: File[] (opcional) - Archivos PDF
```

### Listar Herramientas
```
GET /api/chat/tools
```

### Ver Conversación
```
GET /api/chat/conversation/:id
```

### Eliminar Conversación
```
DELETE /api/chat/conversation/:id
```

## 🔧 Herramientas MCP Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `buscar_productos` | Buscar productos por nombre, categoría o precio |
| `crear_orden` | Crear una nueva orden de compra |
| `procesar_pago` | Procesar pago de una orden |
| `consultar_pago` | Consultar estado de una transacción |
| `resumen_ventas` | Obtener reporte de ventas (GraphQL) |

## 📄 Soporte de Documentos

- **PDF**: ✅ Extracción de texto (pdf-parse)
- **Imágenes**: ❌ No soportado (solo texto)
- **OCR**: ❌ No incluido

## 🧪 Ejemplo de Uso

### Mensaje Simple
```bash
curl -X POST http://localhost:3004/api/chat/message \
  -F "message=Busca productos de mariscos"
```

### Con PDF Adjunto
```bash
curl -X POST http://localhost:3004/api/chat/message \
  -F "message=Resume este documento" \
  -F "files=@documento.pdf"
```

### Mantener Conversación
```bash
curl -X POST http://localhost:3004/api/chat/message \
  -F "message=Muéstrame más detalles" \
  -F "conversationId=abc123"
```

## 📂 Estructura

```
ai_orchestrator/
├── package.json
├── tsconfig.json
├── .env
└── src/
    ├── main.ts                    # Entry point
    ├── config/
    │   └── env.ts                 # Configuración
    ├── adapters/
    │   ├── LLMAdapter.ts          # Interface
    │   └── GeminiAdapter.ts       # Implementación Gemini
    ├── controllers/
    │   └── ChatController.ts      # Endpoints de chat
    ├── models/
    │   ├── Message.ts             # Tipos de mensajes
    │   └── Tool.ts                # Tipos de herramientas
    ├── processors/
    │   └── PDFProcessor.ts        # Procesador de PDFs
    ├── services/
    │   ├── LLMService.ts          # Orquestación principal
    │   └── MCPClient.ts           # Cliente MCP
    └── types/
        └── pdf-parse.d.ts         # Tipos de pdf-parse
```

## 🔗 Dependencias

- MCP Service (puerto 3003) - Ejecutor de herramientas
- Rest Service (puerto 3000) - API de productos/órdenes
- Payment Service (puerto 3001) - Procesamiento de pagos
- Report Service (puerto 4000) - Reportes GraphQL

## 📝 Notas

- Las conversaciones se limpian automáticamente después de 1 hora de inactividad
- Máximo 5 archivos PDF por request
- Tamaño máximo de archivo: 10MB
- Límite de 5 iteraciones de tools por mensaje (previene loops)
