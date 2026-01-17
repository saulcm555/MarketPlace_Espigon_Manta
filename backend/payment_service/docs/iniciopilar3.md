# 🚀 Análisis del Pilar 2 para Integración con Pilar 3 (MCP)

> **Documento de referencia para implementar el Pilar 3: MCP - Chatbot Multimodal con IA**
> 
> Fecha de análisis: 17 de enero de 2026
> 
> **✅ ACTUALIZADO: Se implementaron todas las mejoras para integración con MCP**

---

## 📋 Resumen Ejecutivo

Este documento analiza el estado actual del **Pilar 2 (Payment Service + Webhooks)** y documenta las mejoras implementadas para consumo desde el **Pilar 3 (MCP Tools)**.

### ✅ Implementaciones Completadas

1. **Migraciones SQL** - Tablas `transactions`, `partners`, `webhook_logs`
2. **Autenticación Service-to-Service** - Middleware con `X-Internal-Api-Key`
3. **DTOs Tipados** - Contratos exportables para TypeScript
4. **Constantes de Eventos** - Enum centralizado (no más strings hardcodeados)
5. **Cliente HTTP para MCP** - PaymentClient listo para usar

---

## 1. 📡 Contratos de Eventos

### ✅ Estado Actual: DEFINIDO

Los eventos ahora están centralizados en `src/contracts/events.ts`:

```typescript
import { PaymentEvents, OrderEvents, DeliveryEvents } from '../contracts/events';

// Eventos de pago
PaymentEvents.PAYMENT_SUCCESS   // 'payment.success'
PaymentEvents.PAYMENT_FAILED    // 'payment.failed'
PaymentEvents.PAYMENT_REFUNDED  // 'payment.refunded'

// Eventos de órdenes
OrderEvents.ORDER_CREATED       // 'order.created'
OrderEvents.ORDER_UPDATED       // 'order.updated'

// Eventos de delivery
DeliveryEvents.DELIVERY_ASSIGNED    // 'delivery.assigned'
DeliveryEvents.DELIVERY_IN_TRANSIT  // 'delivery.in_transit'
DeliveryEvents.DELIVERY_COMPLETED   // 'delivery.completed'
```

### Ubicación
- `backend/payment_service/src/contracts/events.ts`

---

## 2. 🔌 Endpoints Disponibles para MCP Tools

### Endpoints del Payment Service

| Método | Endpoint | Descripción | ¿MCP puede usar? |
|--------|----------|-------------|------------------|
| `POST` | `/api/payments/process` | Procesar un pago | ✅ **SÍ - PRINCIPAL** |
| `POST` | `/api/payments/refund` | Reembolsar pago | ✅ SÍ |
| `GET` | `/api/payments/transaction/:id` | Consultar transacción | ✅ SÍ |
| `POST` | `/api/partners/register` | Registrar partner B2B | ⚠️ Solo admin |
| `GET` | `/api/partners` | Listar partners | ⚠️ Solo admin |
| `POST` | `/api/webhooks/partner` | Recibir webhook externo | ❌ No aplica |
| `POST` | `/api/webhooks/stripe` | Recibir webhook Stripe | ❌ No aplica |
| `GET` | `/api/webhooks/logs` | Auditoría de webhooks | ⚠️ Solo admin |
| `GET` | `/health` | Health check | ✅ SÍ |

### 🎯 Endpoint Principal para MCP: `POST /api/payments/process`

**URL:** `http://localhost:3001/api/payments/process`

**Request Body:**
```typescript
{
  amount: number;           // Requerido - Monto a cobrar
  currency: string;         // Requerido - Ej: 'USD', 'EUR'
  description?: string;     // Opcional - Descripción del pago
  orderId?: number;         // Opcional - ID de orden asociada
  customerId?: number;      // Opcional - ID del cliente
  metadata?: object;        // Opcional - Datos adicionales
}
```

**Response (éxito):**
```typescript
{
  success: true;
  transactionId: string;    // ID único de transacción
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  metadata?: object;
}
```

**Response (error):**
```typescript
{
  success: false;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'failed';
  errorMessage: string;
}
```

---

## 3. 🛠️ Mapeo de MCP Tools → Payment Service

### Tools Sugeridos para el Pilar 3

| MCP Tool | Tipo | Endpoint a Llamar | Descripción |
|----------|------|-------------------|-------------|
| `procesar_pago` | Acción | `POST /api/payments/process` | Procesa un pago para una orden |
| `consultar_pago` | Consulta | `GET /api/payments/transaction/:id` | Obtiene estado de una transacción |
| `reembolsar_pago` | Acción | `POST /api/payments/refund` | Procesa reembolso |
| `verificar_servicio_pagos` | Consulta | `GET /health` | Verifica disponibilidad |

### 📝 Ejemplo de Implementación: `procesar_pago`

