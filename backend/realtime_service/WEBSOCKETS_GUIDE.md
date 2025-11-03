# Guía de implementación de WebSockets (Go) — realtime_service

Este documento explica el estado actual del PoC de WebSockets, qué se ha implementado hasta ahora, qué falta por implementar y para qué sirve cada pieza. También incluye pasos rápidos para probar lo que hay en el repositorio.

## Resumen breve

- Estado: PoC funcional en local.
- Endpoint principal: `/ws` (handshake WebSocket con JWT).
- Autenticación: JWT (header Authorization o `?token=`).
- Gestión de conexiones: `Hub` en memoria con soporte de `rooms`.
- Mensajería: soporte básico de `join`, `leave`, `broadcast` y eco por defecto.

## Qué se ha implementado hasta ahora 

1. Endpoint WebSocket y handler
	- Archivos: `cmd/api/main.go`, `internal/websockets/handler.go`
	- Qué hace: realiza el upgrade HTTP→WebSocket y crea un `Client` para cada conexión.
	- Para qué sirve: permite a clientes abrir una conexión persistente y recibir/enviar mensajes en tiempo real.

2. Validación de JWT en el handshake
	- Archivo: `internal/websockets/auth.go`
	- Qué hace: valida tokens JWT enviados en `Authorization: Bearer <token>` o en `?token=<token>`; extrae `user_id`.
	- Para qué sirve: autenticar clientes antes de aceptar la conexión y asociar metadatos (user_id) a la sesión.

3. Client y Hub (gestión de conexiones)
	- Archivos: `internal/websockets/client.go`, `internal/websockets/hub.go`
	- Qué hace: mantiene clientes conectados en memoria, genera IDs de conexión, registra/desregistra y mantiene membership en salas.
	- Para qué sirve: punto de control para enviar mensajes dirigidos (por user) y manejar grupos (rooms).

4. Soporte de salas / canales
	- Archivo: `internal/websockets/hub.go` (métodos `JoinRoom`, `LeaveRoom`, `BroadcastRoom`)
	- Qué hace: agrupa conexiones por nombre de sala y reenvía mensajes a todos los miembros de una sala.
	- Para qué sirve: casos de uso como chat por sala, notificaciones de orden por ID de orden, topics por suscripción.

5. Parsing de mensajes y manejo básico
	- Archivos: `internal/websockets/handler.go`, `internal/websockets/message.go`
	- Qué hace: interpreta mensajes JSON con la forma `{ "type": "...", "payload": { ... } }`. Soporta `join`, `leave`, `broadcast`. Si el mensaje no es JSON, se ecoa.
	- Para qué sirve: permite construír protocolos de mensajes simples entre cliente y servidor (chat, notificaciones, comandos).

6. Logging y mensajes de error descriptivos
	- Archivos: `internal/websockets/handler.go`, `internal/websockets/auth.go`
	- Qué hace: registra conexiones, desconexiones y razones de fallo en la validación JWT (secreto ausente, firma inválida, expirado, etc.).
	- Para qué sirve: depuración y trazabilidad en la fase PoC.

7. Utilidad de generación de token para pruebas
	- Archivo: `token_gen.go` (PoC local)
	- Qué hace: genera JWT firmados con la secret de pruebas (`prueba`).
	- Para qué sirve: generar tokens para probar la conexión localmente con `wscat`.

## Qué falta por implementar

1. Dashboard/UI en tiempo real
	- Qué falta: una ruta `/admin/clients` o una página web que muestre conexiones activas, salas y métricas (con actualizaciones en tiempo real: SSE, polling o WebSocket interno).
	- Por qué: visibilidad operativa; monitorizar clientes, detectar problemas y depurar en entorno de QA/producción.

2. Pub/Sub multi-instancia (Redis / NATS)
	- Qué falta: integración `pubsub` para publicar/recibir eventos entre instancias (archivos `pubsub.go`, `redis_pubsub.go`).
	- Por qué: actualmente el `Hub` está en memoria; para escalar a múltiples réplicas necesitas sincronizar eventos (p. ej. broadcasts) entre instancias.

# Guía de implementación de WebSockets (Go) — realtime_service

Este documento describe el estado actual del PoC de WebSockets, qué se ha implementado hasta ahora, y cómo probarlo localmente.

## Estado general (resumen)

- Estado: PoC funcional y compilable.
- Endpoint principal: `/ws` (handshake WebSocket con JWT).
- Autenticación: JWT (Authorization header o `?token=`). El `JWT_SECRET` se lee desde la variable de entorno.
- Gestión de conexiones: `Hub` en memoria con soporte de `rooms`.
- Mensajería: `join`, `leave`, `broadcast` y reenvío mediante un `Envelope` estándar.

