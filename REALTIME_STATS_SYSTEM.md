# 🔔 Sistema de Notificaciones en Tiempo Real - Marketplace Espigón Manta

## 📋 Descripción General

Este sistema permite que las estadísticas del frontend se actualicen automáticamente en tiempo real cuando ocurren cambios importantes en el backend, sin necesidad de recargar la página o hacer polling manual.

## 🏗️ Arquitectura

```
REST Service → Redis (canal: events) → Realtime Service → WebSocket → React (refetch GraphQL)
```

### Flujo Completo:

1. **REST Service** detecta un cambio importante (orden creada, pago verificado, etc.)
2. **Publica evento** en Redis en el canal `events`
3. **Realtime Service** escucha el canal `events` de Redis
4. **Filtra por rol** y envía solo a los destinatarios correctos (ADMIN/SELLER)
5. **Frontend** recibe el evento por WebSocket
6. **React ejecuta refetch()** de Apollo Client para obtener datos actualizados
7. **Report Service** procesa la consulta GraphQL y devuelve estadísticas frescas

---

## 🔧 Componentes del Sistema

### 1. REST Service (backend/rest_service)

#### Archivo: `src/infrastructure/clients/statsEventClient.ts`

Nuevo módulo que publica eventos de estadísticas a Redis:

**Funciones principales:**
- `notifySellerStatsUpdated(sellerId, metadata)` - Notifica que stats del vendedor deben actualizarse
- `notifyAdminStatsUpdated(metadata)` - Notifica que stats globales deben actualizarse

**Tipos de eventos:**
- `ADMIN_STATS_UPDATED` - Evento global para administradores
- `SELLER_STATS_UPDATED` - Evento específico para un vendedor (requiere `seller_id`)

**Cuándo se publican:**
- ✅ Cuando se crea una nueva orden (`CreateOrder.ts`)
- ✅ Cuando se actualiza el estado de una orden (`UpdateOrderStatus.ts`)
- ✅ Cuando se verifica un pago (`orderController.ts - verifyPayment`)
- ✅ Cuando se marca una orden como entregada (`orderController.ts - markOrderAsDelivered`)

**Ejemplo de uso:**
```typescript
import { notifySellerStatsUpdated, notifyAdminStatsUpdated } from '../clients/statsEventClient';

// Notificar a un vendedor específico
await notifySellerStatsUpdated('123', {
  order_id: 456,
  status: 'delivered',
  action: 'order_delivered'
});

// Notificar a todos los admins
await notifyAdminStatsUpdated({
  order_id: 456,
  action: 'order_created'
});
```

---

### 2. Realtime Service (backend/realtime_service)

#### Cambios realizados:

**A. Estructura Client actualizada (`internal/websockets/client.go`):**
```go
type Client struct {
    ID       string
    UserID   string
    Role     string  // "ADMIN", "SELLER", "CLIENT"
    SellerID string  // ID del vendedor (solo si Role == "SELLER")
    Conn     *websocket.Conn
    Rooms    map[string]bool
    send     chan []byte
    closeOnce sync.Once
}
```

**B. Filtrado de eventos (`internal/websockets/hub.go`):**

Nueva función `BroadcastStatsEvent()` que:
- Parsea el evento recibido desde Redis
- Filtra destinatarios según tipo de evento y rol
- Envía solo a los clientes apropiados

**Lógica de filtrado:**
```go
switch event.Type {
case "ADMIN_STATS_UPDATED":
    // Solo a clientes con Role == "ADMIN"
    
case "SELLER_STATS_UPDATED":
    // Solo a clientes con Role == "SELLER" 
    // Y donde client.SellerID == event.SellerID
}
```

**C. Suscripción a Redis (`internal/websockets/redis_pubsub.go`):**

Ahora escucha **DOS** canales:
1. `ws:room:*` - Mensajes de salas normales (chat, notificaciones)
2. `events` - Eventos de actualización de estadísticas

```go
r.sub = r.client.PSubscribe(r.ctx, "ws:room:*", "events")

// Distinguir entre tipos de mensajes
if msg.Channel == "events" {
    r.hub.BroadcastStatsEvent([]byte(msg.Payload))
} else {
    room := strings.TrimPrefix(msg.Channel, "ws:room:")
    handler(room, []byte(msg.Payload))
}
```

---

### 3. Frontend (frontend/src)

#### A. Hook personalizado: `hooks/useWebSocket.ts`

**Características:**
- ✅ Conexión automática con token JWT
- ✅ Reconexión automática en caso de desconexión
- ✅ Callback `onStatsUpdate` para manejar eventos
- ✅ Manejo de estados de conexión
- ✅ Cleanup automático al desmontar

