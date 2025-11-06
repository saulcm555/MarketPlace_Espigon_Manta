# 📚 Documentación Completa de la Estructura del Proyecto Realtime Service

## 🎯 Propósito del Proyecto

**realtime_service** es un servicio de comunicación en tiempo real construido en Go que maneja conexiones WebSocket, autenticación JWT y sincronización de eventos entre múltiples instancias mediante Redis Pub/Sub.
---

## 📁 Estructura Completa del Proyecto

```
realtime_service/
├── 📂 cmd/                          # Comandos ejecutables (entry points)
│   └── 📂 api/
│       └── main.go                  # Punto de entrada principal del servicio
│
├── 📂 internal/                     # Código interno (no exportable)
│   ├── 📂 config/
│   │   └── config.go                # Configuración y variables de entorno
│   │
│   ├── 📂 db/
│   │   └── redis.go                 # Conexión y cliente de Redis
│   │
│   ├── 📂 handlers/
│   │   └── notification_handler.go  # Handlers HTTP para notificaciones
│   │
│   ├── 📂 models/                   # Modelos de datos (13 archivos)
│   │   ├── admin.go                 # Modelo de administradores
│   │   ├── cart.go                  # Modelo de carritos de compra
│   │   ├── category.go              # Modelo de categorías
│   │   ├── client.go                # Modelo de clientes
│   │   ├── delivery.go              # Modelo de entregas
│   │   ├── inventory.go             # Modelo de inventarios
│   │   ├── message.go               # Modelo de mensajes WebSocket
│   │   ├── notification.go          # Modelo de notificaciones
│   │   ├── order.go                 # Modelo de pedidos
│   │   ├── payment_method.go        # Modelo de métodos de pago
│   │   ├── product.go               # Modelo de productos
│   │   ├── seller.go                # Modelo de vendedores
│   │   └── subcategory.go           # Modelo de subcategorías
│   │
│   ├── 📂 services/
│   │   └── notification_service.go  # Lógica de negocio para notificaciones
│   │
│   └── 📂 websockets/               # Core de WebSocket (10 archivos)
│       ├── auth.go                  # Validación de tokens JWT
│       ├── auth_test.go             # Tests de autenticación
│       ├── authorization.go         # Control de acceso a salas
│       ├── authorization_test.go    # Tests de autorización
│       ├── client.go                # Gestión de clientes WebSocket
│       ├── handler.go               # Manejador de conexiones WebSocket
│       ├── hub.go                   # Hub central de conexiones
│       ├── message.go               # Estructuras de mensajes
│       ├── pubsub.go                # Interfaz de Pub/Sub
│       └── redis_pubsub.go          # Implementación Redis Pub/Sub
│
├── 📂 bin/                          # Binarios compilados (generado)
│
├── 📄 .dockerignore                 # Archivos a ignorar en build Docker
├── 📄 docker-compose.yml            # Orquestación de contenedores
├── 📄 Dockerfile                    # Imagen Docker del servicio
├── 📄 go.mod                        # Dependencias de Go
├── 📄 go.sum                        # Checksums de dependencias
├── 📄 MODELS_SYNC.md                # Sincronización de modelos con TypeScript
├── 📄 README_DOCKER.md              # Documentación de Docker
├── 📄 token_gen.go                  # Utilidad para generar tokens JWT de prueba
```

---

## 📂 Descripción Detallada de Carpetas y Archivos

### 🔷 **Carpeta Raíz (`/`)**

#### 📄 **go.mod**
- **Propósito:** Define el módulo Go y sus dependencias
- **Contiene:**
  - Nombre del módulo: `github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service`
  - Versión de Go: `1.25`
  - Dependencias: `jwt`, `websocket`, `redis`
- **Cuándo se modifica:** Al agregar/actualizar dependencias con `go get`

#### 📄 **go.sum**
- **Propósito:** Checksums de las dependencias para verificar integridad
- **Cuándo se modifica:** Automáticamente con `go mod tidy`
- **No debe editarse manualmente**

#### 📄 **Dockerfile**
- **Propósito:** Construir la imagen Docker del servicio
- **Características:**
  - Build multi-stage (builder + runtime)
  - Imagen base: `golang:1.20-alpine`
  - Imagen final: `alpine:3.18` (ligera)
  - Expone puerto: `8080`