## Qué se ha implementado (detallado)

1) Endpoint WebSocket y handler
   - Archivos clave: `cmd/api/main.go`, `internal/websockets/handler.go`.
   - Comportamiento: realiza el upgrade HTTP→WebSocket, valida JWT en el handshake y crea un `Client` por conexión.

2) Validación de JWT y secret por entorno
   - Archivo: `internal/websockets/auth.go`.
   - Detalles: se aceptan tokens en `Authorization: Bearer <token>` o `?token=<token>`. El secreto se lee desde `JWT_SECRET` (env), lo que facilita pruebas y despliegues.

3) Client, Hub y gestión de salas
   - Archivos: `internal/websockets/client.go`, `internal/websockets/hub.go`.
   - Funcionalidad: registro/desregistro de clientes, join/leave de rooms y snapshot para endpoint admin.

4) Envelope estándar para broadcasts
   - Archivo: `internal/websockets/message.go` (contiene `Message` y `Envelope`).
   - Detalles: cuando un cliente hace `broadcast`, el servidor envía un `Envelope` JSON con campos básicos (ej. from, room, ts, body) para estandarizar la entrega.

5) Pub/Sub (skeleton) e integración con Hub
   - Archivos: `internal/websockets/pubsub.go` (interfaz) y `internal/websockets/redis_pubsub.go` (implementación Redis).
   - Estado: la interfaz PubSub está integrada en `Hub` y hay una implementación basada en Redis que publica/subscribe mensajes por canal `ws:room:<room>`. La implementación duplicada que causaba errores fue limpiada y ahora el proyecto compila.

6) Endpoint admin (snapshot)
   - Ruta: `/admin/clients` (implementación PoC).
   - Qué devuelve: snapshot JSON con número de clientes y miembros por sala (útil para debugging y UI simple).

7) Docker + docker-compose para pruebas locales
   - Archivos añadidos: `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `README_DOCKER.md`.
   - Funcionamiento: `docker compose up --build` arranca Redis y dos instancias de la API (puertos host 8080 y 8081) para probar replicación vía Redis Pub/Sub.

## Cómo probar localmente

Opción A — ejecución directa (dev)

1. Establece el secret y ejecuta el binario:

```powershell
$env:JWT_SECRET = "prueba"
go run ./cmd/api
```

2. Genera un token de prueba (si usas la utilidad `token_gen.go`) y conéctate con `wscat`:

```powershell
go run .\token_gen.go
wscat -c "ws://localhost:8080/ws" -H "Authorization: Bearer <TOKEN>"
```

3. Mensajes de ejemplo (desde cliente):

```json
{"type":"join","payload":{"room":"room-1"}}
{"type":"broadcast","payload":{"room":"room-1","body":"Hola sala 1"}}
```

Opción B — con Docker (recomendado para probar múltiples instancias)

1. Levanta el stack:

```powershell
cd backend/realtime_service
docker compose up --build
```

2. Conecta dos clientes a `ws://localhost:8080/ws` y `ws://localhost:8081/ws`. Únelos a la misma room y envía un `broadcast`. Deberías ver la réplica del mensaje entre instancias vía Redis.

3. Para detener:

```powershell
docker compose down
```

## Estado de calidad y build

- Se resolvieron errores previos en `redis_pubsub.go` (duplicados/imports) y la compilación de `./cmd/api` fue verificada.

## Próximos pasos recomendados (priorizados)

1. Añadir reconexión y backoff en `redis_pubsub.go` (robustez ante caídas de Redis).
2. Añadir métricas (`/metrics`) y logs estructurados (Prometheus + JSON).
3. Implementar tests unitarios e integración (incluyendo E2E con docker-compose).
4. Mejorar seguridad: `CheckOrigin`, limites por mensaje/conexión y TLS (`wss://`).
5. Crear una interfaz `/admin` simple (UI) que consuma `/admin/clients` para facilitar demos.

## Notas finales

- Este repo contiene un PoC completo y ampliable: la idea es mantener el `Hub` simple (in-memory) y delegar la replicación a la capa Pub/Sub para permitir escalado horizontal.
- Si quieres, puedo:
  - Añadir reconexión con backoff en `redis_pubsub.go`.
  - Crear una página `/admin` estática que muestre el snapshot.
  - Preparar tests E2E que usen `docker compose`.


