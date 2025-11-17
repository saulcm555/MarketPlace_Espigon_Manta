# 🚀 Realtime Service - Servicio de Comunicación en Tiempo Real

## 📋 Descripción General

El **Realtime Service** es un microservicio desarrollado en **Go** que proporciona comunicación en tiempo real mediante **WebSockets**. Este servicio es fundamental para mantener a los usuarios sincronizados con eventos que ocurren en el sistema, como notificaciones de nuevos pedidos, cambios de estado, actualizaciones de inventario, y mensajes en tiempo real.

## 🎯 Propósito y Funcionalidad

Este servicio tiene como objetivo principal:

- ✅ **Gestionar conexiones WebSocket** de múltiples clientes simultáneos
- ✅ **Autenticar usuarios** mediante tokens JWT
- ✅ **Distribuir notificaciones en tiempo real** a usuarios específicos o grupos
- ✅ **Sincronizar eventos** entre múltiples instancias del servicio mediante Redis Pub/Sub
- ✅ **Controlar acceso a salas** según roles de usuario (admin, vendedor, cliente)
- ✅ **Mantener estado de conexiones** activas y gestionar reconexiones

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Go** | 1.23+ | Lenguaje principal del servicio |
| **Gorilla WebSocket** | 1.5.3 | Implementación de WebSocket |
| **Redis** | 9.7.0 | Pub/Sub para sincronización entre instancias |
| **JWT** | 4.5.2 | Autenticación de usuarios |
| **Docker** | Latest | Contenerización |
| **Docker Compose** | Latest | Orquestación de servicios |

### Patrón de Arquitectura

El servicio sigue el patrón **Clean Architecture** con separación de responsabilidades:

```
realtime_service/
├── cmd/api/              # Punto de entrada de la aplicación
├── internal/             # Código interno (no exportable)
│   ├── config/          # Configuración y variables de entorno
│   ├── db/              # Conexión a Redis
│   ├── handlers/        # Manejadores HTTP
│   ├── models/          # Modelos de datos
│   ├── services/        # Lógica de negocio
│   └── websockets/      # Core de WebSocket
└── bin/                 # Binarios compilados
```

## 📂 Estructura Detallada

### 📁 `/cmd/api`

**Archivo principal:** `main.go`

**Función:** Punto de entrada del servicio. Inicializa:
- Configuración de variables de entorno
- Conexión a Redis
- Hub de WebSocket
- Sistema de Pub/Sub
- Servidor HTTP

```go
// Inicializa y arranca el servidor
func main() {
    // Carga configuración
    config.LoadConfig()
    
    // Conecta Redis
    redisClient := db.ConnectRedis()
    
    // Crea hub WebSocket
    hub := websockets.NewHub(redisPubSub)
    
    // Inicia servidor
    http.ListenAndServe(":8080", nil)
}
```

### 📁 `/internal/config`

**Archivo:** `config.go`

**Función:** Gestiona variables de entorno y configuración del servicio.

**Variables de entorno requeridas:**
- `JWT_SECRET`: Secreto para validar tokens JWT
- `REDIS_URL`: URL de conexión a Redis
- `PORT`: Puerto del servicio (default: 8080)
- `ALLOWED_ORIGINS`: Orígenes permitidos para CORS

### 📁 `/internal/db`

**Archivo:** `redis.go`

**Función:** Gestiona la conexión al servidor Redis.

**Capacidades:**
- Pool de conexiones
- Reconexión automática
- Verificación de salud
- Cliente thread-safe

### 📁 `/internal/handlers`

**Archivo:** `notification_handler.go`

**Función:** Expone endpoints HTTP para enviar notificaciones.

**Endpoints principales:**
- `POST /api/notifications/send`: Envía notificación a un usuario específico
- `POST /api/notifications/broadcast`: Envía notificación a todos los usuarios de una sala

### 📁 `/internal/models`

**13 Archivos de modelos** que representan entidades del dominio:

| Modelo | Descripción |
|--------|-------------|
| `admin.go` | Estructura de administradores |
| `cart.go` | Carritos de compra |
| `category.go` | Categorías de productos |
| `client.go` | Clientes del marketplace |
| `delivery.go` | Entregas y envíos |
| `inventory.go` | Control de inventario |
| `message.go` | Mensajes WebSocket |
| `notification.go` | Notificaciones del sistema |
| `order.go` | Pedidos y órdenes |
| `payment_method.go` | Métodos de pago |
| `product.go` | Productos del catálogo |
| `seller.go` | Vendedores registrados |
| `subcategory.go` | Subcategorías de productos |