- **Uso:** `docker build -t realtime-service .`

#### 📄 **docker-compose.yml**
- **Propósito:** Orquestar múltiples servicios para desarrollo local
- **Servicios definidos:**
  - `redis`: Base de datos en memoria
  - `api1`: Primera instancia del servicio (puerto 8080)
  - `api2`: Segunda instancia del servicio (puerto 8081)
- **Prueba escalabilidad horizontal:** Dos instancias compartiendo Redis Pub/Sub
- **Uso:** `docker-compose up`

#### 📄 **.dockerignore**
- **Propósito:** Excluir archivos innecesarios del build Docker
- **Mejora:** Reduce tamaño de imagen y velocidad de build
- **Incluye:** `*.md`, `bin/`, `.git`, archivos temporales

#### 📄 **token_gen.go**
- **Propósito:** Herramienta de utilidad para generar tokens JWT de prueba
- **Uso:** `go run token_gen.go`
- **Función:** Genera un token JWT válido para testing manual
- **No es parte del servicio principal**


#### 📄 **README_DOCKER.md**
- **Propósito:** Documentación específica de Docker
- **Contiene:**
  - Instrucciones de build con Docker
  - Uso de docker-compose
  - Variables de entorno para contenedores

#### 📄 **MODELS_SYNC.md**
- **Propósito:** Documentar sincronización de modelos con rest_service
- **Contiene:**
  - Mapeo de campos TypeScript ↔ Go
  - Convenciones de nombres
  - Tipos de datos equivalentes
  - Ejemplos de uso

### 🔷 **cmd/api/**

Carpeta que contiene los puntos de entrada (entry points) del servicio.

#### 📄 **main.go**
- **Propósito:** Punto de entrada principal del servicio
- **Funcionalidad:**
  1. **Carga configuración** desde variables de entorno
  2. **Inicializa Redis** (opcional, funciona sin Redis)
  3. **Crea el Hub de WebSocket** para gestionar conexiones
  4. **Configura Redis Pub/Sub** para comunicación entre instancias
  5. **Define endpoints HTTP:**
     - `GET /ws` - Conexión WebSocket
     - `GET /health` - Health check
     - `GET /admin/clients` - Monitoreo de clientes conectados
  6. **Inicia el servidor HTTP** en el puerto configurado
  7. **Maneja shutdown graceful** (cierre ordenado)
- **Importa:** `config`, `db`, `websockets`
- **Ejecuta:** El servidor HTTP que escucha conexiones

---

### 🔷 **internal/config/**

Carpeta que maneja la configuración del servicio.

#### 📄 **config.go**
- **Propósito:** Centralizar la configuración mediante variables de entorno
- **Struct Config:**
  ```go
  type Config struct {
      Port          string  // Puerto del servidor (default: 8080)
      JWTSecret     string  // Clave secreta para validar JWT (obligatorio)
      RedisAddr     string  // Dirección de Redis (default: localhost:6379)
      RedisPassword string  // Contraseña de Redis (opcional)
      Environment   string  // Entorno: development, production
  }
  ```
- **Función LoadConfig():** Lee variables de entorno y retorna Config
- **Variables de entorno:**
  - `PORT`
  - `JWT_SECRET` ⚠️ **OBLIGATORIO**
  - `REDIS_ADDR`
  - `REDIS_PASSWORD`
  - `ENVIRONMENT`

---

### 🔷 **internal/db/**

Carpeta para gestión de bases de datos (actualmente solo Redis).

#### 📄 **redis.go**
- **Propósito:** Inicializar y gestionar conexión a Redis
- **Funciones:**
  - `InitRedis()`: Conecta a Redis leyendo `REDIS_ADDR` y `REDIS_PASSWORD`
  - `CloseRedis()`: Cierra la conexión ordenadamente
- **Variable global:** `RedisClient` - Cliente Redis compartido
- **Características:**
  - Verifica conectividad con `Ping()`
  - Timeout de conexión: 5s
  - Pool de conexiones: 10
  - Maneja errores sin detener el servicio
- **Uso:** `db.InitRedis()` en main.go

---

### 🔷 **internal/handlers/**

Carpeta para handlers HTTP (API REST).

#### 📄 **notification_handler.go**
- **Propósito:** Exponer API HTTP para enviar notificaciones
- **Struct NotificationHandler:**
  - Contiene `notificationService`