**Uso:**
```typescript
import { useWebSocket } from '@/hooks/useWebSocket';

const { isConnected } = useWebSocket({
  token: localStorage.getItem('token'),
  onStatsUpdate: (event) => {
    if (event.type === 'SELLER_STATS_UPDATED') {
      refetchStats(); // Refetch GraphQL
    }
  },
  onConnect: () => console.log('Connected'),
  debug: true
});
```

#### B. Integración en SellerAnalytics (`components/SellerAnalytics.tsx`):

```typescript
const { refetch: refetchStats } = useQuery(GET_SELLER_DASHBOARD_STATS);

useWebSocket({
  token: localStorage.getItem('token'),
  onStatsUpdate: (event) => {
    if (event.type === 'SELLER_STATS_UPDATED' && 
        event.seller_id === sellerId?.toString()) {
      refetchStats();      // Refetch stats
      refetchProducts();   // Refetch best products
    }
  }
});
```

**Indicador visual:**
- 🟢 Verde cuando está conectado
- 🟡 Amarillo cuando está desconectado/reconectando

#### C. Integración en AdminDashboard (`pages/admin/AdminDashboard.tsx`):

```typescript
useWebSocket({
  token: localStorage.getItem('token'),
  onStatsUpdate: (event) => {
    if (event.type === 'ADMIN_STATS_UPDATED') {
      refetchStats();
      refetchSales();
      refetchClients();
    }
  }
});
```

---

## 📊 Flujo de Datos Completo

### Ejemplo: Vendedor verifica un pago

```
1. Vendedor hace clic en "Aprobar Pago" en el frontend
   ↓
2. Frontend → POST /api/orders/:id/verify-payment
   ↓
3. REST Service (orderController.ts):
   - Actualiza orden en PostgreSQL
   - Publica evento a Redis:
     {
       type: "SELLER_STATS_UPDATED",
       seller_id: "123",
       metadata: { order_id: 456, status: "payment_confirmed" }
     }
     {
       type: "ADMIN_STATS_UPDATED",
       metadata: { order_id: 456, action: "payment_verified" }
     }
   ↓
4. Realtime Service (redis_pubsub.go):
   - Recibe evento del canal "events"
   - Llama a hub.BroadcastStatsEvent()
   ↓
5. Hub (hub.go):
   - SELLER_STATS_UPDATED: busca clientes con Role="SELLER" y SellerID="123"
   - ADMIN_STATS_UPDATED: busca clientes con Role="ADMIN"
   - Envía evento solo a ellos
   ↓
6. Frontend (useWebSocket):
   - Recibe evento por WebSocket
   - Callback onStatsUpdate() se ejecuta
   ↓
7. React (Apollo Client):
   - refetch() ejecuta queries GraphQL
   ↓
8. Report Service:
   - Procesa query
   - Consulta REST Service
   - Retorna estadísticas actualizadas
   ↓
9. Frontend actualiza la UI automáticamente 🎉
```

---

## 🔒 Seguridad y Filtrado

### ¿Por qué es seguro?

1. **Autenticación JWT**: El WebSocket requiere token válido
2. **Filtrado por Rol**: El realtime_service filtra eventos según rol del cliente
3. **Filtrado por ID**: Vendedores solo reciben sus propios eventos
4. **Sin datos sensibles**: Los eventos NO contienen datos completos, solo IDs y metadatos

### ¿Qué recibe cada rol?

| Evento                | ADMIN | SELLER (propio) | SELLER (otro) | CLIENT |
|-----------------------|-------|-----------------|---------------|--------|
| ADMIN_STATS_UPDATED   | ✅    | ❌              | ❌            | ❌     |
| SELLER_STATS_UPDATED  | ❌    | ✅              | ❌            | ❌     |

---

## 🚀 Despliegue y Configuración

### Variables de Entorno

**REST Service (.env):**
```env
REDIS_URL=redis://localhost:6379
```

**Realtime Service (.env):**
```env
REDIS_ADDR=redis:6379
REDIS_PASSWORD=
JWT_SECRET=supersecreto123  # DEBE ser el mismo que rest_service
```

**Frontend (.env):**
```env
VITE_WS_URL=ws://localhost:8085
VITE_REPORT_SERVICE_URL=http://localhost:4000/graphql
```

### Docker Compose

El `realtime_service/docker-compose.yml` ya incluye Redis:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  api1:
    build: .
    environment:
      - REDIS_ADDR=redis:6379
    ports:
      - "8085:8080"