Estos modelos están sincronizados con el servicio REST (TypeScript) para mantener consistencia de datos.

### 📁 `/internal/services`

**Archivo:** `notification_service.go`

**Función:** Lógica de negocio para notificaciones.

**Capacidades:**
- Validación de datos de notificaciones
- Formateo de mensajes
- Enrutamiento a destinatarios
- Logging de eventos

### 📁 `/internal/websockets`

**Núcleo del sistema de tiempo real** con 10 archivos:

#### `hub.go` - Hub Central
**Función:** Gestor central de todas las conexiones WebSocket.

**Responsabilidades:**
- Mantiene registro de todos los clientes conectados
- Gestiona salas temáticas (orders, notifications, etc.)
- Rutea mensajes a destinatarios correctos
- Coordina con Redis Pub/Sub para sincronización multi-instancia

```go
type Hub struct {
    clients    map[*Client]bool    // Clientes conectados
    rooms      map[string]map[*Client]bool  // Salas por tema
    broadcast  chan []byte         // Canal de broadcast
    register   chan *Client        // Registro de nuevos clientes
    unregister chan *Client        // Desregistro de clientes
}
```

#### `client.go` - Gestión de Clientes
**Función:** Representa cada conexión WebSocket individual.

**Capacidades:**
- Lee mensajes del cliente
- Envía mensajes al cliente
- Mantiene información de usuario (ID, rol, salas)
- Gestiona timeout y reconexión
- Limpieza automática en desconexión

#### `handler.go` - Manejador de Conexiones
**Función:** Maneja el upgrade HTTP → WebSocket.

**Proceso:**
1. Recibe petición HTTP con token JWT
2. Valida token de autenticación
3. Upgrade a conexión WebSocket
4. Registra cliente en Hub
5. Inicia lectores/escritores

#### `auth.go` - Autenticación JWT
**Función:** Valida tokens JWT de usuarios.

**Validaciones:**
- Token válido y no expirado
- Firma correcta
- Claims requeridos (userID, role)
- Extracción de información de usuario

#### `authorization.go` - Control de Acceso
**Función:** Controla qué usuarios pueden acceder a qué salas.

**Reglas de autorización:**
- **Admins**: Acceso completo a todas las salas
- **Sellers**: Acceso a salas de órdenes, inventario, productos
- **Clients**: Acceso a salas de notificaciones, carritos, órdenes propias
- **Delivery**: Acceso a salas de entregas

#### `message.go` - Estructuras de Mensajes
**Función:** Define tipos de mensajes WebSocket.

**Tipos de mensajes:**
```go
type Message struct {
    Type      string      `json:"type"`      // notification, order_update, etc.
    Room      string      `json:"room"`      // Sala destino
    UserID    string      `json:"userId"`    // Usuario destino (opcional)
    Payload   interface{} `json:"payload"`   // Datos del mensaje
    Timestamp time.Time   `json:"timestamp"` // Timestamp del evento
}
```

#### `pubsub.go` - Interfaz Pub/Sub
**Función:** Define interfaz para sistemas de publicación/suscripción.

**Métodos:**
- `Publish(channel, message)`: Publica mensaje
- `Subscribe(channels...)`: Se suscribe a canales
- `Close()`: Cierra conexiones

#### `redis_pubsub.go` - Implementación Redis
**Función:** Implementa Pub/Sub con Redis.

**¿Por qué Redis Pub/Sub?**
Permite que múltiples instancias del servicio compartan eventos. Si un evento ocurre en la instancia A, también se notifica a los usuarios conectados a la instancia B.

**Canales principales:**
- `realtime:notifications`: Notificaciones globales
- `realtime:orders`: Actualizaciones de pedidos
- `realtime:inventory`: Cambios de inventario
- `realtime:broadcasts`: Mensajes broadcast

#### `auth_test.go` y `authorization_test.go`
**Función:** Tests unitarios para autenticación y autorización.

**Cobertura:**
- Validación de tokens válidos/inválidos
- Verificación de roles
- Control de acceso a salas
- Casos edge y errores

## 🔐 Sistema de Autenticación y Autorización

### Flujo de Autenticación

1. **Cliente se autentica** en el servicio REST y obtiene JWT
2. **Cliente conecta vía WebSocket** enviando token en query param:
   ```
   ws://localhost:8080/ws?token=eyJhbGc...
   ```
