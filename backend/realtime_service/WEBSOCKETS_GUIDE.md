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

3. Envelope de mensajes enriquecido y contratos
	- Qué falta: enviar reenvíos con un envelope estándar `{from, room, ts, body, meta}` en vez de solo el body.
	- Por qué: los clientes necesitan metadatos para mostrar origen, ordenar mensajes y trazar eventos.

4. Observabilidad: métricas y logs estructurados
	- Qué falta: endpoint `/metrics` (Prometheus), logs en formato estructurado y contadores (conexiones activas, mensajes/s).
	- Por qué: para operar el servicio en producción y alertar sobre anomalías.

5. Seguridad y hardening
	- Qué falta: restringir `CheckOrigin`, habilitar TLS (wss://), aplicar rate-limits y límites por usuario/conexión.
	- Por qué: mitigar ataques y cumplir con prácticas de seguridad en producción.

6. Tests automatizados
	- Qué falta: unit tests para `auth.ValidateToken`, `Hub` y tests de integración end-to-end que verifiquen handshake y flujo de mensajes.
	- Por qué: asegurar regresiones y facilitar refactorizaciones.

7. Docker y despliegue con dependencias (ej. Redis)
	- Qué falta: `Dockerfile` y `docker-compose.yml` para arrancar el servicio junto a Redis (dev).
	- Por qué: facilitar pruebas locales y despliegue reproducible.

8. Manejo avanzado de clientes
	- Qué falta: read/write pumps separados, ping/pong, reconexión, límites de tamaño de mensajes, autenticación refresh.
	- Por qué: robustez en conexiones reales y resistencia a fallos de red.

## Para qué sirve cada cosa 

- `/ws` (handler): puerta de entrada para conexiones reales; autentica y crea `Client`.
- `auth.go`: garantiza que solo usuarios válidos abran sockets (seguridad en la etapa de handshake).
- `client.go` / `hub.go`: mantienen el estado de conexiones y rutas de mensajes (core de mensajería en memoria).
- `message.go` / handler parsing: define el contrato de comunicación entre cliente y servidor.
- `token_gen.go`: herramienta de desarrollo para pruebas locales.

## Recomendación de roadmap (prioridad)

1. Añadir `/admin/clients` y logging/métricas básicas (visibilidad rápida).
2. Implementar envelope JSON estándar y mejorar logs (cliente/room/ts).
3. Añadir Pub/Sub con Redis (esqueleto + integración) y probar con 2 instancias.
4. Añadir Docker + docker-compose con Redis para entorno dev.
5. Tests automatizados y ajustes de seguridad (origin, TLS, rate limiting).

## Cómo comprobar lo implementado ahora (recordatorio rápido)

1. Terminal A (servidor):
```powershell
$env:JWT_SECRET = "prueba"
go run ./cmd/api
```

2. Terminal B (cliente):
```powershell
go run .\token_gen.go
wscat -c "ws://localhost:8080/ws" -H "Authorization: Bearer <TOKEN>"
```

3. Ejemplos de mensajes (desde wscat):
```json
{"type":"join","payload":{"room":"room-1"}}
{"type":"broadcast","payload":{"room":"room-1","body":"Hola sala 1"}}
```