```

---

## 🧪 Pruebas

### 1. Verificar Redis
```bash
docker ps | grep redis
redis-cli ping  # Debería responder: PONG
```

### 2. Verificar REST Service
```bash
# Ver logs
cd backend/rest_service
npm run dev
# Buscar: "✅ Redis connected successfully"
```

### 3. Verificar Realtime Service
```bash
cd backend/realtime_service
docker-compose up
# Buscar: "Redis pub/sub started successfully (listening to 'ws:room:*' and 'events')"
```

### 4. Verificar Frontend
```bash
cd frontend
npm run dev
# Abrir consola del navegador
# Buscar: "✅ WebSocket connected"
```

### 5. Prueba end-to-end

1. Iniciar sesión como **Vendedor**
2. Ir a Dashboard → Análisis
3. Verificar indicador verde "Actualizaciones en tiempo real activadas"
4. En otra pestaña, crear una orden como cliente
5. Verificar en consola del navegador:
   ```
   📊 Stats update received: {type: "SELLER_STATS_UPDATED", ...}
   🔄 Refetching seller stats...
   ```
6. Las estadísticas deben actualizarse automáticamente

---

## 📝 Logs y Debugging

### Frontend (Consola del navegador):

```javascript
// Habilitar debug mode en useWebSocket
useWebSocket({
  token: token,
  onStatsUpdate: (event) => { ... },
  debug: true  // ← Activar logs detallados
});
```

**Logs esperados:**
```
[WebSocket] Connecting to: ws://localhost:8085/ws?token=...
[WebSocket] Connected
[WebSocket] Message received: {type: "SELLER_STATS_UPDATED", ...}
```

### Backend (Terminal):

**REST Service:**
```
✅ Stats event published: SELLER_STATS_UPDATED (seller: 123)
✅ Stats event published: ADMIN_STATS_UPDATED (global)
```

**Realtime Service:**
```
client connected: id=conn-1234 user=5 role=SELLER seller_id=123
Broadcasting SELLER_STATS_UPDATED to seller 123 (2 clients)
```

---

## ❓ Troubleshooting

### Problema: "WebSocket disconnected"

**Solución:**
- Verificar que realtime_service esté corriendo
- Verificar URL en frontend/.env: `VITE_WS_URL=ws://localhost:8085`
- Verificar token JWT válido

### Problema: "Stats no se actualizan"

**Checklist:**
1. ✅ Redis está corriendo?
2. ✅ REST Service publicó el evento? (ver logs)
3. ✅ Realtime Service recibió el evento? (ver logs)
4. ✅ Frontend está conectado al WebSocket?
5. ✅ El rol del usuario es correcto? (ADMIN/SELLER)
6. ✅ El seller_id coincide? (para vendedores)

### Problema: "Redis not connected"

**Solución:**
```bash
# En realtime_service:
docker-compose up redis

# En rest_service:
# Verificar REDIS_URL en .env
REDIS_URL=redis://localhost:6379
```

### Problema: "Eventos llegan a usuarios incorrectos"

**Verificar:**
- JWT contiene `role` y `seller_id`?
- Realtime Service está filtrando correctamente? (ver logs)

---

## 🎯 Próximas Mejoras

### Corto plazo:
- [ ] Agregar eventos para productos (crear, actualizar, eliminar)
- [ ] Notificaciones de stock bajo
- [ ] Eventos de nuevos clientes registrados

### Mediano plazo:
- [ ] Persistencia de eventos (Event Sourcing)
- [ ] Métricas de latencia de eventos
- [ ] Dashboard de monitoreo de WebSockets

### Largo plazo:
- [ ] Soporte para múltiples instancias con balanceo de carga
- [ ] Sistema de replay de eventos perdidos
- [ ] Compresión de mensajes grandes

---

## 👥 Roles y Responsabilidades

### realtime_service:
- ❌ NO consulta la base de datos
- ❌ NO calcula estadísticas
- ✅ Escucha eventos de Redis
- ✅ Filtra por rol
- ✅ Envía notificaciones

### report_service:
- ✅ Calcula estadísticas
- ✅ Consulta REST service
- ✅ Responde queries GraphQL

### rest_service:
- ✅ Maneja lógica de negocio
- ✅ Actualiza base de datos
- ✅ Publica eventos a Redis

### frontend:
- ✅ Conecta al WebSocket
- ✅ Escucha eventos
- ✅ Ejecuta refetch de GraphQL

---

## 📚 Referencias

- [Redis Pub/Sub](https://redis.io/docs/manual/pubsub/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Apollo Client Refetch](https://www.apollographql.com/docs/react/data/queries/#refetching)
- [Go WebSocket (gorilla/websocket)](https://github.com/gorilla/websocket)

---

## ✅ Resumen

**¿Qué logra este sistema?**

1. ✅ **Actualizaciones en tiempo real** sin polling
2. ✅ **Filtrado seguro** por rol y ID
3. ✅ **Desacoplamiento** entre servicios
4. ✅ **Escalabilidad** mediante Redis Pub/Sub
5. ✅ **Experiencia de usuario mejorada** con UI siempre actualizada

**Flujo simple:**
```
Orden creada/actualizada → Redis → WebSocket → Refetch GraphQL → UI actualizada 🎉
```

---

**Implementado por:** Saul Castro  
**Fecha:** 15 de noviembre de 2025  
**Versión:** 1.0.0