- **Endpoint propuesto:** `POST /api/notify`
- **Funcionalidad:**
  - Recibe solicitud JSON con evento, datos y destinatario
  - Valida que se especifique `user_id` o `room`
  - Envía notificación vía WebSocket
  - Retorna status de éxito/error
- **Request Body:**
  ```json
  {
    "event": "order_created",
    "data": {...},
    "user_id": "user-123",  // O
    "room": "order-456"     // O
  }
  ```
- **Uso futuro:** Permite a otros servicios enviar notificaciones vía HTTP

---

### 🔷 **internal/models/**

Carpeta con todos los modelos de datos (13 archivos).

#### 📄 **notification.go**
- **Propósito:** Modelo para notificaciones en tiempo real
- **Struct Notification:**
  ```go
  Event string      // Tipo de evento: "order_created", "product_updated"
  Data  interface{} // Datos del evento (cualquier tipo)
  To    string      // Destinatario: userID, roomID, "broadcast"
  ```
- **Uso:** Envolver eventos para transmitir vía WebSocket

#### 📄 **message.go**
- **Propósito:** Modelo para mensajes genéricos
- **Struct Message:**
  ```go
  ID        string
  From      string      // UserID del remitente
  To        string      // UserID del destinatario
  Room      string      // Sala/Canal
  Type      string      // "text", "notification", "system"
  Content   string      // Contenido del mensaje
  Data      interface{} // Datos adicionales
  Timestamp time.Time
  ```
- **Uso:** Chat, comunicación entre usuarios

#### 📄 **order.go**
- **Propósito:** Modelo simplificado de pedidos
- **Sincronizado con:** `rest_service/src/models/orderModel.ts`
- **Campos principales:**
  - `IDOrder`, `OrderDate`, `Status`
  - `TotalAmount`, `DeliveryType`
  - `IDClient`, `IDCart`, `IDPaymentMethod`, `IDDelivery`
- **Uso:** Notificar actualizaciones de pedidos en tiempo real

#### 📄 **product.go**
- **Propósito:** Modelo simplificado de productos
- **Sincronizado con:** `rest_service/src/models/productModel.ts`
- **Campos principales:**
  - `IDProduct`, `ProductName`, `Description`
  - `Price`, `Stock`, `ImageURL`
  - `IDSeller`, `IDInventory`, `IDCategory`
- **Uso:** Notificar cambios en productos (stock, precio, etc.)

#### 📄 **client.go**
- **Propósito:** Modelo simplificado de clientes
- **Sincronizado con:** `rest_service/src/models/clientModel.ts`
- **Campos principales:**
  - `IDClient`, `ClientName`, `ClientEmail`
  - `Address`, `Phone`, `DocumentType`
  - `AvatarURL`, `CreatedAt`
- **Uso:** Datos de cliente en notificaciones

#### 📄 **seller.go**
- **Propósito:** Modelo simplificado de vendedores
- **Sincronizado con:** `rest_service/src/models/sellerModel.ts`
- **Campos principales:**
  - `IDSeller`, `SellerName`, `SellerEmail`
  - `BusinessName`, `Location`, `Phone`
- **Uso:** Datos de vendedor en notificaciones

#### 📄 **cart.go**
- **Propósito:** Modelo simplificado de carritos
- **Campos:** `IDCart`, `IDClient`, `Status`, `IDProduct`, `Quantity`
- **Uso:** Notificar cambios en carritos de compra

#### 📄 **category.go**
- **Propósito:** Modelo simplificado de categorías
- **Campos:** `IDCategory`, `CategoryName`, `Description`, `Photo`
- **Uso:** Sincronizar catálogo de categorías

#### 📄 **subcategory.go**
- **Propósito:** Modelo simplificado de subcategorías
- **Campos:** `IDSubCategory`, `IDCategory`, `SubCategoryName`, `Description`
- **Uso:** Sincronizar catálogo de subcategorías

#### 📄 **inventory.go**
- **Propósito:** Modelo simplificado de inventarios
- **Campos:** `IDInventory`, `IDSeller`, `UpdatedAt`
- **Uso:** Notificar actualizaciones de inventario

