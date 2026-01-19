# 🚀 PILAR 4: n8n - Event Bus (15%)
## MarketPlace El Espigón - Manta

---

## 📋 ÍNDICE

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
3. [Arquitectura de Integración n8n](#arquitectura-de-integración-n8n)
4. [Workflows Obligatorios Detallados](#workflows-obligatorios-detallados)
5. [Integración con Pilares Anteriores](#integración-con-pilares-anteriores)
6. [Requisitos Técnicos](#requisitos-técnicos)
7. [Lista de Tareas (Checklist)](#lista-de-tareas-checklist)
8. [Cronograma Sugerido](#cronograma-sugerido)
9. [Pruebas y Validación](#pruebas-y-validación)

---

## 📌 RESUMEN EJECUTIVO

### ¿Qué es el Pilar 4?

El Pilar 4 implementa **n8n como Event Bus Visual** para centralizar la orquestación de **todos los eventos externos** del sistema. Esto incluye webhooks de pasarelas de pago, comunicación B2B con partners, entrada de mensajes desde canales externos (Telegram/Email) y tareas programadas.

### Principio Fundamental
> **"Todo evento externo pasa por n8n"**

### Peso en la Evaluación
- **15%** del total del proyecto

### Servicios a Integrar

| Servicio | Puerto | Rol en n8n |
|----------|--------|------------|
| REST Service | 3000 | Receptor de acciones de negocio |
| Auth Service | 4001 | Validación de tokens |
| Payment Service | 3001 | Fuente de webhooks de pago |
| Realtime Service | 8085 | Notificaciones WebSocket |
| Report Service | 4000 | Datos para reportes programados |
| AI Orchestrator | 3004 | Procesamiento de mensajes IA |
| MCP Service | 3003 | Ejecución de tools |

---

## 🏗️ ESTADO ACTUAL DEL PROYECTO

### ✅ Pilar 1: Core REST, GraphQL y WebSocket (COMPLETADO)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| REST Service | ✅ 100% | API CRUD completa con 17 módulos |
| GraphQL | ✅ 100% | Report Service con Strawberry |
| WebSocket | ✅ 100% | Realtime Service en Go |
| Frontend | ✅ 100% | React + Vite + TailwindCSS |

### ✅ Pilar 2: Webhooks e Interoperabilidad B2B (COMPLETADO)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| Payment Service | ✅ 100% | Patrón Adapter para pasarelas |
| Webhook Partner | ✅ 100% | `POST /api/webhooks/partner` |
| Webhook Stripe | ✅ 100% | `POST /api/webhooks/stripe` |
| Firma HMAC | ✅ 100% | Verificación de seguridad |
| Partners B2B | ✅ 100% | CRUD de partners |

### ✅ Pilar 3: MCP - Chatbot Multimodal (COMPLETADO)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| AI Orchestrator | ✅ 100% | LLM con Gemini |
| MCP Service | ✅ 100% | 5 Tools ejecutables |
| Chat UI | ✅ 100% | Widget + página dedicada |
| Multimodal | ✅ 100% | Texto + PDFs |

### ⏳ Pilar 4: n8n Event Bus (PENDIENTE - 0%)

| Componente | Estado | Descripción |
|------------|--------|-------------|
| n8n Setup | ❌ 0% | Configuración Docker |
| Payment Handler | ❌ 0% | Workflow de pagos |
| Partner Handler | ❌ 0% | Workflow B2B |
| MCP Input Handler | ❌ 0% | Workflow chat externo |
| Scheduled Tasks | ❌ 0% | Workflows programados |

---

## 🔄 ARQUITECTURA DE INTEGRACIÓN N8N

### Diagrama de Flujo General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EVENTOS EXTERNOS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Stripe     │  Partners B2B  │  Telegram/Email  │  Cron Jobs               │
│  Webhook    │  Webhook       │  Mensajes        │  Programados             │
└──────┬──────┴───────┬────────┴────────┬─────────┴──────────┬───────────────┘
       │              │                 │                    │
       ▼              ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           n8n EVENT BUS (Puerto 5678)                       │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Payment    │  │  Partner    │  │  MCP Input  │  │  Scheduled  │       │
│  │  Handler    │  │  Handler    │  │  Handler    │  │  Tasks      │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │              │
└─────────┼────────────────┼────────────────┼────────────────┼──────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MICROSERVICIOS INTERNOS                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  REST Service   │ Payment Service │ Realtime Service │ AI Orchestrator     │
│  (3000)         │ (3001)          │ (8085)           │ (3004)              │
│                 │                 │                  │                     │
│  • Activar      │ • Validar       │ • WebSocket      │ • Procesar          │
│    reservas     │   pagos         │   Notify         │   mensajes          │
│  • CRUD ops     │ • Reembolsos    │ • Broadcast      │ • Function          │
│                 │                 │                  │   calling           │
└─────────────────┴─────────────────┴──────────────────┴─────────────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ACCIONES DE SALIDA                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  📧 Email       │  🔔 WebSocket    │  🔗 Webhook     │  📊 Reportes        │
│  Confirmación   │  Notificación    │  Partner ACK    │  Programados        │
└─────────────────┴──────────────────┴─────────────────┴─────────────────────┘
```

### Configuración Docker de n8n

```yaml
# Agregar a docker-compose.yml
  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: marketplace-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-admin123}
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/Guayaquil
      # Conexión a servicios internos
      - REST_SERVICE_URL=http://rest-service:3000
      - PAYMENT_SERVICE_URL=http://payment-service:3001
      - REALTIME_SERVICE_URL=http://realtime-service:8085
      - AI_ORCHESTRATOR_URL=http://ai-orchestrator:3004
      - REPORT_SERVICE_URL=http://report-service:4000
      # Credenciales internas
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - n8n-data:/home/node/.n8n
    networks:
      - marketplace-network
    depends_on:
      - rest-service
      - payment-service
      - realtime-service
      - ai-orchestrator
```

---

## 📊 WORKFLOWS OBLIGATORIOS DETALLADOS

### 1️⃣ WORKFLOW: Payment Handler

**Objetivo:** Procesar webhooks de pasarelas de pago (Stripe) y orquestar acciones post-pago.

#### Diagrama del Workflow

```
┌─────────────────┐
│  Webhook        │ ← Stripe/MercadoPago envía evento
│  Trigger        │
│  POST /webhook/ │
│  payment        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Validar        │ ← Verificar firma del webhook
│  Payload        │ ← Parsear evento (payment.success, etc.)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│SUCCESS│ │FAILED │
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌─────────────────┐     ┌─────────────────┐
│ Activar         │     │ Marcar orden    │
│ Servicio/Reserva│     │ como fallida    │
│ REST Service    │     │ REST Service    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Notificar via   │     │ Notificar error │
│ WebSocket       │     │ WebSocket       │
│ Realtime Service│     │ Realtime Service│
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       │
┌─────────────────┐              │
│ Enviar Email    │              │
│ Confirmación    │              │
│ (SMTP/SendGrid) │              │
└────────┬────────┘              │
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Webhook a       │     │ Fin del flujo   │
│ Partner B2B     │     │                 │
└─────────────────┘     └─────────────────┘
```

#### Nodos n8n Requeridos

| # | Nodo | Tipo | Configuración |
|---|------|------|---------------|
| 1 | Webhook Trigger | Webhook | `POST /webhook/payment` |
| 2 | Validar Firma | Function | Verificar HMAC signature |
| 3 | IF | Conditional | `event.type === 'payment.success'` |
| 4 | HTTP Request | REST | `PATCH /api/orders/{id}/status` |
| 5 | HTTP Request | WebSocket | `POST http://realtime:8085/api/notify` |
| 6 | Send Email | SMTP | Plantilla de confirmación |
| 7 | HTTP Request | Webhook | Notificar partner suscrito |

#### Código del Nodo "Validar Firma"

```javascript
// n8n Function Node
const crypto = require('crypto');

const signature = $input.first().headers['stripe-signature'];
const payload = JSON.stringify($input.first().json);
const secret = $env.STRIPE_WEBHOOK_SECRET;

const expectedSignature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  throw new Error('Invalid webhook signature');
}

return $input.first().json;
```

#### Endpoints Existentes a Usar

| Acción | Servicio | Endpoint | Método |
|--------|----------|----------|--------|
| Actualizar orden | REST Service | `/api/orders/{id}` | PATCH |
| Notificar WS | Realtime Service | `/api/notify` | POST |
| Consultar partner | Payment Service | `/api/partners/{id}` | GET |

---

### 2️⃣ WORKFLOW: Partner Handler

**Objetivo:** Recibir webhooks de partners externos (grupo B2B), validar y procesar eventos.

#### Diagrama del Workflow

```
┌─────────────────┐
│  Webhook        │ ← Partner externo envía evento
│  Trigger        │
│  POST /webhook/ │
│  partner        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verificar      │ ← x-partner-id header
│  Partner ID     │ ← Buscar en BD de partners
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Verificar      │ ← x-webhook-signature header
│  Firma HMAC     │ ← Usar secret del partner
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Switch por     │
│  Tipo de Evento │
└────────┬────────┘
         │
    ┌────┼────┬────────────┐
    ▼    ▼    ▼            ▼
┌──────┐┌──────┐┌────────┐┌────────┐
│ORDER ││DELIV ││PAYMENT ││INVENTORY│
│CREATE││UPDATE││STATUS  ││SYNC     │
└──┬───┘└──┬───┘└───┬────┘└───┬────┘
   │       │        │         │
   ▼       ▼        ▼         ▼
┌─────────────────────────────────┐
│  Ejecutar Acción de Negocio     │
│  (Llamar servicio correspondiente)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────┐
│  Responder ACK  │ ← { "status": "received", "processedAt": "..." }
│  al Partner     │
└─────────────────┘
```

#### Tipos de Eventos Soportados

```typescript
// Eventos que pueden enviar los partners
enum PartnerEventType {
  // Órdenes
  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  
  // Entregas
  DELIVERY_ASSIGNED = 'delivery.assigned',
  DELIVERY_IN_TRANSIT = 'delivery.in_transit',
  DELIVERY_COMPLETED = 'delivery.completed',
  DELIVERY_FAILED = 'delivery.failed',
  
  // Pagos
  PAYMENT_CONFIRMED = 'payment.confirmed',
  PAYMENT_REFUND_REQUESTED = 'payment.refund_requested',
  
  // Inventario
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_RESTOCK = 'inventory.restock',
  
  // Productos
  PRODUCT_PRICE_UPDATE = 'product.price_update',
  PRODUCT_AVAILABILITY = 'product.availability'
}
```

#### Nodos n8n Requeridos

| # | Nodo | Tipo | Configuración |
|---|------|------|---------------|
| 1 | Webhook Trigger | Webhook | `POST /webhook/partner` |
| 2 | HTTP Request | GET | Obtener partner de Payment Service |
| 3 | Function | Code | Verificar firma HMAC |
| 4 | Switch | Conditional | Según `event.type` |
| 5 | HTTP Request | Varios | Llamar servicio correspondiente |
| 6 | Respond to Webhook | Response | ACK al partner |

#### Código del Nodo "Verificar HMAC"

```javascript
// n8n Function Node
const crypto = require('crypto');

const partnerId = $input.first().headers['x-partner-id'];
const receivedSignature = $input.first().headers['x-webhook-signature'];
const payload = JSON.stringify($input.first().json);

// El secret viene del partner obtenido en el paso anterior
const partnerSecret = $node['GET Partner'].json.webhook_secret;

const expectedSignature = crypto
  .createHmac('sha256', partnerSecret)
  .update(payload)
  .digest('hex');

if (receivedSignature !== expectedSignature) {
  throw new Error('Invalid HMAC signature');
}

return {
  verified: true,
  partnerId: partnerId,
  event: $input.first().json
};
```

---

### 3️⃣ WORKFLOW: MCP Input Handler (Chat Externo)

**Objetivo:** Recibir mensajes desde canales externos (Telegram/Email) y procesarlos con el AI Orchestrator.

#### Diagrama del Workflow

```
┌─────────────────┐     ┌─────────────────┐
│  Telegram       │     │  Email          │
│  Trigger        │     │  Trigger        │
│  (Bot API)      │     │  (IMAP)         │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────┐
│  Normalizar Mensaje              │
│  {                               │
│    "channel": "telegram|email",  │
│    "userId": "...",              │
│    "text": "...",                │
│    "attachments": [...]          │
│  }                               │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Extraer Adjuntos (si existen)  │
│  • Descargar archivos           │
│  • Convertir a base64           │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  HTTP Request a AI Orchestrator │
│  POST /api/chat/message         │
│  {                              │
│    "message": "...",            │
│    "conversationId": "...",     │
│    "files": [...]               │
│  }                              │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  Formatear Respuesta            │
│  • Parsear markdown             │
│  • Adaptar a canal de origen    │
└────────────────┬────────────────┘
                 │
          ┌──────┴──────┐
          ▼             ▼
┌─────────────┐  ┌─────────────┐
│  Responder  │  │  Responder  │
│  Telegram   │  │  Email      │
│  (sendMsg)  │  │  (SMTP)     │
└─────────────┘  └─────────────┘
```

#### Configuración del Bot de Telegram

```json
{
  "botToken": "${TELEGRAM_BOT_TOKEN}",
  "allowedUpdates": ["message"],
  "webhookUrl": "https://tu-dominio.com/webhook/telegram"
}
```

#### Nodos n8n Requeridos

| # | Nodo | Tipo | Configuración |
|---|------|------|---------------|
| 1 | Telegram Trigger | Trigger | Recibir mensajes |
| 2 | Email Trigger | IMAP | Polling cada 5 min |
| 3 | Merge | Merge | Unificar fuentes |
| 4 | Function | Code | Normalizar mensaje |
| 5 | HTTP Request | POST | AI Orchestrator |
| 6 | Function | Code | Formatear respuesta |
| 7 | Telegram | Send | Responder |
| 8 | Send Email | SMTP | Responder |

---

### 4️⃣ WORKFLOW: Scheduled Tasks

**Objetivo:** Ejecutar tareas programadas (cron jobs) para mantenimiento y reportes.

#### Sub-workflows Programados

##### 4.1 Reporte Diario de Ventas (8:00 AM)

```
┌─────────────────┐
│  Cron Trigger   │ ← 0 8 * * * (8:00 AM diario)
│  "Reporte Diario"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GraphQL Query  │
│  Report Service │
│  salesByPeriod  │
│  (period: daily)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Function       │
│  Generar HTML   │
│  del Reporte    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Send Email     │
│  a Admin        │
│  con Reporte    │
└─────────────────┘
```

##### 4.2 Health Check de Servicios (cada 5 min)

```
┌─────────────────┐
│  Cron Trigger   │ ← */5 * * * * (cada 5 minutos)
│  "Health Check" │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  HTTP Request (paralelo)        │
│  • GET http://rest:3000/health  │
│  • GET http://auth:4001/health  │
│  • GET http://payment:3001/health│
│  • GET http://realtime:8085/health│
│  • GET http://ai:3004/health    │
└────────────────┬────────────────┘
         │
         ▼
┌─────────────────┐
│  Merge Results  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  IF alguno      │ YES │  Notificar      │
│  falló          │────▶│  Admin via WS   │
│                 │     │  y/o Email      │
└─────────────────┘     └─────────────────┘
```

##### 4.3 Limpieza de Sesiones Expiradas (medianoche)

```
┌─────────────────┐
│  Cron Trigger   │ ← 0 0 * * * (medianoche)
│  "Cleanup"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Request   │
│  DELETE         │
│  Auth Service   │
│  /cleanup       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Log resultado  │
│  en audit_logs  │
└─────────────────┘
```

##### 4.4 Recordatorios de Órdenes Pendientes (diario 10:00 AM)

```
┌─────────────────┐
│  Cron Trigger   │ ← 0 10 * * * (10:00 AM)
│  "Recordatorios"│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  HTTP Request   │
│  REST Service   │
│  GET orders     │
│  ?status=pending│
│  &olderThan=24h │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Loop: por cada │
│  orden pendiente│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Notificar WS   │
│  al vendedor    │
│  correspondiente│
└─────────────────┘
```

#### Tabla Resumen de Cron Jobs

| Tarea | Expresión Cron | Frecuencia | Acción |
|-------|----------------|------------|--------|
| Reporte Ventas | `0 8 * * *` | Diario 8AM | Email a admin |
| Health Check | `*/5 * * * *` | Cada 5 min | Alertas si falla |
| Cleanup Sesiones | `0 0 * * *` | Medianoche | Limpiar BD |
| Recordatorios | `0 10 * * *` | Diario 10AM | Notificar vendedores |
| Backup Report | `0 2 * * 0` | Domingo 2AM | Generar backup |

---

## 🔗 INTEGRACIÓN CON PILARES ANTERIORES

### Comunicación con Pilar 1 (Core REST/GraphQL/WebSocket)

| n8n Action | Endpoint | Servicio | Puerto |
|------------|----------|----------|--------|
| Crear orden | `POST /api/orders` | REST Service | 3000 |
| Actualizar estado | `PATCH /api/orders/:id` | REST Service | 3000 |
| Obtener productos | `GET /api/products` | REST Service | 3000 |
| Notificar WS | `POST /api/notify` | Realtime Service | 8085 |
| Query GraphQL | `POST /graphql` | Report Service | 4000 |

### Comunicación con Pilar 2 (Webhooks B2B)

| n8n Action | Endpoint | Servicio | Puerto |
|------------|----------|----------|--------|
| Recibir webhook partner | `POST /webhook/partner` | n8n | 5678 |
| Obtener partner | `GET /api/partners/:id` | Payment Service | 3001 |
| Enviar webhook saliente | HTTP Request a URL del partner | - | - |
| Validar firma | Función HMAC interna | n8n | - |

### Comunicación con Pilar 3 (MCP/AI)

| n8n Action | Endpoint | Servicio | Puerto |
|------------|----------|----------|--------|
| Enviar mensaje | `POST /api/chat/message` | AI Orchestrator | 3004 |
| Verificar salud | `GET /api/health` | AI Orchestrator | 3004 |

### Flujo End-to-End Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO: COMPRA COMPLETA                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 👤 Usuario navega productos (Frontend → REST Service)                   │
│                              ↓                                              │
│  2. 🛒 Agrega al carrito (Frontend → REST Service)                         │
│                              ↓                                              │
│  3. 💳 Inicia pago (Frontend → REST Service → Payment Service)             │
│                              ↓                                              │
│  4. 💰 Stripe procesa pago y envía webhook                                 │
│                              ↓                                              │
│  5. 📥 n8n recibe webhook (Payment Handler)                                │
│                              ↓                                              │
│  6. ✅ n8n valida firma y procesa                                          │
│                              ↓                                              │
│  7. 📦 n8n actualiza orden (REST Service)                                  │
│                              ↓                                              │
│  8. 🔔 n8n notifica via WebSocket (Realtime Service)                       │
│                              ↓                                              │
│  9. 📧 n8n envía email de confirmación                                     │
│                              ↓                                              │
│ 10. 🤝 n8n notifica al partner B2B (si aplica)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ REQUISITOS TÉCNICOS

### Variables de Entorno Nuevas

```env
# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=securepassword123
N8N_ENCRYPTION_KEY=your-32-char-encryption-key-here

# Telegram Bot (opcional para MCP Input)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=marketplace@espigon.com
SMTP_PASSWORD=app-password
SMTP_FROM=noreply@espigon.com

# SendGrid (alternativa a SMTP)
SENDGRID_API_KEY=your-sendgrid-api-key

# Webhook Security
N8N_WEBHOOK_SECRET=your-webhook-secret
```

### Volumen para Persistencia

```yaml
volumes:
  n8n-data:  # Nuevo volumen para n8n
  redis-data:
  postgres-data:
```

### Puertos Requeridos

| Servicio | Puerto | Propósito |
|----------|--------|-----------|
| n8n UI | 5678 | Interfaz web de n8n |
| n8n Webhooks | 5678 | Endpoints de webhook |

---

## ✅ LISTA DE TAREAS POR COMMIT

> **Instrucciones:** Completa todas las tareas de un commit antes de hacer `git add . && git commit`. Cada commit representa un entregable funcional.

---

### 📦 COMMIT 1: `feat(n8n): setup inicial de n8n en docker-compose`

**Rama:** `feature/pilar4-n8n-setup`

```bash
git checkout -b feature/pilar4-n8n-setup
```

**Tareas:**
- [ ] Agregar servicio n8n al `docker-compose.yml`
- [ ] Agregar volumen `n8n-data` en la sección volumes
- [ ] Crear archivo `.env.example` con variables de n8n
- [ ] Ejecutar `docker-compose up -d n8n`
- [ ] Verificar acceso a http://localhost:5678
- [ ] Verificar que n8n puede conectarse a la red `marketplace-network`

**Archivos modificados:**
- `docker-compose.yml`
- `.env.example`

**Comando de commit:**
```bash
git add docker-compose.yml .env.example
git commit -m "feat(n8n): setup inicial de n8n en docker-compose

- Agregado servicio n8n con imagen oficial
- Configurado volumen persistente n8n-data
- Agregadas variables de entorno para autenticación
- Puerto 5678 expuesto para UI y webhooks
- Conectado a marketplace-network"
```

---

### 📦 COMMIT 2: `feat(n8n): workflow Payment Handler básico`

**Rama:** `feature/pilar4-payment-handler`

```bash
git checkout -b feature/pilar4-payment-handler
```

**Tareas:**
- [ ] Crear workflow "Payment Handler" en n8n UI
- [ ] Configurar nodo Webhook Trigger (`POST /webhook/payment`)
- [ ] Agregar nodo Function para validar firma Stripe
- [ ] Agregar nodo IF para verificar `event.type === 'payment.success'`
- [ ] Agregar nodo HTTP Request para actualizar orden (REST Service)
- [ ] Exportar workflow como JSON
- [ ] Crear carpeta `n8n/workflows/`
- [ ] Guardar `payment-handler.json`

**Archivos creados:**
- `n8n/workflows/payment-handler.json`

**Comando de commit:**
```bash
git add n8n/
git commit -m "feat(n8n): workflow Payment Handler básico

- Webhook trigger para recibir eventos de Stripe
- Validación de firma HMAC del webhook
- Condicional para tipo de evento (success/failed)
- Llamada HTTP a REST Service para actualizar orden
- Workflow exportado como JSON"
```

---

### 📦 COMMIT 3: `feat(n8n): Payment Handler - notificaciones y email`

**Rama:** continuar en `feature/pilar4-payment-handler`

**Tareas:**
- [ ] Agregar nodo HTTP Request para notificar via WebSocket (Realtime Service)
- [ ] Configurar credenciales SMTP en n8n
- [ ] Agregar nodo Send Email con plantilla de confirmación
- [ ] Agregar nodo HTTP Request para webhook saliente a partner
- [ ] Probar flujo completo con curl o Stripe CLI
- [ ] Actualizar `payment-handler.json`

**Archivos modificados:**
- `n8n/workflows/payment-handler.json`

**Comando de commit:**
```bash
git add n8n/workflows/payment-handler.json
git commit -m "feat(n8n): Payment Handler - notificaciones y email

- Notificación WebSocket al vendedor via Realtime Service
- Envío de email de confirmación al cliente
- Webhook saliente a partner B2B suscrito
- Flujo completo: pago -> orden -> WS -> email -> partner"
```

---

### 📦 COMMIT 4: `feat(n8n): workflow Partner Handler con verificación HMAC`

**Rama:** `feature/pilar4-partner-handler`

```bash
git checkout -b feature/pilar4-partner-handler
```

**Tareas:**
- [ ] Crear workflow "Partner Handler" en n8n UI
- [ ] Configurar nodo Webhook Trigger (`POST /webhook/partner`)
- [ ] Agregar nodo HTTP Request para obtener partner (Payment Service)
- [ ] Agregar nodo Function para verificar firma HMAC
- [ ] Agregar nodo Switch para tipos de evento
- [ ] Agregar nodo Respond to Webhook para ACK
- [ ] Exportar y guardar `partner-handler.json`

**Archivos creados:**
- `n8n/workflows/partner-handler.json`

**Comando de commit:**
```bash
git add n8n/workflows/partner-handler.json
git commit -m "feat(n8n): workflow Partner Handler con verificación HMAC

- Webhook trigger para recibir eventos de partners B2B
- Obtención de datos del partner desde Payment Service
- Verificación de firma HMAC con secret del partner
- Switch node para routing por tipo de evento
- Respuesta ACK automática al partner"
```

---

### 📦 COMMIT 5: `feat(n8n): Partner Handler - handlers de eventos`

**Rama:** continuar en `feature/pilar4-partner-handler`

**Tareas:**
- [ ] Implementar handler para `delivery.completed` → actualizar orden
- [ ] Implementar handler para `delivery.in_transit` → notificar cliente
- [ ] Implementar handler para `inventory.low_stock` → notificar admin
- [ ] Implementar handler para `order.updated` → sincronizar datos
- [ ] Probar con webhook simulado (curl)
- [ ] Actualizar `partner-handler.json`

**Archivos modificados:**
- `n8n/workflows/partner-handler.json`

**Comando de commit:**
```bash
git add n8n/workflows/partner-handler.json
git commit -m "feat(n8n): Partner Handler - handlers de eventos

- Handler delivery.completed: actualiza orden como entregada
- Handler delivery.in_transit: notifica cliente via WS
- Handler inventory.low_stock: alerta a admin
- Handler order.updated: sincroniza datos con REST Service
- Probado con webhooks simulados"
```

---

### 📦 COMMIT 6: `feat(n8n): workflow MCP Input Handler - Telegram`

**Rama:** `feature/pilar4-mcp-input`

```bash
git checkout -b feature/pilar4-mcp-input
```

**Tareas:**
- [ ] Crear Bot de Telegram con @BotFather (obtener token)
- [ ] Crear workflow "MCP Input Handler" en n8n
- [ ] Configurar nodo Telegram Trigger
- [ ] Agregar nodo Function para normalizar mensaje
- [ ] Agregar nodo HTTP Request a AI Orchestrator (`POST /api/chat/message`)
- [ ] Agregar nodo Function para formatear respuesta
- [ ] Agregar nodo Telegram Send Message para responder
- [ ] Exportar y guardar `mcp-input-handler.json`
- [ ] Documentar token del bot en `.env.example`

**Archivos creados/modificados:**
- `n8n/workflows/mcp-input-handler.json`
- `.env.example` (agregar TELEGRAM_BOT_TOKEN)

**Comando de commit:**
```bash
git add n8n/workflows/mcp-input-handler.json .env.example
git commit -m "feat(n8n): workflow MCP Input Handler - Telegram

- Bot de Telegram @EspigonMarketBot configurado
- Trigger para recibir mensajes de Telegram
- Normalización de mensaje para AI Orchestrator
- Llamada HTTP al chatbot (AI Orchestrator)
- Formateo y envío de respuesta por Telegram
- Variable TELEGRAM_BOT_TOKEN documentada"
```

---

### 📦 COMMIT 7: `feat(n8n): scheduled tasks - reporte diario`

**Rama:** `feature/pilar4-scheduled-tasks`

```bash
git checkout -b feature/pilar4-scheduled-tasks
```

**Tareas:**
- [ ] Crear workflow "Daily Sales Report"
- [ ] Configurar nodo Schedule Trigger (Cron: `0 8 * * *`)
- [ ] Agregar nodo HTTP Request con GraphQL query a Report Service
- [ ] Agregar nodo Function para generar HTML del reporte
- [ ] Agregar nodo Send Email al admin
- [ ] Exportar y guardar `daily-sales-report.json`

**Archivos creados:**
- `n8n/workflows/daily-sales-report.json`

**Comando de commit:**
```bash
git add n8n/workflows/daily-sales-report.json
git commit -m "feat(n8n): scheduled tasks - reporte diario de ventas

- Cron trigger a las 8:00 AM diario
- Query GraphQL a Report Service (salesByPeriod)
- Generación de HTML con resumen de ventas
- Envío automático de email al administrador"
```

---

### 📦 COMMIT 8: `feat(n8n): scheduled tasks - health check y cleanup`

**Rama:** continuar en `feature/pilar4-scheduled-tasks`

**Tareas:**
- [ ] Crear workflow "Health Check"
  - [ ] Cron cada 5 minutos (`*/5 * * * *`)
  - [ ] HTTP requests paralelos a todos los servicios
  - [ ] Alerta por email si alguno falla
- [ ] Crear workflow "Session Cleanup"
  - [ ] Cron a medianoche (`0 0 * * *`)
  - [ ] Llamada a Auth Service para limpiar sesiones
- [ ] Crear workflow "Order Reminders"
  - [ ] Cron a las 10:00 AM (`0 10 * * *`)
  - [ ] Obtener órdenes pendientes > 24h
  - [ ] Notificar vendedores
- [ ] Exportar los 3 workflows

**Archivos creados:**
- `n8n/workflows/health-check.json`
- `n8n/workflows/session-cleanup.json`
- `n8n/workflows/order-reminders.json`

**Comando de commit:**
```bash
git add n8n/workflows/
git commit -m "feat(n8n): scheduled tasks - health check, cleanup y recordatorios

- Health Check: monitoreo cada 5 min de todos los servicios
- Session Cleanup: limpieza de sesiones expiradas a medianoche
- Order Reminders: recordatorios a vendedores 10:00 AM
- Alertas por email cuando hay problemas"
```

---

### 📦 COMMIT 9: `test(n8n): integración y pruebas end-to-end`

**Rama:** `feature/pilar4-testing`

```bash
git checkout -b feature/pilar4-testing
```

**Tareas:**
- [ ] Crear script de prueba `test_n8n_workflows.ps1`
- [ ] Probar Payment Handler con Stripe CLI o curl
- [ ] Probar Partner Handler con webhook simulado
- [ ] Probar MCP Input enviando mensaje a Telegram
- [ ] Verificar que scheduled tasks se ejecutan
- [ ] Probar flujo end-to-end completo (compra → notificación)
- [ ] Documentar resultados de pruebas

**Archivos creados:**
- `n8n/test_n8n_workflows.ps1`
- `n8n/docs/TESTING_RESULTS.md`

**Comando de commit:**
```bash
git add n8n/
git commit -m "test(n8n): integración y pruebas end-to-end

- Script de pruebas para todos los workflows
- Payment Handler: probado con Stripe CLI ✓
- Partner Handler: probado con webhook simulado ✓
- MCP Input: probado con mensaje de Telegram ✓
- Flujo end-to-end: compra completa verificada ✓
- Documentación de resultados de pruebas"
```

---

### 📦 COMMIT 10: `docs(n8n): documentación completa del Pilar 4`

**Rama:** `feature/pilar4-docs`

```bash
git checkout -b feature/pilar4-docs
```

**Tareas:**
- [ ] Crear `n8n/README.md` con guía de instalación
- [ ] Agregar screenshots de cada workflow
- [ ] Documentar variables de entorno necesarias
- [ ] Crear `n8n/credentials/credentials.example.json`
- [ ] Actualizar README principal del proyecto
- [ ] Crear colección Postman para webhooks

**Archivos creados:**
- `n8n/README.md`
- `n8n/credentials/credentials.example.json`
- `n8n/docs/screenshots/` (carpeta con imágenes)
- `n8n/postman/n8n-webhooks.postman_collection.json`

**Comando de commit:**
```bash
git add n8n/ README.md
git commit -m "docs(n8n): documentación completa del Pilar 4

- README con guía de instalación y configuración
- Screenshots de todos los workflows
- Ejemplo de credenciales
- Colección Postman para testing de webhooks
- Actualizado README principal del proyecto"
```

---

### 📦 COMMIT 11 (FINAL): `feat(pilar4): merge completo - n8n Event Bus`

**Rama:** `main` o `develop`

```bash
git checkout main
git merge feature/pilar4-n8n-setup
git merge feature/pilar4-payment-handler
git merge feature/pilar4-partner-handler
git merge feature/pilar4-mcp-input
git merge feature/pilar4-scheduled-tasks
git merge feature/pilar4-testing
git merge feature/pilar4-docs
```

**Comando de commit (si es squash):**
```bash
git commit -m "feat(pilar4): n8n Event Bus completo

🎯 Pilar 4: n8n Event Bus (15%) - COMPLETADO

Workflows implementados:
- ✅ Payment Handler: webhooks de Stripe
- ✅ Partner Handler: webhooks B2B con HMAC
- ✅ MCP Input Handler: chatbot via Telegram
- ✅ Scheduled Tasks: reportes, health check, cleanup

Integraciones:
- REST Service (3000)
- Payment Service (3001)
- Realtime Service (8085)
- AI Orchestrator (3004)
- Report Service (4000)

Documentación y testing incluidos."
```

---

## 📊 RESUMEN DE COMMITS

| # | Commit | Archivos Principales | Tiempo Est. |
|---|--------|---------------------|-------------|
| 1 | Setup n8n Docker | `docker-compose.yml` | 2-3 horas |
| 2 | Payment Handler básico | `payment-handler.json` | 2-3 horas |
| 3 | Payment Handler notificaciones | `payment-handler.json` | 2-3 horas |
| 4 | Partner Handler HMAC | `partner-handler.json` | 2-3 horas |
| 5 | Partner Handler eventos | `partner-handler.json` | 2-3 horas |
| 6 | MCP Input Telegram | `mcp-input-handler.json` | 3-4 horas |
| 7 | Scheduled: Reporte diario | `daily-sales-report.json` | 2 horas |
| 8 | Scheduled: Health/Cleanup | 3 archivos JSON | 3-4 horas |
| 9 | Testing e2e | `test_n8n_workflows.ps1` | 4-5 horas |
| 10 | Documentación | `README.md`, screenshots | 2-3 horas |
| 11 | Merge final | - | 30 min |

**Total: 11 commits | ~25-33 horas**

---

## 📅 CRONOGRAMA POR COMMITS

### Semana 1: Setup y Payment Handler (Commits 1-3)

| Día | Commit | Descripción | Horas |
|-----|--------|-------------|-------|
| Día 1 | **Commit 1** | Setup n8n en Docker | 2-3h |
| Día 2 | **Commit 2** | Payment Handler básico | 2-3h |
| Día 3 | **Commit 3** | Payment Handler + notificaciones | 2-3h |

### Semana 2: Partner Handler y MCP Input (Commits 4-6)

| Día | Commit | Descripción | Horas |
|-----|--------|-------------|-------|
| Día 4 | **Commit 4** | Partner Handler + HMAC | 2-3h |
| Día 5 | **Commit 5** | Partner Handler eventos | 2-3h |
| Día 6 | **Commit 6** | MCP Input (Telegram) | 3-4h |

### Semana 3: Scheduled Tasks y Finalización (Commits 7-11)

| Día | Commit | Descripción | Horas |
|-----|--------|-------------|-------|
| Día 7 | **Commit 7** | Reporte diario | 2h |
| Día 7 | **Commit 8** | Health/Cleanup/Reminders | 3-4h |
| Día 8 | **Commit 9** | Testing e2e | 4-5h |
| Día 9 | **Commit 10** | Documentación | 2-3h |
| Día 9 | **Commit 11** | Merge final | 30min |

**Total: 11 commits | ~25-33 horas | 9 días de trabajo**

---

## 🧪 PRUEBAS Y VALIDACIÓN

### Test 1: Payment Handler

```bash
# Simular webhook de Stripe con stripe-cli
stripe trigger payment_intent.succeeded

# O manualmente con curl
curl -X POST http://localhost:5678/webhook/payment \
  -H "Content-Type: application/json" \
  -H "stripe-signature: sha256=..." \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_123",
        "amount": 5000,
        "metadata": {
          "orderId": "order-uuid-here"
        }
      }
    }
  }'
```

### Test 2: Partner Handler

```bash
# Simular webhook de partner
curl -X POST http://localhost:5678/webhook/partner \
  -H "Content-Type: application/json" \
  -H "x-partner-id: partner-123" \
  -H "x-webhook-signature: hmac-signature-here" \
  -d '{
    "event": "delivery.completed",
    "data": {
      "orderId": "order-uuid-here",
      "deliveredAt": "2026-01-18T10:30:00Z"
    }
  }'
```

### Test 3: MCP Input (Telegram)

```
# Enviar mensaje al bot de Telegram
/start
Quiero buscar productos de pescado

# El bot debe responder con productos encontrados
```

### Test 4: Flujo End-to-End

1. Crear orden desde Frontend
2. Simular pago exitoso con Stripe CLI
3. Verificar que n8n procesa el webhook
4. Verificar actualización de orden en BD
5. Verificar notificación WebSocket en Frontend
6. Verificar email de confirmación recibido

### Criterios de Aceptación

| Criterio | Validación |
|----------|------------|
| Payment Handler funcional | Webhook de Stripe procesado correctamente |
| Partner Handler funcional | Webhook B2B verificado y procesado |
| MCP Input funcional | Mensaje de Telegram procesado por AI |
| Scheduled Tasks funcionando | Reporte diario generado y enviado |
| Integración P1 | REST/GraphQL/WS comunicándose con n8n |
| Integración P2 | Webhooks B2B pasando por n8n |
| Integración P3 | AI Orchestrator accesible desde n8n |
| Flujo end-to-end | Compra completa demostrable |

---

## 📁 ESTRUCTURA DE ARCHIVOS A CREAR

```
backend/
├── docker-compose.yml          # ← Modificar: agregar servicio n8n
├── n8n/
│   ├── workflows/
│   │   ├── payment-handler.json
│   │   ├── partner-handler.json
│   │   ├── mcp-input-handler.json
│   │   ├── daily-sales-report.json
│   │   ├── health-check.json
│   │   ├── session-cleanup.json
│   │   └── order-reminders.json
│   ├── credentials/
│   │   └── credentials.example.json
│   └── README.md
└── PILAR_4_N8N_EVENT_BUS.md    # ← Este documento
```

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **Firma HMAC:** Todos los webhooks entrantes deben verificar firma
2. **Autenticación n8n:** Usar autenticación básica o SSO
3. **HTTPS:** En producción, usar HTTPS para webhooks
4. **Secretos:** No hardcodear secretos, usar variables de entorno
5. **Rate Limiting:** Configurar límites en webhooks públicos
6. **Logs:** Mantener logs de auditoría de todos los eventos

---

## 📚 RECURSOS ADICIONALES

- [Documentación oficial de n8n](https://docs.n8n.io/)
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**Autor:** Equipo MarketPlace El Espigón  
**Fecha:** Enero 2026  
**Versión:** 1.0