```typescript
// Ejemplo de MCP Tool para procesar pago
const procesarPagoTool = {
  name: 'procesar_pago',
  description: 'Procesa un pago para una orden del marketplace',
  parameters: {
    type: 'object',
    properties: {
      orderId: {
        type: 'number',
        description: 'ID de la orden a pagar'
      },
      amount: {
        type: 'number',
        description: 'Monto a cobrar'
      },
      currency: {
        type: 'string',
        description: 'Moneda (USD, EUR)',
        default: 'USD'
      }
    },
    required: ['orderId', 'amount']
  },
  
  async execute(params: { orderId: number; amount: number; currency?: string }) {
    const response = await fetch('http://localhost:3001/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency || 'USD',
        description: `Pago orden #${params.orderId}`
      })
    });
    
    return await response.json();
  }
};
```

---

## 4. 🔐 Webhooks B2B (Estado Actual)

| Componente | Estado | Notas |
|------------|--------|-------|
| Registro de partners (`/partners/register`) | ✔️ Definido | Funcional |
| Generación de secret | ✔️ Definido | `crypto.randomBytes(32)` |
| Firma HMAC-SHA256 | ✔️ Definido | Con timing-safe comparison |
| Verificación de firma | ✔️ Definido | En `webhookRoutes.ts` |
| Headers de webhook | ✔️ Definido | `X-Webhook-Signature`, `X-Partner-Id`, `X-Webhook-Event` |
| Reintentos automáticos | ✔️ Definido | Exponential backoff |
| Logs de auditoría | ✔️ Definido | Tabla `webhook_logs` |
| Migraciones SQL | ❌ Falta | No hay archivos `.sql` |

---

## 5. 📊 Normalización de Webhooks

| Pasarela | Estado | Adaptador |
|----------|--------|-----------|
| Stripe | ✔️ Definido | `StripeAdapter.ts` |
| Mock (desarrollo) | ✔️ Definido | `MockAdapter.ts` |
| MercadoPago | ❌ Falta | No implementado |

### Interface de Normalización

```typescript
// PaymentProvider.ts - Todos los adapters implementan esto
interface NormalizedWebhook {
  event: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: any;
}
```

---

## 6. ❌ Pendientes para Integración MCP

### Críticos

| # | Pendiente | Impacto en MCP |
|---|-----------|----------------|
| 1 | **Crear DTOs tipados exportables** | MCP tools necesitan tipos para request/response |
| 2 | **Crear constantes de eventos** | MCP necesita saber qué eventos escuchar |
| 3 | **Documentación OpenAPI** | Para generar clientes automáticos |
| 4 | **Auth service-to-service** | MCP necesita autenticarse con Payment Service |

### Recomendados

| # | Pendiente | Beneficio |
|---|-----------|-----------|
| 5 | Endpoint `/api/payments/status/:orderId` | Consultar pagos por orden (más útil para MCP) |
| 6 | Evento `order.created` | Para que MCP sepa cuándo procesar pago |
| 7 | SDK/Cliente TypeScript | Simplifica integración |

---

## 7. 📁 Archivos Relevantes

### Payment Service
```
backend/payment_service/
├── src/
│   ├── main.ts                    # Entry point, lista endpoints
│   ├── adapters/
│   │   ├── PaymentProvider.ts     # Interface del patrón Adapter
│   │   ├── MockAdapter.ts         # Adapter para desarrollo
│   │   └── StripeAdapter.ts       # Adapter para Stripe
│   ├── services/
│   │   ├── PaymentService.ts      # Lógica de negocio
│   │   └── WebhookService.ts      # Envío de webhooks a partners
│   ├── routes/
│   │   ├── paymentRoutes.ts       # POST /process, /refund
│   │   ├── partnerRoutes.ts       # POST /register, GET /
│   │   └── webhookRoutes.ts       # POST /partner, /stripe
│   ├── utils/
│   │   └── webhookSecurity.ts     # HMAC-SHA256
│   └── config/
│       ├── env.ts                 # Variables de entorno
│       └── database.ts            # Conexión PostgreSQL
└── README.md
```

### Archivos del Rest Service (relacionados)
```
backend/rest_service/src/application/dtos/payments/
└── CreatePayment.dto.ts           # DTO existente (pero para payment methods)
```

---

## 8. 🎯 Próximos Pasos para Pilar 3

### Paso 1: Crear Cliente HTTP para Payment Service

```typescript
// mcp_service/src/clients/PaymentClient.ts
export class PaymentClient {
  private baseUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';

  async processPayment(data: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    // ...
  }

  async getTransaction(id: string): Promise<Transaction> {
    // ...
  }
}
```

### Paso 2: Registrar MCP Tool

```typescript
// mcp_service/src/tools/procesar_pago.ts
export const procesarPagoTool: MCPTool = {
  name: 'procesar_pago',
  description: 'Procesa el pago de una orden en el marketplace',
  // ... definición completa
};
```

### Paso 3: Suscribirse a Eventos

El MCP puede escuchar eventos vía:
1. **WebSocket** del realtime_service (para `order_created`)
2. **Webhook interno** registrado como partner (para `payment.success`)

---

## 9. 📊 Resumen de Estados

| Componente | Estado |
|------------|--------|
| Eventos documentados | ⚠️ Parcial |
| Endpoints para MCP | ✔️ Definido |
| Webhooks B2B | ✔️ Definido |
| Normalización | ✔️ Definido |
| DTOs para MCP | ❌ Falta |
| Auth service-to-service | ❌ Falta |

---

## 10. 🔗 URLs de Servicios (Desarrollo)

| Servicio | Puerto | URL Base |
|----------|--------|----------|
| Payment Service | 3001 | `http://localhost:3001` |
| Rest Service | 3000 | `http://localhost:3000` |
| Realtime Service | 8080 | `http://localhost:8080` |
| Auth Service | 3002 | `http://localhost:3002` |
| Frontend | 5173 | `http://localhost:5173` |

---

## 📌 Conclusión

El **Payment Service está ~70% listo** para ser consumido por MCP Tools. Los endpoints principales (`/api/payments/process`, `/api/payments/refund`) están funcionales.

**Lo que falta para una integración limpia:**
1. DTOs tipados exportables
2. Constantes de eventos centralizadas
3. Documentación OpenAPI
4. Autenticación entre servicios

**El MCP Tool `procesar_pago` puede implementarse YA** usando el endpoint `POST /api/payments/process` directamente.