#### 📄 **delivery.go**
- **Propósito:** Modelo simplificado de entregas
- **Campos principales:**
  - `IDDelivery`, `IDProduct`
  - `DeliveryAddress`, `City`, `Status`
  - `EstimatedTime`, `DeliveryPerson`, `DeliveryCost`
- **Uso:** Rastreo de entregas en tiempo real

#### 📄 **payment_method.go**
- **Propósito:** Modelo simplificado de métodos de pago
- **Campos:** `IDPaymentMethod`, `MethodName`, `DetailsPayment`
- **Uso:** Información de métodos de pago

#### 📄 **admin.go**
- **Propósito:** Modelo simplificado de administradores
- **Campos:** `IDAdmin`, `AdminName`, `AdminEmail`, `Role`, `CreatedAt`
- **Uso:** Gestión de administradores

**🔑 Características comunes de todos los modelos:**
- ✅ Tags JSON en snake_case (ej: `json:"id_client"`)
- ✅ Sincronizados con modelos TypeScript del rest_service
- ✅ Simplificados (sin relaciones ORM)
- ✅ Optimizados para serialización JSON
- ✅ Comentarios descriptivos

---

### 🔷 **internal/services/**

Carpeta para lógica de negocio (business logic).

#### 📄 **notification_service.go**
- **Propósito:** Servicio de alto nivel para envío de notificaciones
- **Struct NotificationService:**
  - Contiene referencia al `Hub` de WebSocket
- **Métodos:**
  - `SendOrderUpdate(userID, order)`: Envía actualización de pedido a un usuario
  - `SendProductUpdate(room, product)`: Envía actualización de producto a una sala
  - `BroadcastNotification(room, event, data)`: Envía notificación genérica a una sala
- **Funcionalidad:**
  - Serializa modelos a JSON
  - Envía via Hub de WebSocket
  - Registra en logs
  - Maneja errores
- **Uso:** Capa de abstracción entre handlers y WebSocket

---

### 🔷 **internal/websockets/**

**Carpeta más importante** - Contiene todo el core de WebSocket.

#### 📄 **hub.go**
- **Propósito:** Hub central que gestiona todas las conexiones WebSocket
- **Struct Hub:**
  ```go
  clients map[string]*Client           // Clientes conectados
  rooms   map[string]map[string]*Client // Salas y sus miembros
  mu      sync.RWMutex                 // Mutex para concurrencia
  pub     PubSub                       // Sistema de pub/sub
  ```
- **Funciones principales:**
  - `NewHub()`: Crea un nuevo Hub
  - `Run()`: Loop principal (actualmente vacío, para futura expansión)
  - `Register(client)`: Registra un nuevo cliente
  - `Unregister(client)`: Elimina un cliente y sus salas
  - `SendToUser(userID, msg)`: Envía mensaje a todas las conexiones de un usuario
  - `JoinRoom(room, client)`: Añade cliente a una sala
  - `LeaveRoom(room, client)`: Quita cliente de una sala
  - `BroadcastRoom(room, msg)`: Envía mensaje a todos los miembros de una sala
  - `PublishRoom(room, msg)`: Broadcast local + pub/sub Redis
  - `SetPubSub(p)`: Configura sistema de pub/sub
  - `Snapshot()`: Retorna estadísticas (para monitoreo)
  - `Close()`: Cierra recursos (pub/sub)
- **Responsabilidad:** Gestión centralizada de todas las conexiones

#### 📄 **client.go**
- **Propósito:** Representa una conexión WebSocket individual
- **Struct Client:**
  ```go
  ID     string               // ID único de la conexión
  UserID string               // ID del usuario autenticado
  Conn   *websocket.Conn      // Conexión WebSocket
  Rooms  map[string]bool      // Salas a las que está suscrito
  ```
- **Métodos:**
  - `Send(msg)`: Envía mensaje al cliente con timeout
  - `Join(room)`: Añade sala a la lista local
  - `Leave(room)`: Quita sala de la lista local
- **Responsabilidad:** Representar una única conexión activa

