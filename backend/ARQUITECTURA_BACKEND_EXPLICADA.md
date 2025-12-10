# 🏗️ ARQUITECTURA DEL BACKEND - MARKETPLACE ESPIGÓN MANTA

> **Guía Conceptual** - Explicación de cómo funcionan los 3 servicios del backend y cómo se relacionan entre sí.

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General](#-visión-general)
2. [Rest Service](#-rest-service-nodejs--typescript)
3. [Realtime Service](#-realtime-service-go)
4. [Report Service](#-report-service-python)
5. [Cómo se Relacionan](#-cómo-se-relacionan-los-servicios)
6. [Flujo de Datos Completo](#-flujo-de-datos-completo)

---

## 🌐 VISIÓN GENERAL

### ¿Por qué 3 servicios separados?

El backend está dividido en **3 microservicios** independientes, cada uno con una responsabilidad específica:

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│              (React + TypeScript)                        │
└────────┬──────────────┬──────────────┬──────────────────┘
         │              │              │
         │ HTTP REST    │ WebSocket    │ GraphQL
         │              │              │
    ┌────▼───┐     ┌────▼────┐    ┌───▼─────┐
    │  REST  │────▶│ REALTIME │    │ REPORT  │
    │SERVICE │     │ SERVICE  │    │ SERVICE │
    │        │     │          │    │         │
    │Node.js │     │    Go    │    │ Python  │
    └────┬───┘     └────┬─────┘    └────┬────┘
         │              │               │
         │         ┌────▼────┐          │
         │         │  REDIS  │          │
         │         └─────────┘          │
         │                              │
    ┌────▼──────────────────────────────▼────┐
    │         PostgreSQL                      │
    └─────────────────────────────────────────┘
```

### Responsabilidades:

| Servicio | Lenguaje | Puerto | Función Principal |
|----------|----------|--------|-------------------|
| **REST Service** | TypeScript (Node.js) | 3000 | CRUD, lógica de negocio, base de datos |
| **Realtime Service** | Go | 8085 | WebSockets, notificaciones en tiempo real |
| **Report Service** | Python | 4000 | Reportes, análisis, estadísticas (GraphQL) |

---

## 🔵 REST SERVICE (Node.js + TypeScript)

### ¿Qué hace?

Es el **cerebro principal** del sistema. Maneja toda la lógica de negocio, CRUD de datos y validaciones.

### Arquitectura: Clean Architecture

Se organiza en capas que **NO dependen unas de otras** hacia adentro:

```
Frontend → Infrastructure → Application → Domain
                ↓               ↓           ↓
           (HTTP/DB)        (Casos Uso)  (Entidades)
```

#### Capas explicadas:

**1. Domain (Dominio)** - El corazón del negocio
```
domain/
├── entities/          # Objetos del negocio (Product, Order, Client)
└── repositories/      # Interfaces (contratos) de acceso a datos
```

- **NO tiene dependencias** externas
- Define **QUÉ es** cada cosa (Product, Client, Order)
- Define **contratos** de cómo acceder a datos (sin implementación)

**2. Application (Aplicación)** - La lógica
```
application/
├── dtos/             # Datos que entran/salen (CreateProduct, LoginClient)
├── use_cases/        # Lógica de negocio (CreateOrder, UpdateStock)
└── mappers/          # Conversión entre DTOs y Entidades
```

- Contiene **casos de uso**: "Crear orden", "Actualizar producto"
- Usa **DTOs** para validar datos de entrada
- **NO sabe** si usa MySQL, PostgreSQL, o archivos JSON

Ejemplo conceptual:
```typescript
// CreateOrder.ts - Caso de uso
class CreateOrder {
  execute(orderData) {
    // 1. Validar datos
    // 2. Verificar stock
    // 3. Calcular total
    // 4. Crear orden
    // 5. Actualizar inventario
  }
}
```

**3. Infrastructure (Infraestructura)** - Los detalles técnicos
```
infrastructure/
├── database/         # TypeORM + PostgreSQL
├── http/            # Express routes
├── repositories/    # Implementación de repositories (acceso a DB)
├── middlewares/     # Auth, validación, errores
└── storage/         # Manejo de archivos (Cloudinary)
```

- **Implementa** los contratos del Domain
- Conoce **cómo** guardar en PostgreSQL
- Expone **rutas HTTP** (REST API)

**4. Models** - Definición de tablas
```
models/
├── clientModel.ts    # Tabla clients
├── productModel.ts   # Tabla products
├── orderModel.ts     # Tabla orders
└── ...
```

- Usa **TypeORM** para definir estructura de DB
- Ejemplo: `@Entity() class Product { @Column() name: string }`

### ¿Cómo funciona?

#### Flujo de una petición:

```
1. Cliente Frontend hace: POST /api/orders
   Body: { client_id, cart_id, payment_method }

2. Llega a: infrastructure/http/routes/orderRoutes.ts
   → Middleware de autenticación (verifica token JWT)

3. Controller llama: application/use_cases/CreateOrder.ts
   → Valida datos con DTO
   → Ejecuta lógica de negocio

4. Use case usa: domain/repositories/OrderRepository (interfaz)
   → Implementado por infrastructure/repositories/OrderRepositoryImpl

5. Repository guarda en PostgreSQL usando TypeORM

6. Respuesta sube por las capas hasta el cliente

7. ADEMÁS: Publica evento en Redis para notificar cambios
```

### Tecnologías clave:

- **Express**: Framework HTTP
- **TypeORM**: ORM para PostgreSQL
- **JWT**: Autenticación
- **bcrypt**: Encriptación de contraseñas
- **Multer**: Subida de archivos
- **Redis**: Publicación de eventos

### Ventajas de esta arquitectura:

✅ **Testeable**: Puedes probar lógica sin base de datos  
✅ **Mantenible**: Cambios en DB no afectan lógica de negocio  
✅ **Escalable**: Fácil agregar nuevas features  
✅ **Independiente**: No depende de frameworks específicos  

---

## 🟢 REALTIME SERVICE (Go)

### ¿Qué hace?

Maneja las **conexiones WebSocket** para comunicación en tiempo real entre el servidor y los clientes.

### Arquitectura: Hub Pattern

```
                    ┌─────────────┐
                    │     HUB     │  ← Orquestador central
                    │ (Gestiona   │
                    │  conexiones)│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌─────▼─────┐     ┌─────▼─────┐
   │ Client1 │       │  Client2  │     │  Client3  │
   │WebSocket│       │ WebSocket │     │ WebSocket │
   └─────────┘       └───────────┘     └───────────┘
        ↓                  ↓                  ↓
    Usuario A          Usuario B           Admin
```

### Componentes principales:

#### 1. **Hub** (`hub.go`)
El **cerebro** que coordina todo:

- Mantiene registro de **todos los clientes conectados**
- Gestiona **salas** (rooms): grupos de usuarios
- Distribuye **mensajes** entre clientes
- Sincroniza con **Redis Pub/Sub** para múltiples instancias

```go
// Concepto simplificado
type Hub struct {
    clients map[string]*Client      // Usuarios conectados
    rooms   map[string][]*Client    // Salas y sus miembros
}

// Ejemplo: Enviar a una sala
hub.BroadcastRoom("order-123", mensaje)
```

#### 2. **Client** (`client.go`)
Representa una **conexión WebSocket individual**:

```go
type Client struct {
    ID       string              // Identificador único
    UserID   string              // ID del usuario autenticado
    Role     string              // ADMIN, SELLER, CLIENT
    SellerID string              // Si es vendedor
    Conn     *websocket.Conn     // Conexión real
    Rooms    map[string]bool     // Salas suscritas
}
```

#### 3. **Autenticación** (`auth.go`)
Valida tokens JWT **antes** de aceptar conexión:

```
Cliente intenta conectar → Envía token JWT
                         ↓
                   Validar token
                         ↓
        ┌────────────────┴────────────────┐
        │                                 │
    Token válido                    Token inválido
        │                                 │
    Conexión OK                    Rechazar (401)
```

#### 4. **Autorización** (`authorization.go`)
Controla **quién puede entrar a qué sala**:

```
Usuario quiere unirse a "order-123"
                ↓
        ¿Es el dueño de la orden?
        ¿Es admin?
                ↓
    Sí → Permitir    No → Rechazar
```

#### 5. **Redis Pub/Sub** (`redis_pubsub.go`)
Sincroniza **múltiples instancias** del servicio:

```
Servidor 1                    Servidor 2
    │                              │
    │ Mensaje a "order-123"        │
    ├─→ Publica en Redis          │
    │                              │
    │        Redis Pub/Sub         │
    │              ↓               │
    │   ←──────────┴──────────→    │
    │                              │
    └─→ Clientes locales     Clientes locales ←┘
```

**¿Por qué Redis?** Si tienes 2 servidores con load balancer:
- Usuario A conectado al Servidor 1
- Usuario B conectado al Servidor 2
- Redis asegura que ambos reciban el mismo mensaje

### ¿Cómo funciona?

#### Flujo de conexión:

```
1. Frontend: const ws = new WebSocket('ws://localhost:8085/ws?token=...')

2. Realtime Service recibe conexión HTTP
   → handler.ServeWS()

3. Valida token JWT
   → auth.ValidateToken()
   → Extrae: user_id, role, seller_id

4. Upgrade HTTP → WebSocket
   → websocket.Upgrader.Upgrade()

5. Crea Client y registra en Hub
   → hub.Register(client)

6. Loop infinito: Lee mensajes del cliente
   → Procesa según tipo: "join", "leave", "broadcast"

7. Al desconectar: hub.Unregister(client)
```

#### Flujo de notificación:

```
REST Service detecta cambio importante (orden creada)
                    ↓
        Publica evento en Redis canal "events"
                    ↓
        Realtime Service escucha Redis
                    ↓
            hub.BroadcastStatsEvent()
                    ↓
        Filtra por rol (ADMIN/SELLER/CLIENT)
                    ↓
        Envía solo a destinatarios correctos
                    ↓
            Frontend recibe evento
                    ↓
        Actualiza UI automáticamente
```

### ¿Por qué Go?

✅ **Eficiencia**: Miles de conexiones con poca memoria  
✅ **Goroutines**: Concurrencia nativa  
✅ **Velocidad**: Compilado, muy rápido  
✅ **Simplicidad**: Código limpio y mantenible  

### Tipos de mensajes:

**Cliente → Servidor:**
```json
{ "type": "join", "payload": { "room": "order-123" } }
{ "type": "leave", "payload": { "room": "order-123" } }
{ "type": "broadcast", "payload": { "room": "seller-456", "body": {...} } }
```

**Servidor → Cliente:**
```json
{
  "from": "system",
  "room": "order-123",
  "ts": "2025-11-24T10:30:00Z",
  "body": { "type": "SELLER_STATS_UPDATED", "seller_id": "5" }
}
```

---

## 🟡 REPORT SERVICE (Python)

### ¿Qué hace?

Genera **reportes y estadísticas** consultando datos del REST Service mediante **GraphQL**.

### ¿Por qué GraphQL?

A diferencia de REST donde pides TODO:
```
GET /api/sellers/123
→ { id, name, email, phone, address, business_name, ... } // TODOS los campos
```

Con GraphQL pides **solo lo que necesitas**:
```graphql
query {
  seller(id: 123) {
    name
    totalSales
  }
}
→ { "name": "Mi Tienda", "totalSales": 15000 }
```

### Arquitectura: GraphQL con Strawberry

```
Frontend                     Report Service              REST Service
   │                               │                          │
   │ POST /graphql                 │                          │
   │ { query: ... }                │                          │
   ├──────────────────────────────▶│                          │
   │                               │                          │
   │                          1. Parsear query               │
   │                               │                          │
   │                          2. Ejecutar resolver            │
   │                               │                          │
   │                               │  GET /api/sellers       │
   │                               ├─────────────────────────▶│
   │                               │                          │
   │                               │  Datos JSON              │
   │                               ◀─────────────────────────┤
   │                               │                          │
   │                          3. Procesar datos              │
   │                          4. Calcular estadísticas        │
   │                               │                          │
   │  Respuesta GraphQL            │                          │
   ◀──────────────────────────────┤                          │
   │                               │                          │
```

### Componentes principales:

#### 1. **Schema** (`schema.py`)
Define **qué datos puedes pedir**:

```python
@strawberry.type
class SellerStats:
    seller_id: int
    seller_name: str
    total_sales: float
    total_orders: int
```

Es como un **contrato**: "Esto es lo que ofrezco"

#### 2. **Resolvers** (`resolvers.py`)
Implementa **cómo obtener esos datos**:

```python
@strawberry.field
def seller_dashboard(self, seller_id: int) -> SellerDashboard:
    # 1. Obtener productos del seller del REST Service
    products = await fetch_from_rest(f"/products?seller={seller_id}")
    
    # 2. Obtener órdenes del seller
    orders = await fetch_from_rest(f"/orders?seller={seller_id}")
    
    # 3. Calcular estadísticas
    total_sales = sum(order.total for order in orders)
    total_products = len(products)
    
    # 4. Retornar resultado
    return SellerDashboard(
        total_sales=total_sales,
        total_products=total_products
    )
```

#### 3. **Service** (`service.py`)
Lógica de **procesamiento de datos**:

- Hace peticiones HTTP al REST Service
- Procesa respuestas JSON
- Calcula estadísticas (sumas, promedios, agrupaciones)
- Filtra y ordena datos

### ¿Cómo funciona?

#### Flujo de reporte:

```
1. Frontend necesita estadísticas de vendedor
   → const { data } = useQuery(GET_SELLER_STATS, { sellerId: 5 })

2. Apollo Client envía: POST /graphql
   Body: { query: "query { sellerDashboard(sellerId: 5) { ... } }" }

3. Report Service recibe query
   → Strawberry parsea la query
   → Identifica resolver: seller_dashboard()

4. Resolver ejecuta lógica:
   a) GET http://rest-service:3000/api/products?seller=5
   b) GET http://rest-service:3000/api/orders?seller=5
   c) Procesa datos en memoria (Python)
   d) Calcula: ventas totales, órdenes, productos

5. Formatea respuesta según schema GraphQL

6. Retorna JSON al frontend

7. Frontend actualiza UI con datos
```

### Tipos de reportes implementados:

| Reporte | Qué hace | Uso |
|---------|----------|-----|
| `dashboardStats` | Métricas generales del día/mes | Dashboard admin |
| `salesReport` | Ventas agrupadas por período | Gráficos de ventas |
| `topSellersReport` | Mejores vendedores | Rankings |
| `bestProductsReport` | Productos más vendidos | Análisis de inventario |
| `categorySalesReport` | Ventas por categoría | Estrategia de negocio |
| `clientsReport` | Comportamiento de clientes | Fidelización |
| `inventoryReport` | Stock y alertas | Gestión de inventario |
| `deliveryPerformance` | Eficiencia de entregas | Logística |
| `financialReport` | Análisis financiero | Contabilidad |

### ¿Por qué Python?

✅ **Pandas**: Procesamiento de datos potente  
✅ **Librerías**: Muchas opciones para análisis  
✅ **Sintaxis clara**: Fácil de leer y mantener  
✅ **Async**: Peticiones HTTP concurrentes (rápido)  

---

## 🔗 CÓMO SE RELACIONAN LOS SERVICIOS

### Escenario 1: Cliente crea una orden

```
┌─────────────┐
│  FRONTEND   │
└──────┬──────┘
       │ 1. POST /api/orders
       │    { client_id, cart_id, payment_method }
       ▼
┌─────────────────────┐
│   REST SERVICE      │
│  (TypeScript)       │
│                     │
│ 2. CreateOrder      │
│    - Valida datos   │
│    - Calcula total  │
│    - Guarda en DB   │
│                     │
│ 3. Publica evento   │──────┐
│    en Redis         │      │
└─────────────────────┘      │
                             │ Canal "events"
                             │ { type: "SELLER_STATS_UPDATED" }
                             │
                    ┌────────▼────────┐
                    │     REDIS       │
                    └────────┬────────┘
                             │
       ┌─────────────────────┴─────────────────────┐
       │                                           │
       ▼                                           ▼
┌─────────────────────┐                  ┌─────────────────────┐
│ REALTIME SERVICE    │                  │  REPORT SERVICE     │
│       (Go)          │                  │     (Python)        │
│                     │                  │                     │
│ 4. Escucha Redis    │                  │ 6. Cuando frontend  │
│ 5. Filtra por rol   │                  │    hace query       │
│    - Si es vendedor │                  │    GraphQL          │
│      de esa orden   │                  │                     │
│    - Envía WebSocket│                  │ 7. Consulta REST    │
│                     │                  │    Service          │
└──────┬──────────────┘                  │                     │
       │                                 │ 8. Calcula stats    │
       │ WebSocket                       │    actualizadas     │
       ▼                                 └──────┬──────────────┘
┌─────────────┐                                │
│  FRONTEND   │                                │ GraphQL response
│             │◀───────────────────────────────┘
│ 9. Recibe   │
│    evento   │
│             │
│ 10. Refetch │
│     stats   │
└─────────────┘
```

### Escenario 2: Admin consulta reportes

```
┌─────────────┐
│  FRONTEND   │
└──────┬──────┘
       │ 1. POST /graphql
       │    query { salesReport { ... } }
       ▼
┌─────────────────────┐
│  REPORT SERVICE     │
│     (Python)        │
│                     │
│ 2. Resolver         │
│    salesReport()    │
│                     │
│ 3. HTTP GET ────────┼──────▶ ┌─────────────────────┐
│    /api/orders      │        │   REST SERVICE      │
│                     │        │                     │
│ 4. ◀────────────────┼────────│ Retorna todas       │
│    Recibe JSON      │        │ las órdenes         │
│                     │        └─────────────────────┘
│ 5. Procesa datos    │
│    - Agrupa por mes │
│    - Suma totales   │
│    - Calcula promedios
│                     │
│ 6. Retorna GraphQL  │
└──────┬──────────────┘
       │
       │ { salesByPeriod: [...] }
       ▼
┌─────────────┐
│  FRONTEND   │
│             │
│ 7. Renderiza│
│    gráfico  │
└─────────────┘
```

### Escenario 3: Notificación en tiempo real

```
VENDEDOR conectado al WebSocket
       │
       ▼
┌─────────────────────┐         ┌─────────────────────┐
│ REALTIME SERVICE    │◀────────│     REDIS           │
│                     │ Escucha │                     │
│ Hub tiene:          │         └──────▲──────────────┘
│ - Client A (SELLER) │                │
│   seller_id: 5      │                │
│ - Client B (ADMIN)  │                │ Publica evento
│                     │                │
└─────────────────────┘      ┌─────────┴──────────┐
       │ Solo envía           │  REST SERVICE      │
       │ a Client A           │                    │
       │ (filtrado)           │ Cliente verifica   │
       ▼                      │ pago de orden      │
┌─────────────┐               │                    │
│  VENDEDOR   │               │ publishEvent()     │
│  (Browser)  │               └────────────────────┘
│             │
│ WS recibe:  │
│ "stats_updated" │
│             │
│ refetch()   │────────┐
└─────────────┘        │
                       │
                       ▼
              ┌─────────────────────┐
              │  REPORT SERVICE     │
              │                     │
              │ Calcula stats       │
              │ actualizadas        │
              └─────────────────────┘
```

---

## 🌊 FLUJO DE DATOS COMPLETO

### Ejemplo: Vendedor sube un producto

```
PASO 1: Crear producto
━━━━━━━━━━━━━━━━━━━━━
Frontend → REST Service → PostgreSQL
  ↓
Producto creado con estado "pending"
(Espera aprobación de admin)


PASO 2: Admin aprueba producto
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend → REST Service
  ↓
Actualiza estado a "approved"
  ↓
Publica evento a Redis
  {
    type: "SELLER_STATS_UPDATED",
    seller_id: 5
  }


PASO 3: Notificación en tiempo real
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Redis → Realtime Service
  ↓
Hub.BroadcastStatsEvent()
  ↓
Filtra: Solo clientes con seller_id = 5
  ↓
WebSocket → Frontend (Vendedor)


PASO 4: Actualización automática
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Frontend recibe evento
  ↓
useWebSocket hook ejecuta callback
  ↓
refetch() de Apollo Client
  ↓
GraphQL query a Report Service
  ↓
Report Service consulta REST Service
  ↓
Calcula estadísticas actualizadas
  ↓
Frontend actualiza UI
  ✓ Total productos: 10 → 11
  ✓ Productos activos: 8 → 9
```

---

## 🎯 VENTAJAS DE ESTA ARQUITECTURA

### 1. **Separación de responsabilidades**
Cada servicio hace UNA cosa bien:
- REST → Negocio y datos
- Realtime → Comunicación instantánea
- Report → Análisis y estadísticas

### 2. **Escalabilidad independiente**
Puedes escalar solo lo que necesites:
- ¿Muchas conexiones WebSocket? → Más instancias de Realtime
- ¿Muchos reportes? → Más instancias de Report
- No necesitas escalar TODO junto

### 3. **Tecnología apropiada**
Cada servicio usa el lenguaje ideal:
- TypeScript: Ecosistema rico, tipado fuerte
- Go: Concurrencia eficiente para WebSockets
- Python: Procesamiento de datos potente

### 4. **Mantenibilidad**
- Cambios en reportes NO afectan lógica de negocio
- Problemas en WebSocket NO tumban el REST API
- Equipos pueden trabajar en paralelo

### 5. **Testeable**
Cada servicio se puede probar independientemente

---

## 📊 COMPARACIÓN DE SERVICIOS

| Aspecto | REST Service | Realtime Service | Report Service |
|---------|--------------|------------------|----------------|
| **Lenguaje** | TypeScript | Go | Python |
| **Framework** | Express | Gorilla WebSocket | Strawberry |
| **Base de Datos** | PostgreSQL (TypeORM) | - | - |
| **Protocolo** | HTTP REST | WebSocket | HTTP (GraphQL) |
| **Función** | CRUD + Negocio | Notificaciones real-time | Reportes + Analytics |
| **Estado** | Stateful (DB) | Stateless | Stateless |
| **Escalabilidad** | Vertical | Horizontal fácil | Horizontal fácil |
| **Dependencias** | Redis (eventos) | Redis (sync) | REST Service |

---

## 🔑 CONCEPTOS CLAVE

### REST Service
- **Clean Architecture**: Independencia de frameworks
- **DTOs**: Validación de entrada
- **Use Cases**: Lógica de negocio pura
- **TypeORM**: Mapeo objeto-relacional

### Realtime Service
- **Hub Pattern**: Gestión centralizada de conexiones
- **Pub/Sub**: Sincronización entre instancias
- **JWT**: Autenticación de WebSockets
- **Goroutines**: Concurrencia eficiente

### Report Service
- **GraphQL**: Consultas flexibles
- **Resolvers**: Lógica de obtención de datos
- **Async HTTP**: Peticiones concurrentes
- **Schema-first**: Contrato explícito

---

## 💡 PUNTOS IMPORTANTES PARA TU EXAMEN

### Pregunta: "¿Por qué microservicios?"
**Respuesta:**
1. Escalabilidad independiente
2. Tecnología apropiada para cada problema
3. Falla aislada (un servicio caído NO tumba todo)
4. Equipos independientes

### Pregunta: "¿Por qué Go para WebSockets?"
**Respuesta:**
1. Goroutines: miles de conexiones simultáneas
2. Bajo consumo de memoria
3. Compilado: muy rápido
4. Concurrencia nativa del lenguaje

### Pregunta: "¿Por qué GraphQL para reportes?"
**Respuesta:**
1. Cliente pide solo lo que necesita
2. Una sola petición para datos relacionados
3. Tipado fuerte (schema)
4. Documentación automática

### Pregunta: "¿Cómo se comunican los servicios?"
**Respuesta:**
1. REST ↔ Frontend: HTTP REST
2. Realtime ↔ Frontend: WebSocket
3. Report ↔ Frontend: GraphQL
4. REST → Realtime: Redis Pub/Sub
5. Report → REST: HTTP REST

---

## 📚 RECURSOS ADICIONALES

- **Clean Architecture**: "Clean Architecture" por Robert C. Martin
- **Microservicios**: "Building Microservices" por Sam Newman
- **WebSockets**: MDN Web Docs - WebSocket API
- **GraphQL**: graphql.org/learn

---

**Creado por:** Saul Castro  
**Fecha:** Noviembre 2025  
**Propósito:** Guía de estudio para examen - Arquitectura Backend
