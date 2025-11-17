# 🚀 Backend - MarketPlace Espigón Manta

## 📋 Descripción General

El **backend** del MarketPlace Espigón Manta es una **arquitectura de microservicios** robusta y escalable que combina tres servicios especializados trabajando en conjunto para proporcionar todas las funcionalidades del marketplace. Esta arquitectura permite separación de responsabilidades, escalabilidad independiente y mejor mantenibilidad.

## 🏗️ Arquitectura de Microservicios

El backend está compuesto por **tres servicios principales**, cada uno con su propósito específico:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                   (React + TypeScript)                       │
└────────┬─────────────────┬──────────────────┬───────────────┘
         │                 │                  │
         │ REST API        │ GraphQL          │ WebSocket
         ▼                 ▼                  ▼
┌────────────────┐  ┌───────────────┐  ┌──────────────────┐
│  REST SERVICE  │  │ REPORT SERVICE│  │ REALTIME SERVICE │
│  (Node.js/TS)  │  │ (Python/FastAPI)│ │    (Go)          │
│                │  │                │  │                  │
│  Puerto: 3000  │  │  Puerto: 4000  │  │  Puerto: 8080    │
└────────┬───────┘  └───────┬───────┘  └────────┬─────────┘
         │                  │                    │
         │ TypeORM          │ HTTP Client        │ Redis Pub/Sub
         ▼                  ▼                    ▼
┌─────────────────┐  ┌────────────────┐  ┌──────────────┐
│   PostgreSQL    │  │   PostgreSQL   │  │    Redis     │
│   (Base Datos)  │◄─┤  (Read Only)   │  │  (Pub/Sub)   │
└─────────────────┘  └────────────────┘  └──────────────┘
         ▲
         │
         └──────────── Supabase Storage (Archivos)
```

## 🎯 Servicios del Backend

### 1️⃣ REST Service - Servicio Principal (Node.js/TypeScript)

**📂 Ubicación:** `/backend/rest_service`

**🎯 Propósito:** 
Servicio principal del backend que maneja toda la lógica de negocio central, autenticación, gestión de base de datos y operaciones CRUD.

**🔧 Tecnologías:**
- **Node.js** + **TypeScript** 5.9.2
- **Express** 5.1.0
- **TypeORM** (ORM)
- **PostgreSQL** (Base de datos)
- **JWT** (Autenticación)
- **Bcrypt** (Hash de contraseñas)
- **Supabase** (Storage de archivos)
- **Redis** (Caché y sesiones)
- **Swagger** (Documentación)

**⚡ Funcionalidades:**
- ✅ API REST completa (~50 endpoints)
- ✅ Autenticación y autorización (JWT + roles)
- ✅ CRUD de todas las entidades (13 entidades)
- ✅ Sistema de pagos y transferencias
- ✅ Gestión de inventario
- ✅ Procesamiento de pedidos
- ✅ Carga de archivos (imágenes)
- ✅ Validación de datos (DTOs)
- ✅ Sistema de limpieza automática
- ✅ Tareas programadas (cron jobs)
- ✅ Documentación Swagger

**🌐 Puerto:** 3000

**📚 Documentación:** Ver `rest_service/README.md`

**🗂️ Estructura:**
```
rest_service/
├── src/
│   ├── domain/           # Entidades y reglas de negocio
│   ├── application/      # Casos de uso y DTOs
│   ├── infrastructure/   # Implementaciones técnicas
│   └── main/            # Punto de entrada
├── config/              # Configuración
├── swagger/             # Documentación API
└── readmes/             # Documentación adicional
```

---

### 2️⃣ Report Service - Servicio de Reportes (Python/FastAPI)

**📂 Ubicación:** `/backend/report_service`

**🎯 Propósito:** 
Servicio especializado en consultas analíticas, generación de reportes y estadísticas complejas sin afectar el rendimiento del servicio principal.

**🔧 Tecnologías:**
- **Python** 3.9+
- **FastAPI** 0.109.0
- **Strawberry GraphQL** 0.209.0
- **Uvicorn** (Servidor ASGI)
- **HTTPX** (Cliente HTTP)
- **Pydantic** (Validación)

**⚡ Funcionalidades:**
- ✅ API GraphQL flexible
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Reporte de ventas por período
- ✅ Top vendedores y productos más vendidos
- ✅ Análisis por categorías
- ✅ Reporte de clientes (segmentación)
- ✅ Alertas de inventario bajo
- ✅ Consultas optimizadas (solo lectura)

**🌐 Puerto:** 4000

**📚 Documentación:** Ver `report_service/README.md`

---

### 3️⃣ Realtime Service - Servicio de Tiempo Real (Go)

**📂 Ubicación:** `/backend/realtime_service`

**🎯 Propósito:** 
Servicio de comunicación en tiempo real mediante WebSockets para notificaciones instantáneas, actualizaciones de estado y sincronización de eventos.

**🔧 Tecnologías:**
- **Go** 1.23+
- **Gorilla WebSocket** 1.5.3
- **Redis** 9.7.0 (Pub/Sub)
- **JWT** 4.5.2 (Autenticación)
- **Docker** (Contenerización)

**⚡ Funcionalidades:**
- ✅ Conexiones WebSocket persistentes
- ✅ Autenticación JWT
- ✅ Sistema de salas (rooms) por tema
- ✅ Control de acceso por roles
- ✅ Redis Pub/Sub para sincronización multi-instancia
- ✅ Notificaciones en tiempo real
- ✅ Actualizaciones de pedidos
- ✅ Alertas de inventario
- ✅ Mensajes broadcast
- ✅ Escalabilidad horizontal

**🌐 Puerto:** 8080

**📚 Documentación:** Ver `realtime_service/README.md`

---

## 🔄 Comunicación entre Servicios

### REST → Realtime (HTTP)

Cuando ocurre un evento importante, REST Service notifica al Realtime Service:

```typescript
// En REST Service (Node.js)
await axios.post('http://localhost:8080/api/notifications/send', {
  userId: seller.id,
  type: 'new_order',
  room: 'orders',
  payload: {
    orderId: order.id,
    total: order.total,
    items: order.items.length
  }
});
```

### Report → REST (HTTP)

Report Service consulta datos del REST Service:

```python
# En Report Service (Python)
async with httpx.AsyncClient() as client:
    response = await client.get('http://localhost:3000/api/orders')
    orders = response.json()
    