#### 📄 **handler.go**
- **Propósito:** Manejar el ciclo de vida de las conexiones WebSocket
- **Función principal:** `ServeWS(hub, w, r)`
- **Flujo:**
  1. **Autenticación:**
     - Lee token de header `Authorization` o query param `?token=`
     - Valida token JWT con `ValidateToken()`
     - Rechaza conexión si token inválido (401)
  
  2. **Upgrade:**
     - Upgrade de HTTP a WebSocket con `upgrader.Upgrade()`
     - Configura límite de tamaño de mensaje (8KB)
  
  3. **Registro:**
     - Crea struct `Client` con ID único
     - Registra en el Hub
     - Log de conexión
  
  4. **Loop de lectura:**
     - Lee mensajes del cliente
     - Parsea JSON a `Message`
     - Valida tipo de mensaje
     - Procesa según tipo:
       - `"join"`: Une a sala (con autorización)
       - `"leave"`: Sale de sala
       - `"broadcast"`: Envía mensaje a sala
  
  5. **Desconexión:**
     - Unregister del Hub
     - Cierra conexión
     - Log de desconexión
- **Constantes:**
  - `MaxMessageSize = 8KB`: Protección DoS
- **Función auxiliar:** `sendProtocolError()`: Envía errores estructurados

#### 📄 **auth.go**
- **Propósito:** Validación de tokens JWT
- **Variable global:** `jwtSecret` - Lee de env `JWT_SECRET`
- **Struct Claims:**
  ```go
  UserID   string // ID del usuario
  Role     string // Rol: "admin", "seller", "client"
  SellerID string // ID del vendedor (si aplica)
  jwt.RegisteredClaims // exp, nbf, iat
  ```
- **Función ValidateToken(header):**
  - Parsea header `Authorization: Bearer <token>`
  - Valida firma HMAC (HS256/HS384/HS512)
  - Verifica claims registrados (exp, nbf, iat)
  - Retorna `Claims` o error
- **Seguridad:**
  - ✅ Rechaza algoritmos no-HMAC
  - ✅ Valida expiración
  - ✅ Valida firma
- **Uso:** Autenticar cada conexión WebSocket

#### 📄 **auth_test.go**
- **Propósito:** Tests unitarios de autenticación JWT
- **Tests incluidos:**
  - Token válido → OK
  - Token expirado → Error
  - Algoritmo incorrecto (RS256) → Error
- **Usa:** Librería estándar `testing` de Go
- **Ejecución:** `go test ./internal/websockets -v`

#### 📄 **authorization.go**
- **Propósito:** Control de acceso a salas (autorización)
- **Función CanJoinRoom(ctx, userID, claims, room):**
  - **Retorna:** `(bool, error)` - permitido, error
  
  - **Modo 1: Backend Runtime Check** (si `BACKEND_URL` está configurado)
    - Hace HTTP GET a endpoints del backend:
      - `GET /orders/{id}/can_access?user_id={userID}` para sala `order-{id}`
      - `GET /sellers/{id}/can_access?user_id={userID}` para sala `seller-{id}`
      - `GET /ws/can_join?room={room}&user_id={userID}` para otras salas
    - Espera respuesta JSON: `{"allowed": true/false}`
    - Timeout: 3 segundos
  
  - **Modo 2: Claims-based (fallback)**
    - Sala `order-{id}`:
      - ✅ Permitido si `claims.UserID == id` (dueño)
      - ✅ Permitido si `claims.Role == "admin"`
    - Sala `seller-{id}`:
      - ✅ Permitido si `claims.SellerID == id` (dueño)
      - ✅ Permitido si `claims.Role == "seller"`
      - ✅ Permitido si `claims.Role == "admin"`
    - Otras salas:
      - ✅ Permitido si `claims.UserID == userID`
      - ✅ Permitido si `claims.Role == "admin"`

- **Variables de entorno:** `BACKEND_URL`
- **Error:** `ErrInvalidRoomFormat` para salas malformadas
- **Uso:** Verificar permisos antes de `JoinRoom()`

#### 📄 **authorization_test.go**
- **Propósito:** Tests unitarios de autorización
- **Tests incluidos:**
  - Owner puede unirse a su sala → OK
  - Usuario no puede unirse a sala ajena → Error
  - Seller puede unirse a su sala → OK
  - Admin puede unirse a cualquier sala → OK
  - Backend runtime check → OK/Error según endpoint
- **Usa:** `httptest` para simular backend
- **Ejecución:** `go test ./internal/websockets -v`

#### 📄 **message.go**
- **Propósito:** Estructuras de mensajes WebSocket
- **Struct Message:**
  ```go
  Type    string                 // "join", "leave", "broadcast"
  Payload map[string]interface{} // Datos del mensaje
  ```
