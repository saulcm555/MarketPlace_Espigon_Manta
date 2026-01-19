# MCP Service - Pilar 3

> Microservicio para el Chatbot Multimodal con IA

## Descripción

Este servicio implementa el **Pilar 3: MCP - Chatbot Multimodal con IA** del proyecto Marketplace Espigón Manta.

Actualmente contiene:
- Cliente HTTP para comunicación con Payment Service
- MCP Tools para procesamiento de pagos

## Instalación

```bash
cd backend/mcp_service
npm install
cp .env.example .env
# Editar .env con las credenciales
```

## Configuración

```env
# Server
PORT=3003
NODE_ENV=development

# Payment Service
PAYMENT_SERVICE_URL=http://localhost:3001
INTERNAL_API_KEY=your-secret-internal-api-key-here

# LLM Provider (para futuro)
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
```

## Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

## Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del servicio |
| GET | `/tools` | Lista de MCP Tools disponibles |
| POST | `/tools/:name/execute` | Ejecutar un tool específico |

## MCP Tools Disponibles

### `procesar_pago`

Procesa el pago de una orden.

**Request:**
```json
{
  "orderId": 123,
  "amount": 50.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "tool": "procesar_pago",
  "result": {
    "success": true,
    "transactionId": "mock_txn_123456",
    "amount": 50.00,
    "currency": "USD",
    "status": "completed"
  },
  "formatted": "✅ ¡Pago procesado exitosamente!..."
}
```

### `consultar_pago`

Consulta el estado de una transacción.

**Request:**
```json
{
  "transactionId": "mock_txn_123456"
}
```

## Cliente Payment Service

```typescript
import { getPaymentClient } from './clients/PaymentClient';

const client = getPaymentClient();

// Procesar pago
const result = await client.processPayment({
  amount: 50.00,
  currency: 'USD',
  orderId: 123
});

// Consultar transacción
const transaction = await client.getTransaction('mock_txn_123456');

// Health check
const health = await client.health();
```

## Pruebas con curl

### Health Check
```bash
curl http://localhost:3003/health
```

### Listar Tools
```bash
curl http://localhost:3003/tools
```

### Ejecutar procesar_pago
```bash
curl -X POST http://localhost:3003/tools/procesar_pago/execute \
  -H "Content-Type: application/json" \
  -d '{"orderId": 123, "amount": 50.00, "currency": "USD"}'
```

### Ejecutar consultar_pago
```bash
curl -X POST http://localhost:3003/tools/consultar_pago/execute \
  -H "Content-Type: application/json" \
  -d '{"transactionId": "mock_txn_123456"}'
```

## Estructura

```
mcp_service/
├── src/
│   ├── main.ts              # Entry point
│   ├── clients/
│   │   ├── index.ts
│   │   └── PaymentClient.ts # Cliente HTTP para Payment Service
│   └── tools/
│       ├── index.ts
│       ├── procesar_pago.ts # Tool para procesar pagos
│       └── consultar_pago.ts# Tool para consultar pagos
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Próximos Pasos

1. Implementar AI Orchestrator
2. Agregar LLM Adapter (Gemini, OpenAI)
3. Implementar más MCP Tools (buscar_productos, crear_reserva, etc.)
4. Agregar Chat UI o integración con Telegram/WhatsApp