# Procesar datos para reportes
return analyze_sales(orders)
```

### Realtime → Realtime (Redis Pub/Sub)

Múltiples instancias del Realtime Service se sincronizan vía Redis:

```go
// Instancia 1 recibe evento HTTP
hub.Publish("realtime:orders", message)

// Instancia 2 recibe vía Redis Pub/Sub
redis.Subscribe("realtime:orders", func(msg) {
    hub.Broadcast(msg)
})
```

## 🗄️ Base de Datos

### PostgreSQL - Base de Datos Principal

**Gestión:** TypeORM (REST Service)

**13 Tablas Principales:**

| Tabla | Descripción | Relaciones |
|-------|-------------|------------|
| `admins` | Administradores | - |
| `clients` | Clientes | → orders, carts |
| `sellers` | Vendedores | → products, inventories |
| `categories` | Categorías | → subcategories |
| `subcategories` | Subcategorías | → products |
| `products` | Productos | → seller, subcategories, inventories |
| `inventories` | Control de stock | → product |
| `carts` | Carritos | → client, product_carts |
| `product_carts` | Items en carrito | → cart, product |
| `orders` | Pedidos | → client, product_orders, delivery |
| `product_orders` | Items en pedido | → order, product |
| `deliveries` | Entregas | → order |
| `payment_methods` | Métodos de pago | → orders |

**Características:**
- Primary keys UUID
- Timestamps automáticos (created_at, updated_at)
- Soft deletes (deleted_at)
- Índices optimizados
- Foreign keys con cascada
- Validaciones a nivel BD

### Redis - Caché y Pub/Sub

**Usos:**

1. **Caché** (REST Service):
   - Sesiones de usuario
   - Datos frecuentes (categorías, productos)
   - Rate limiting

2. **Pub/Sub** (Realtime Service):
   - Sincronización entre instancias
   - Distribución de eventos
   - Broadcast de notificaciones

### Supabase Storage - Archivos

**Gestión:** REST Service

**Almacenamiento de:**
- Imágenes de productos
- Fotos de perfil
- Documentos de vendedores
- Archivos temporales

## 🔐 Seguridad y Autenticación

### Sistema JWT

**Generación:** REST Service

**Estructura del token:**
```json
{
  "userId": "uuid-del-usuario",
  "email": "user@example.com",
  "role": "client|seller|admin",
  "iat": 1234567890,
  "exp": 1234599890
}
```

**Validación:**
- REST Service: Middleware de autenticación
- Realtime Service: Validación en conexión WebSocket
- Report Service: No requiere (consultas internas)

### Control de Roles

| Rol | REST Service | Realtime Service | Report Service |
|-----|--------------|------------------|----------------|
| **admin** | Acceso total | Todas las salas | Todos los reportes |
| **seller** | Productos, inventario | Salas: orders, inventory | Reportes propios |
| **client** | Compras, perfil | Salas: notifications, cart | No acceso |

### Medidas de Seguridad

- ✅ **Passwords hasheados** (bcrypt, 10 rounds)
- ✅ **JWT con expiración** (7 días)
- ✅ **CORS configurado** (orígenes permitidos)
- ✅ **Rate limiting** (prevenir ataques)
- ✅ **Validación de inputs** (DTOs, class-validator)
- ✅ **SQL injection prevention** (TypeORM, prepared statements)
- ✅ **XSS protection** (sanitización de datos)
- ✅ **HTTPS** (producción)

## 🚀 Despliegue y Configuración

### Variables de Entorno Globales

Crear archivo `.env` en cada servicio:

#### REST Service (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=marketplace

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_key

# Redis
REDIS_URL=redis://localhost:6379

# Services
REALTIME_SERVICE_URL=http://localhost:8080
REPORT_SERVICE_URL=http://localhost:4000

# Server
PORT=3000
NODE_ENV=development
```