- **Struct Envelope:**
  ```go
  From string      // ID del cliente remitente
  Room string      // Sala donde se envía
  Ts   string      // Timestamp RFC3339
  Body interface{} // Contenido del mensaje
  ```
- **Uso:**
  - `Message`: Cliente → Servidor
  - `Envelope`: Servidor → Clientes (broadcasts)

#### 📄 **pubsub.go**
- **Propósito:** Interfaz genérica de Pub/Sub
- **Interface PubSub:**
  ```go
  Publish(room string, payload []byte) error
  Start(handler func(room, payload []byte)) error
  Close() error
  ```
- **Diseño:** Abstracción para soportar múltiples implementaciones
- **Implementaciones posibles:**
  - ✅ Redis (redis_pubsub.go)
  - 🔜 NATS
  - 🔜 RabbitMQ
  - 🔜 Kafka
- **Uso:** Comunicación entre múltiples instancias del servicio

#### 📄 **redis_pubsub.go**
- **Propósito:** Implementación de PubSub con Redis
- **Struct RedisPubSub:**
  ```go
  client *redis.Client      // Cliente Redis
  ctx    context.Context    // Contexto para cancelación
  cancel context.CancelFunc // Función de cancelación
  sub    *redis.PubSub      // Suscripción activa
  wg     sync.WaitGroup     // Para shutdown ordenado
  ```
- **Funciones:**
  - `NewRedisPubSub(addr, password)`: Crea instancia conectada
  - `Start(handler)`: Inicia goroutine de suscripción
  - `Publish(room, payload)`: Publica mensaje en canal `ws:room:{room}`
  - `Close()`: Cierra conexión ordenadamente
- **Características:**
  - ✅ Reconexión automática con backoff exponencial
  - ✅ Pattern subscription: `ws:room:*`
  - ✅ Manejo de errores
  - ✅ Shutdown graceful
  - ✅ Jitter en reconexiones
- **Patrón de canales:** `ws:room:{roomName}`
- **Uso:** Escalar horizontalmente con múltiples instancias

---

## 🔄 Flujo de Datos del Sistema

### 1️⃣ **Conexión de Cliente**
```
Cliente → HTTP GET /ws + Authorization header
  ↓
handler.ServeWS()
  ↓
auth.ValidateToken() → Valida JWT
  ↓
websocket.Upgrader.Upgrade() → Upgrade HTTP → WebSocket
  ↓
hub.Register(client) → Registra en Hub
  ↓
Loop de lectura (handler.go) → Lee mensajes del cliente
```

### 2️⃣ **Cliente se Une a Sala**
```
Cliente envía: {"type": "join", "payload": {"room": "order-123"}}
  ↓
handler.go parsea mensaje
  ↓
authorization.CanJoinRoom() → Verifica permisos
  ↓
hub.JoinRoom(room, client) → Añade a sala
  ↓
Respuesta: "joined order-123"
```

### 3️⃣ **Broadcast a Sala**
```
Cliente envía: {"type": "broadcast", "payload": {"room": "order-123", "body": {...}}}
  ↓
handler.go crea Envelope con metadata
  ↓
hub.PublishRoom(room, msg)
  ├─→ hub.BroadcastRoom() → Envía a clientes locales
  └─→ redis_pubsub.Publish() → Publica en Redis
      ↓
      Redis Pub/Sub propaga a otras instancias
      ↓
      redis_pubsub.Start() handler recibe mensaje
      ↓
      hub.BroadcastRoom() → Envía a clientes de otra instancia
```

### 4️⃣ **Notificación desde Backend**
```
rest_service (TypeScript)
  ↓
HTTP POST /api/notify
  {
    "event": "order_created",
    "data": {...},
    "room": "order-123"
  }
  ↓
handlers.NotificationHandler
  ↓
services.NotificationService.BroadcastNotification()
  ↓
hub.PublishRoom() → A todos los clientes en la sala
```

### 5️⃣ **Desconexión**
```
Cliente cierra conexión O Error de lectura
  ↓
handler.go sale del loop
  ↓
hub.Unregister(client)
  ├─→ Elimina de clients map
  └─→ Elimina de todas sus rooms
  ↓
websocket.Conn.Close()
  ↓
Log: "client disconnected"
```