3. **Servicio valida token** y extrae información del usuario
4. **Conexión es aceptada** y cliente se registra en Hub

### Roles y Permisos

| Rol | Salas Permitidas |
|-----|------------------|
| **admin** | 🟢 Todas las salas |
| **seller** | 🟡 orders, inventory, products, notifications |
| **client** | 🔵 notifications, cart, myOrders |
| **delivery** | 🟣 deliveries, orders |

## 📡 Tipos de Eventos en Tiempo Real

### Notificaciones
```json
{
  "type": "notification",
  "room": "notifications",
  "payload": {
    "title": "Nuevo pedido",
    "message": "Tienes un nuevo pedido #12345",
    "priority": "high",
    "action": "/orders/12345"
  }
}
```

### Actualizaciones de Pedidos
```json
{
  "type": "order_update",
  "room": "orders",
  "payload": {
    "orderId": "12345",
    "status": "shipped",
    "trackingNumber": "TRACK123"
  }
}
```

### Alertas de Inventario
```json
{
  "type": "inventory_alert",
  "room": "inventory",
  "payload": {
    "productId": "67890",
    "stockLevel": 5,
    "threshold": 10,
    "alert": "low_stock"
  }
}
```

### Mensajes Broadcast
```json
{
  "type": "broadcast",
  "room": "all",
  "payload": {
    "message": "Mantenimiento programado en 1 hora",
    "type": "warning"
  }
}
```

## 🚀 Despliegue y Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=8080
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Timeouts
WS_READ_TIMEOUT=60
WS_WRITE_TIMEOUT=10
WS_PING_INTERVAL=30
```

### Desarrollo Local

```bash
# Instalar dependencias
go mod download

# Ejecutar Redis con Docker
docker-compose up -d redis

# Ejecutar servicio
go run cmd/api/main.go
```

### Con Docker Compose

```bash
# Levantar todos los servicios (Redis + API)
docker-compose up -d

# Ver logs
docker-compose logs -f api1

# Escalar a múltiples instancias
docker-compose up -d --scale api1=3
```

### Build para Producción

```bash
# Compilar binario optimizado
go build -o bin/realtime-service cmd/api/main.go

# Ejecutar
./bin/realtime-service
```

## 🧪 Pruebas y Testing

### Ejecutar Tests

```bash
# Todos los tests
go test ./...

# Con cobertura
go test -cover ./...

# Tests específicos
go test ./internal/websockets/
```

### Generar Token de Prueba

```bash
# Usar utilidad token_gen.go
go run token_gen.go

# Output: Token JWT para testing
```

### Test Manual con WebSocket

Usar `test_backend.ps1` (PowerShell):

```powershell
# Ejecutar script de pruebas
.\test_backend.ps1
```

## 🔧 Configuración de Docker

### Dockerfile

**Multi-stage build** para optimización:

- **Stage 1 (builder)**: Compila el código Go
- **Stage 2 (runtime)**: Imagen Alpine ligera con binario

```dockerfile
FROM golang:1.20-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o realtime-service cmd/api/main.go

FROM alpine:3.18
COPY --from=builder /app/realtime-service /
EXPOSE 8080
CMD ["/realtime-service"]
```

### Docker Compose

**Servicios definidos:**

- `redis`: Base de datos en memoria (Pub/Sub)
- `api1`, `api2`: Instancias del servicio (escalables)

**Ventajas:**
- Sincronización automática vía Redis
- Load balancing entre instancias
- Alta disponibilidad

## 📊 Métricas y Monitoreo

### Logs

El servicio registra:
- Conexiones nuevas/cerradas
- Autenticaciones exitosas/fallidas
- Mensajes enviados/recibidos
- Errores y excepciones

### Endpoints de Salud

```bash
# Health check
GET http://localhost:8080/health

# Respuesta:
{
  "status": "healthy",
  "connections": 42,
  "uptime": "2h30m15s"
}
```

## 🔗 Integración con Otros Servicios

### REST Service (Node.js/TypeScript)

El servicio REST envía eventos al Realtime Service vía HTTP:

```typescript
// Enviar notificación
await axios.post('http://localhost:8080/api/notifications/send', {
  userId: '123',
  type: 'order_update',
  payload: { orderId: '456', status: 'shipped' }
});
```

### Frontend (React)

El frontend se conecta vía WebSocket:

```typescript
const ws = new WebSocket(`ws://localhost:8080/ws?token=${authToken}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleRealtimeEvent(message);
};
```

