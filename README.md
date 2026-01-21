# 🏪 MarketPlace Espigón Manta
## Plataforma de Comercio Electrónico Local - Segundo Parcial

> **Conectando emprendedores locales del Parque El Espigón con compradores digitales**

---

## 📋 Índice

1. [Descripción del Proyecto](#-descripción-del-proyecto)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
4. [Pilares del Segundo Parcial](#-pilares-del-segundo-parcial)
5. [Microservicios Implementados](#-microservicios-implementados)
6. [Instalación y Configuración](#-instalación-y-configuración)
7. [Estado Actual del Proyecto](#-estado-actual-del-proyecto)
8. [Endpoints Principales](#-endpoints-principales)
9. [Integración B2B (Webhooks)](#-integración-b2b-webhooks)
10. [Equipo de Desarrollo](#-equipo-de-desarrollo)

---

## 🎯 Descripción del Proyecto

**MarketPlace Espigón Manta** es una plataforma de comercio electrónico que permite a los emprendedores del Parque El Espigón en Manta vender sus productos a través de internet. Los compradores pueden explorar productos, realizar pedidos y pagar en línea (tarjeta) o elegir métodos tradicionales (efectivo, transferencia).

### Características Principales:

- ✅ **Multi-vendedor:** Múltiples emprendedores pueden vender en la misma plataforma
- ✅ **Gestión de Inventario:** Control automático de stock por vendedor
- ✅ **Múltiples Métodos de Pago:** Tarjeta (automático), efectivo, transferencia (manual)
- ✅ **Autenticación JWT:** Sistema de tokens con refresh tokens
- ✅ **Roles de Usuario:** Admin, Vendedor, Cliente
- ✅ **WebSockets:** Notificaciones en tiempo real
- ✅ **GraphQL:** Reportes y consultas avanzadas
- ✅ **Payment Service:** Microservicio de pagos con webhooks B2B
- ✅ **Almacenamiento Cloud:** Imágenes en Supabase Storage
- ✅ **Dockerizado:** Todos los servicios en contenedores

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vue.js)                         │
│                      http://localhost:5173                        │
└────────────────┬─────────────────────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      BACKEND MICROSERVICES                        │
│                   (Docker Compose Network)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Auth Service   │  │  REST Service   │  │ Payment Service │ │
│  │    :4001        │  │     :3000       │  │     :3001       │ │
│  │                 │  │                 │  │                 │ │
│  │ • Login/Register│  │ • Products      │  │ • MockAdapter   │ │
│  │ • JWT Tokens    │  │ • Orders        │  │ • StripeAdapter │ │
│  │ • Rate Limiting │  │ • Cart          │  │ • Webhooks B2B  │ │
│  │ • Refresh Token │  │ • Inventory     │  │ • HMAC Security │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Report Service  │  │Realtime Service │  │  MCP Service    │ │
│  │    :4000        │  │     :8085       │  │     :3003       │ │
│  │                 │  │                 │  │                 │ │
│  │ • GraphQL       │  │ • WebSockets    │  │ • Tool Executor │ │
│  │ • Analytics     │  │ • Notifications │  │ • Order Creation│ │
│  │ • Python/FastAPI│  │ • Go (Gorilla)  │  │ • TS/Node.js    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                   │
│  ┌─────────────────┐           ┌─────────────────┐              │
│  │ AI Orchestrator │           │     Redis       │              │
│  │    :3004        │           │     :6379       │              │
│  │                 │           │                 │              │
│  │ • Gemini API    │           │ • Cache         │              │
│  │ • Tool Routing  │           │ • Rate Limiting │              │
│  └─────────────────┘           └─────────────────┘              │
│                                                                   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           │ PostgreSQL Connection (Pooler :6543)
                           ▼
                  ┌────────────────┐
                  │   Supabase     │
                  │   PostgreSQL   │
                  │   + Storage    │
                  └────────────────┘
```

### Flujo de Datos Típico

```
1. Cliente se registra/login → Auth Service genera JWT
2. Cliente explora productos → REST Service consulta DB
3. Cliente agrega al carrito → REST Service guarda en DB
4. Cliente hace checkout → REST Service crea orden
5. Si pago con tarjeta → REST Service llama Payment Service
6. Payment Service procesa → Envía webhook a partners (opcional)
7. Orden confirmada → WebSocket notifica en tiempo real
8. Admin consulta reportes → Report Service (GraphQL)
```

---

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Framework:** Vue.js 3 con TypeScript
- **UI Components:** Shadcn/ui (Radix Vue)
- **State Management:** Context API
- **HTTP Client:** Axios
- **WebSocket:** Native WebSocket API
- **Styling:** Tailwind CSS
- **Build Tool:** Vite

### Backend

#### REST Service (Puerto 3000)
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **ORM:** TypeORM
- **Validación:** class-validator
- **Documentación:** Swagger/OpenAPI

#### Auth Service (Puerto 4001)
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **Auth:** JWT (access + refresh tokens)
- **Rate Limiting:** Custom Redis-based
- **Hashing:** Bcrypt

#### Payment Service (Puerto 3001)
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **Payment Gateways:** 
  - MockAdapter (desarrollo)
  - StripeAdapter (producción)
- **Security:** HMAC-SHA256 para webhooks
- **Pattern:** Adapter Pattern

#### Report Service (Puerto 4000)
- **Lenguaje:** Python 3.11
- **Framework:** FastAPI + Strawberry (GraphQL)
- **Async:** httpx para peticiones HTTP
- **Validación:** Pydantic

#### Realtime Service (Puerto 8085)
- **Lenguaje:** Go 1.23
- **WebSocket:** Gorilla WebSocket
- **Redis:** go-redis/redis

#### MCP Service (Puerto 3003)
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **Purpose:** Ejecutor de herramientas para IA

#### AI Orchestrator (Puerto 3004)
- **Lenguaje:** TypeScript
- **IA:** Google Gemini 2.0 Flash
- **Purpose:** Orquestador de herramientas vía IA

### Base de Datos
- **PostgreSQL:** Supabase (puerto pooler 6543)
- **Cache:** Redis 7-alpine
- **Storage:** Supabase Storage (imágenes)

### DevOps
- **Containerización:** Docker + Docker Compose
- **Orquestación:** Docker Compose
- **Health Checks:** Implementados en todos los servicios

---

## 📚 Pilares del Segundo Parcial

### ✅ Pilar 1: Autenticación y Seguridad JWT (20%)
**Estado: COMPLETO (100%)**

- ✅ Microservicio independiente (Auth Service)
- ✅ JWT con Access Token (15 min) y Refresh Token (7 días)
- ✅ Rate limiting por endpoint
- ✅ Blacklist de tokens
- ✅ Hash seguro con Bcrypt
- ✅ Middleware de autenticación en REST Service

**Endpoints:**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/profile
```

---

### ✅ Pilar 2: Webhooks e Interoperabilidad B2B (20%)
**Estado: COMPLETO (87.5%) - Falta integración real con partners**

#### Implementado:

**1. Payment Service Wrapper (25%) - COMPLETO ✅**
- Microservicio independiente en puerto 3001
- Adapter Pattern: MockAdapter + StripeAdapter
- Endpoints de pago, reembolso, consulta de transacciones

**2. Sistema de Registro de Partners (25%) - COMPLETO ✅**
```typescript
POST /api/partners/register
{
  "name": "Partner Company",
  "webhook_url": "https://partner.com/webhooks",
  "events": ["order.created", "payment.success"]
}
```

**3. HMAC Authentication (25%) - COMPLETO ✅**
- Firma HMAC-SHA256 en todos los webhooks
- Verificación timing-safe
- Secret único por partner

**4. Envío de Webhooks (12.5%) - COMPLETO ✅**
- Retry automático (3 intentos)
- Backoff exponencial
- Logging de webhooks enviados

**5. Recepción de Webhooks (12.5%) - COMPLETO ✅**
```typescript
POST /api/webhooks/partner
Headers:
  X-Webhook-Signature: <hmac>
  X-Webhook-Event: delivery.assigned
  X-Partner-Id: 2
```

#### Pendiente:

**6. Integración Bidireccional Real (12.5%) - PENDIENTE ❌**
- Conectar con otro grupo (Delivery, Tours, Gym, etc.)
- Probar flujo completo de webhooks
- Documentar integración

**Eventos Definidos:**

**Outgoing (nosotros → partners):**
- `order.created` - Orden creada con pago exitoso
- `payment.success` - Pago procesado
- `payment.failed` - Pago rechazado
- `order.cancelled` - Orden cancelada

**Incoming (partners → nosotros):**
- `delivery.assigned` - Repartidor asignado
- `delivery.completed` - Entrega completada
- `coupon.issued` - Cupón generado
- `coupon.redeemed` - Cupón canjeado

---

### ⏳ Pilar 3: Integración de IA con MCP (30%)
**Estado: EN PROGRESO**

- ✅ MCP Service creado
- ✅ AI Orchestrator con Gemini
- ⏳ Herramientas en desarrollo
- ⏳ Chat de IA en frontend

---

### ⏳ Pilar 4: Análisis y Reportes con GraphQL (30%)
**Estado: EN PROGRESO**

- ✅ Report Service con FastAPI + Strawberry
- ✅ Schema básico de GraphQL
- ⏳ Queries avanzadas
- ⏳ Dashboard de reportes en frontend

---

## 🔧 Microservicios Implementados

### 1. Auth Service (:4001)
**Responsabilidad:** Autenticación y autorización

**Endpoints:**
```
POST /api/auth/register      - Registro de usuario
POST /api/auth/login         - Login (retorna access + refresh token)
POST /api/auth/refresh       - Renovar access token
POST /api/auth/logout        - Logout (blacklist token)
GET  /api/auth/profile       - Obtener perfil del usuario
```

**Base de Datos:**
```sql
auth_service.users (id, email, password_hash, role, name, phone)
auth_service.refresh_tokens (id, user_id, token, expires_at)
```

---

### 2. REST Service (:3000)
**Responsabilidad:** Lógica de negocio principal

**Módulos:**
- **Products:** CRUD de productos con imágenes
- **Categories:** Categorías y subcategorías
- **Inventory:** Control de stock por producto/vendedor
- **Orders:** Gestión de órdenes con estados
- **Cart:** Carrito de compras persistente
- **Sellers:** Perfil de vendedores
- **Clients:** Perfil de clientes
- **Payment Methods:** Efectivo, Transferencia, Tarjeta
- **Delivery:** Direcciones de entrega
- **Statistics:** Métricas del sistema
- **Admin:** Gestión de usuarios y roles

**Principales Endpoints:**
```
GET    /api/products              - Listar productos
POST   /api/products              - Crear producto (vendedor)
GET    /api/products/:id          - Detalle de producto
PUT    /api/products/:id          - Actualizar producto
DELETE /api/products/:id          - Eliminar producto

GET    /api/orders                - Mis órdenes (cliente)
POST   /api/orders                - Crear orden
GET    /api/seller/orders         - Órdenes del vendedor
PUT    /api/seller/orders/:id     - Confirmar/cancelar orden

GET    /api/cart                  - Ver carrito
POST   /api/cart/add              - Agregar al carrito
DELETE /api/cart/item/:id         - Remover del carrito
```

**Integración con Payment Service:**
```typescript
// En CreateOrder.ts
if (paymentMethod === 'tarjeta') {
  const result = await paymentClient.processPayment({
    orderId: order.id,
    amount: order.total,
    currency: 'USD'
  });
  
  order.transaction_id = result.transactionId;
  order.payment_status = result.status;
}
```

---

### 3. Payment Service (:3001)
**Responsabilidad:** Procesar pagos y gestionar webhooks B2B

**Arquitectura:**
```
src/
├── adapters/
│   ├── PaymentProvider.ts       # Interface
│   ├── MockAdapter.ts           # Simulación (desarrollo)
│   └── StripeAdapter.ts         # Stripe real (producción)
├── services/
│   ├── PaymentService.ts        # Factory + lógica
│   └── WebhookService.ts        # Envío de webhooks
├── routes/
│   ├── paymentRoutes.ts         # Endpoints de pago
│   ├── partnerRoutes.ts         # Registro de partners
│   └── webhookRoutes.ts         # Recepción de webhooks
└── utils/
    └── webhookSecurity.ts       # HMAC signing
```

**Endpoints:**
```
POST /api/payments/process       - Procesar pago
POST /api/payments/refund        - Reembolsar pago
GET  /api/payments/transaction/:id - Consultar transacción

POST /api/partners/register      - Registrar partner
GET  /api/partners               - Listar partners

POST /api/webhooks/partner       - Recibir webhook de partner
POST /api/webhooks/stripe        - Webhook de Stripe
```

**Base de Datos:**
```sql
transactions (
  id, order_id, amount, currency, status, provider,
  transaction_id, payment_method, created_at
)

partner (
  id_partner, name, webhook_url, secret, events[], active
)

webhook_logs (
  id, partner_id, event, payload, status, 
  direction (sent/received), response_code, created_at
)
```

**Providers Disponibles:**

**MockAdapter (Desarrollo):**
- 90% success rate
- 10% failure rate
- Delays: 500-2000ms
- No charges reales

**StripeAdapter (Producción):**
- Stripe API v2023-10-16
- Webhooks con verificación
- Test mode soportado

---

### 4. Report Service (:4000)
**Responsabilidad:** Reportes y analytics vía GraphQL

**Schema:**
```graphql
type Order {
  id_order: Int!
  status: String!
  total: Float!
  payment_status: String
  transaction_id: String
  created_at: String!
  client: Client!
  products: [Product!]!
}

type Query {
  orders(limit: Int, offset: Int): [Order!]!
  orderById(id: Int!): Order
  statistics: Statistics!
}
```

**Endpoint:**
```
POST /graphql
```

---

### 5. Realtime Service (:8085)
**Responsabilidad:** WebSockets para notificaciones en tiempo real

**Eventos:**
```javascript
// Cliente se conecta
ws://localhost:8085?token=<jwt>

// Servidor envía:
{
  "type": "order_status_update",
  "data": {
    "order_id": 123,
    "new_status": "confirmed"
  }
}

{
  "type": "new_order",
  "data": {
    "order_id": 124,
    "seller_id": 5
  }
}
```

**Tecnología:** Go + Gorilla WebSocket + Redis PubSub

---

### 6. MCP Service (:3003)
**Responsabilidad:** Ejecutar herramientas para IA

**Tools Disponibles:**
```
- crear_orden
- consultar_productos
- consultar_inventario
- obtener_estadisticas
```

---

### 7. AI Orchestrator (:3004)
**Responsabilidad:** Orquestar IA con Gemini

**Endpoint:**
```
POST /api/chat
{
  "message": "¿Cuántos productos hay?",
  "conversationId": "uuid"
}
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js:** v20 o superior
- **Python:** 3.11 o superior
- **Go:** 1.23 o superior (opcional, para realtime service)
- **Docker:** 20.10 o superior
- **Docker Compose:** v2 o superior
- **PostgreSQL:** Supabase account (gratis)
- **Redis:** (incluido en docker-compose)

---

### Opción 1: Con Docker Compose (Recomendado)

#### 1. Clonar repositorio
```bash
git clone <repo-url>
cd MarketPlace_Espigon_Manta
```

#### 2. Configurar variables de entorno

**Crear `backend/.env`:**
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

**Variables críticas:**
```dotenv
# Database (Supabase)
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=6543
DB_USERNAME=postgres.tu_proyecto
DB_PASSWORD=tu_contraseña
DB_DATABASE=postgres

# JWT
JWT_SECRET=clave_secreta_minimo_32_caracteres

# Supabase Storage
SUPABASE_URL=https://tu_proyecto.supabase.co
SUPABASE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key

# Admin inicial
ADMIN_EMAIL=admin@espigon.com
ADMIN_PASSWORD=tu_password_seguro

# Payment
PAYMENT_PROVIDER=mock
INTERNAL_API_KEY=genera_una_clave_secreta
```

#### 3. Levantar todos los servicios
```bash
docker-compose up -d --build
```

#### 4. Verificar que estén corriendo
```bash
docker-compose ps
```

Deberías ver:
```
✅ auth-service        - Up (healthy)
✅ rest-service        - Up (healthy)
✅ payment-service     - Up (healthy)
✅ report-service      - Up (healthy)
✅ realtime-service    - Up (healthy)
✅ mcp-service         - Up (healthy)
✅ ai-orchestrator     - Up (healthy)
✅ marketplace-redis   - Up (healthy)
```

#### 5. Configurar Frontend

```bash
cd ../frontend
cp .env.example .env
```

**Editar `frontend/.env`:**
```dotenv
VITE_API_URL=http://localhost:3000/api
VITE_AUTH_SERVICE_URL=http://localhost:4001
VITE_WS_URL=ws://localhost:8085
VITE_REPORT_SERVICE_URL=http://localhost:4000/graphql
```

#### 6. Instalar dependencias y ejecutar
```bash
npm install
npm run dev
```

#### 7. Abrir navegador
```
http://localhost:5173
```

---

### Opción 2: Desarrollo Local (Sin Docker)

#### 1. Instalar dependencias de cada servicio

```bash
# Auth Service
cd backend/auth_service
npm install

# REST Service
cd ../rest_service
npm install

# Payment Service
cd ../payment_service
npm install

# MCP Service
cd ../mcp_service
npm install

# AI Orchestrator
cd ../ai_orchestrator
npm install

# Report Service
cd ../report_service
pip install -r requirements.txt

# Realtime Service
cd ../realtime_service
go mod download
```

#### 2. Configurar `.env` en cada servicio

**IMPORTANTE:** En desarrollo local, las URLs deben apuntar a `localhost`:

```dotenv
# En cada servicio
REST_SERVICE_URL=http://localhost:3000
PAYMENT_SERVICE_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
```

#### 3. Ejecutar cada servicio en terminales separadas

```bash
# Terminal 1 - Auth Service
cd backend/auth_service
npm run dev

# Terminal 2 - REST Service
cd backend/rest_service
npm run dev

# Terminal 3 - Payment Service
cd backend/payment_service
npm run dev

# Terminal 4 - Report Service
cd backend/report_service
uvicorn app.main:app --reload --port 4000

# Terminal 5 - Realtime Service
cd backend/realtime_service
go run cmd/api/main.go

# Terminal 6 - Frontend
cd frontend
npm run dev
```

---

## 📊 Estado Actual del Proyecto

### Funcionalidades Completadas ✅

**Autenticación:**
- [x] Registro de usuarios (Cliente/Vendedor)
- [x] Login con JWT
- [x] Refresh tokens
- [x] Rate limiting
- [x] Middleware de autenticación

**Productos:**
- [x] CRUD completo
- [x] Upload de imágenes a Supabase
- [x] Categorías y subcategorías
- [x] Búsqueda y filtros

**Inventario:**
- [x] Control de stock por producto
- [x] Actualización automática al vender
- [x] Alertas de stock bajo

**Carrito:**
- [x] Agregar/quitar productos
- [x] Persistencia en BD
- [x] Cálculo automático de totales

**Órdenes:**
- [x] Crear orden desde carrito
- [x] Estados: pending, confirmed, cancelled, delivered
- [x] Confirmación manual (efectivo/transferencia)
- [x] Confirmación automática (tarjeta)

**Pagos:**
- [x] Payment Service independiente
- [x] MockAdapter (desarrollo)
- [x] StripeAdapter (producción)
- [x] Integración con REST Service
- [x] Campos de pago en Order (transaction_id, payment_status)

**Webhooks B2B:**
- [x] Sistema de partners
- [x] HMAC security
- [x] Envío de webhooks con retry
- [x] Recepción de webhooks
- [ ] Integración real con otro grupo

**Reportes:**
- [x] Report Service con GraphQL
- [x] Consulta de órdenes
- [ ] Dashboard completo

**WebSockets:**
- [x] Realtime Service
- [x] Notificaciones en tiempo real
- [ ] Frontend conectado

---

### En Desarrollo 🚧

- [ ] Sistema de cupones cruzados B2B
- [ ] Dashboard de analytics completo
- [ ] Integración con IA (MCP + Gemini)
- [ ] Chat de soporte con IA
- [ ] Notificaciones push

---

### Roadmap 🗺️

**Semana 1-2 (Actual):**
- [x] Completar Pilar 1 (Auth)
- [x] Completar Pilar 2 (Webhooks) - 87.5%
- [ ] Conectar con grupo partner para webhooks bidireccionales

**Semana 3-4:**
- [ ] Completar Pilar 3 (IA con MCP)
- [ ] Completar Pilar 4 (Reportes GraphQL)

**Semana 5:**
- [ ] Testing completo
- [ ] Documentación final
- [ ] Preparar presentación

---

## 🔗 Endpoints Principales

### Auth Service (:4001)

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "phone": "0987654321",
  "role": "client"
}

Response 201:
{
  "user": {
    "id": 1,
    "email": "cliente@example.com",
    "name": "Juan Pérez",
    "role": "client"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "password123"
}

Response 200:
{
  "user": {...},
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### REST Service (:3000)

```http
GET /api/products?limit=10&offset=0
Authorization: Bearer <token>

Response 200:
{
  "products": [
    {
      "id_product": 1,
      "name": "Camiseta Azul",
      "description": "Camiseta de algodón",
      "price": 25.00,
      "image_url": "https://...",
      "seller": {
        "id_seller": 1,
        "name": "Tienda de Ropa"
      },
      "inventory": {
        "available_quantity": 50
      }
    }
  ],
  "total": 100
}
```

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "cart_items": [1, 2, 3],
  "payment_method_id": 1,
  "delivery_address": "Av. 4 de Noviembre, Manta",
  "delivery_city": "Manta"
}

Response 201:
{
  "order": {
    "id_order": 123,
    "status": "confirmed",
    "total": 75.50,
    "transaction_id": "txn_abc123",
    "payment_status": "success"
  }
}
```

---

### Payment Service (:3001)

```http
POST /api/payments/process
Content-Type: application/json

{
  "orderId": 123,
  "customerId": 45,
  "amount": 75.50,
  "currency": "USD",
  "description": "Orden #123"
}

Response 200:
{
  "success": true,
  "transactionId": "txn_abc123",
  "amount": 75.50,
  "status": "completed"
}
```

---

### Report Service (:4000)

```graphql
POST /graphql
Content-Type: application/json

{
  "query": "{ orders(limit: 10) { id_order total status created_at } }"
}

Response 200:
{
  "data": {
    "orders": [
      {
        "id_order": 123,
        "total": 75.50,
        "status": "confirmed",
        "created_at": "2026-01-18T10:30:00Z"
      }
    ]
  }
}
```

---

## 🤝 Integración B2B (Webhooks)

### Para Integrar con Nuestro MarketPlace

Si eres de otro grupo y quieres integrar tu servicio (Delivery, Tours, Gym, etc.) con nosotros:

#### 1. Registrarte en nuestro sistema

```http
POST http://[NUESTRA_IP]:3001/api/partners/register
Content-Type: application/json

{
  "name": "Tu Empresa",
  "webhook_url": "https://tu-dominio.com/webhooks/marketplace",
  "events": ["order.created", "payment.success"]
}
```

**Recibirás:**
```json
{
  "partner_id": 2,
  "secret": "8f3d9a2b1c4e5f...",
  "webhook_url": "https://tu-dominio.com/webhooks/marketplace"
}
```

⚠️ **Guarda el `secret` de forma segura** - lo necesitas para verificar nuestros webhooks.

#### 2. Implementar endpoint para recibir nuestros webhooks

```typescript
import crypto from 'crypto';

app.post('/webhooks/marketplace', (req, res) => {
  // 1. Verificar firma HMAC
  const signature = req.headers['x-webhook-signature'];
  const secret = 'TU_SECRET_RECIBIDO';
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Firma inválida' });
  }
  
  // 2. Procesar evento
  const { event, data } = req.body;
  
  if (event === 'order.created') {
    // Asignar repartidor, crear reserva, etc.
    console.log('Nueva orden:', data.order_id);
  }
  
  // 3. Responder OK
  res.json({ received: true });
});
```

#### 3. Enviarnos webhooks de vuelta

```typescript
const notifyMarketplace = async (event, data) => {
  const payload = { event, data, timestamp: new Date().toISOString() };
  
  const signature = crypto
    .createHmac('sha256', 'TU_SECRET')
    .update(JSON.stringify(payload))
    .digest('hex');
  
  await axios.post('http://[NUESTRA_IP]:3001/api/webhooks/partner', payload, {
    headers: {
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event,
      'X-Partner-Id': '2'
    }
  });
};

// Ejemplo: notificar que asignaste repartidor
await notifyMarketplace('delivery.assigned', {
  order_id: 123,
  driver: {
    id: 67,
    name: 'Carlos Mendoza',
    phone: '+593998765432'
  }
});
```

---

### Documentación Completa

- **[INTEGRATION_GUIDE.md](backend/payment_service/INTEGRATION_GUIDE.md)** - Guía completa de integración
- **[COUPON_SYSTEM_EXAMPLE.md](backend/payment_service/COUPON_SYSTEM_EXAMPLE.md)** - Sistema de cupones cruzados
- **[DOCKER_SETUP.md](backend/DOCKER_SETUP.md)** - Setup de Docker Compose

---

## 👥 Equipo de Desarrollo

**Proyecto:** MarketPlace Espigón Manta  
**Institución:** ULEAM - Facultad de Ingeniería  
**Materia:** Desarrollo de Software  
**Período:** Segundo Parcial 2026

**Integrantes:**
- [Nombre 1] - Backend (REST Service, Auth Service)
- [Nombre 2] - Frontend (Vue.js)
- [Nombre 3] - Payment Service, Webhooks
- [Nombre 4] - Report Service, Analytics
- [Nombre 5] - DevOps, Docker

---

## 📞 Contacto

**Para integración B2B:**
- Email: [email del equipo]
- WhatsApp: [número del equipo]
- GitHub: [enlace al repo]
- IP del servidor: [tu IP para webhooks]

**Horarios de disponibilidad:**
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sábados: 10:00 AM - 2:00 PM

---

## 📝 Notas Importantes

### Diferencias entre Docker y Local

**URLs dentro de Docker:**
```
REST_SERVICE_URL=http://rest-service:3000
PAYMENT_SERVICE_URL=http://payment-service:3001
REDIS_URL=redis://redis:6379
```

**URLs en desarrollo local:**
```
REST_SERVICE_URL=http://localhost:3000
PAYMENT_SERVICE_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
```

### Credenciales de Admin

Después de levantar el proyecto, puedes entrar con:
```
Email: admin@espigon.com
Password: [el que pusiste en ADMIN_PASSWORD]
```

### Puertos Usados

```
3000  - REST Service
3001  - Payment Service
3003  - MCP Service
3004  - AI Orchestrator
4000  - Report Service (GraphQL)
4001  - Auth Service
5173  - Frontend (Vue.js)
6379  - Redis
8085  - Realtime Service (WebSocket)
```

### Health Checks

Verifica que todo esté funcionando:

```bash
curl http://localhost:3000/health
curl http://localhost:4001/health
curl http://localhost:3001/health
curl http://localhost:4000/
curl http://localhost:8085/health
```

---

## 🐛 Troubleshooting

### Problema: Servicios no se conectan entre sí

**Solución:**
```bash
# Ver logs
docker-compose logs -f [servicio]

# Verificar red
docker network inspect backend_marketplace-network

# Reiniciar servicio específico
docker-compose restart rest-service
```

### Problema: Base de datos no conecta

**Solución:**
- Verifica credenciales en `.env`
- Usa puerto 6543 (pooler) no 5432
- Revisa whitelist de IP en Supabase

### Problema: Frontend muestra errores CORS

**Solución:**
- Verifica que REST Service tenga configurado CORS para `http://localhost:5173`
- Revisa headers `Access-Control-Allow-Origin`

---

## 📚 Recursos Adicionales

- **Swagger UI:** http://localhost:3000/api-docs
- **GraphQL Playground:** http://localhost:4000/graphql
- **Redis Commander:** (instalar si necesitas visualizar Redis)
- **Postman Collection:** [docs/MarketPlace.postman_collection.json]

---

## 🎉 ¡Listo para Integrar!

Ahora que conoces toda la arquitectura del proyecto, puedes:

1. ✅ Levantar el proyecto con Docker Compose
2. ✅ Entender cómo funciona cada microservicio
3. ✅ Registrar tu servicio como partner
4. ✅ Implementar webhooks bidireccionales
5. ✅ Probar la integración completa

**¿Preguntas?** Contáctanos por los canales mencionados arriba.

---

**Última actualización:** 18 de Enero, 2026  
**Versión:** 1.0.0  
**Estado:** En Desarrollo Activo 🚀