---

## 🔐 Seguridad

### **Autenticación (auth.go)**
- ✅ JWT con algoritmo HMAC (HS256/384/512)
- ✅ Valida firma digital
- ✅ Verifica expiración (exp)
- ✅ Rechaza algoritmos asimétricos (RS256, etc.)
- ✅ Secret configurable via `JWT_SECRET`

### **Autorización (authorization.go)**
- ✅ Control de acceso por sala
- ✅ Validación contra backend (opcional)
- ✅ Roles: admin, seller, client
- ✅ Ownership check (dueño de pedido/seller)

### **Protección DoS**
- ✅ Límite de tamaño de mensaje: 8KB
- ✅ Timeout de escritura: 5s
- ✅ CORS configurable (actualmente permite todos)

### **Mejoras recomendadas:**
- ⚠️ Rate limiting por cliente
- ⚠️ Ping/Pong para detectar conexiones muertas
- ⚠️ Write pump separado (prevenir data races)

---

## 📊 Monitoreo y Observabilidad

### **Endpoints de Monitoreo**

#### `GET /health`
- **Status:** Servicio saludable
- **Respuesta:** `{"status": "healthy", "service": "realtime_service"}`

#### `GET /admin/clients`
- **Estadísticas en tiempo real:**
  - Número total de clientes conectados
  - Clientes por sala
- **Respuesta:**
  ```json
  {
    "clients": 15,
    "rooms": {
      "order-123": 3,
      "seller-456": 5,
      "product-789": 7
    }
  }
  ```

### **Logs**
- ✅ Conexión de clientes
- ✅ Desconexión de clientes
- ✅ Errores de autenticación
- ✅ Errores de autorización
- ✅ Mensajes enviados/recibidos
- ✅ Estado de Redis Pub/Sub

---

## 🚀 Despliegue

### **Variables de Entorno Requeridas**

| Variable | Descripción | Obligatorio | Default |
|----------|-------------|-------------|---------|
| `PORT` | Puerto del servidor | No | `8080` |
| `JWT_SECRET` | Clave secreta JWT | **Sí** | - |
| `REDIS_ADDR` | Dirección de Redis | No | `localhost:6379` |
| `REDIS_PASSWORD` | Contraseña Redis | No | - |
| `ENVIRONMENT` | Entorno (dev/prod) | No | `development` |
| `BACKEND_URL` | URL del rest_service | No | - |

### **Comandos de Ejecución**

```bash
# Desarrollo local
# ⚠️ IMPORTANTE: configura tus variables en un archivo `.env` y no las incluyas en el repositorio
# Ejemplo (no uses estos valores en producción):
export JWT_SECRET=TU_CLAVE_SECRETA_AQUI
export REDIS_ADDR=localhost:6379
go run cmd/api/main.go

# Compilar binario
go build -o bin/realtime_service cmd/api/main.go
./bin/realtime_service

# Docker
docker build -t realtime-service .
docker run -p 8080:8080 \
  -e JWT_SECRET=TU_CLAVE_SECRETA_AQUI \
  -e REDIS_ADDR=redis:6379 \
  realtime-service

# Docker Compose (2 instancias + Redis)
docker-compose up
```

---

## 🧪 Testing

```bash
# Todos los tests
go test ./...

# Tests de websockets con verbose
go test ./internal/websockets -v

# Tests con detección de race conditions
go test ./... -race

# Coverage
go test ./... -cover
```

---

## 📈 Escalabilidad

### **Horizontal Scaling**
- ✅ Múltiples instancias con Redis Pub/Sub
- ✅ Load balancer (nginx, AWS ALB) delante
- ✅ Sticky sessions NO requeridas (gracias a Redis)

### **Vertical Scaling**
- ✅ Goroutines eficientes (miles de conexiones por instancia)
- ✅ Uso de memoria optimizado
- ✅ CPU: Bajo uso en reposo, escala con mensajes

---

## 🎯 Próximos Pasos Recomendados

1. **Write/Read Pumps separados** (prevenir data races)
2. **Ping/Pong heartbeat** (detectar conexiones muertas)
3. **Rate limiting** (prevenir abuso)
4. **Métricas Prometheus** (observabilidad avanzada)
5. **Tests de integración** (end-to-end)
6. **Documentación de API** (para frontend)

---