#### Report Service (.env)
```env
# REST Service
REST_API_URL=http://localhost:3000

# Server
HOST=127.0.0.1
PORT=4000

# CORS
CORS_ORIGINS=http://localhost:5173
```

#### Realtime Service (.env)
```env
# JWT
JWT_SECRET=your_super_secret_key

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173
```

### Instalación y Ejecución

#### Opción 1: Ejecución Individual

```bash
# 1. Iniciar PostgreSQL y Redis
# (usando Docker o instalación local)

# 2. REST Service
cd backend/rest_service
npm install
npm run typeorm migration:run
npm run seed
npm run dev

# 3. Report Service
cd backend/report_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app/main.py

# 4. Realtime Service
cd backend/realtime_service
go mod download
go run cmd/api/main.go
```

#### Opción 2: Docker Compose (Recomendado)

```bash
# En la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Orden de Inicialización

1. **PostgreSQL** (Base de datos)
2. **Redis** (Caché y Pub/Sub)
3. **REST Service** (Servicio principal)
4. **Report Service** (Depende de REST)
5. **Realtime Service** (Depende de Redis)

### Health Checks

```bash
# REST Service
curl http://localhost:3000/health

# Report Service
curl http://localhost:4000/health

# Realtime Service
curl http://localhost:8080/health
```

## 📊 Monitoreo y Logs

### Logs por Servicio

**REST Service:**
- Logs de Express (requests/responses)
- Logs de TypeORM (queries SQL)
- Logs de errores (stack traces)

**Report Service:**
- Logs de Uvicorn (requests)
- Logs de queries GraphQL
- Logs de análisis de datos

**Realtime Service:**
- Logs de conexiones WebSocket
- Logs de Pub/Sub (Redis)
- Logs de autenticación

## 🧪 Testing

### REST Service

```bash
cd backend/rest_service

# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests E2E
npm run test:e2e
```

### Report Service

```bash
cd backend/report_service

# Tests con pytest
pytest

# Con cobertura
pytest --cov=app
```

### Realtime Service

```bash
cd backend/realtime_service

# Tests
go test ./...

# Con cobertura
go test -cover ./...
```

