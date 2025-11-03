# Plan de implementación: Websockets (tareas paso a paso)

Este documento contiene las tareas priorizadas y las instrucciones paso a paso para completar la parte de WebSockets del servicio `realtime_service`.

## Objetivo

Dejar la implementación de WebSockets en un estado seguro, escalable y verificable: evitar data races, soportar pub/sub (Redis), manejo correcto de conexiones (ping/pong, deadlines), backpressure y cierre ordenado.

## Requisitos previos

- Tener Go instalado (1.20+). 
- Variables de entorno mínimas en desarrollo: `JWT_SECRET` (obligatorio). Opcionales: `REDIS_ADDR`, `REDIS_PASSWORD`, `BACKEND_URL`, `WS_ORIGINS`.
- (Opcional) Redis local para pruebas de Pub/Sub.

## Variables de entorno recomendadas

- JWT_SECRET=secreto
- REDIS_ADDR=localhost:6379
- REDIS_PASSWORD=
- BACKEND_URL=http://backend:8080
- WS_ORIGINS=http://localhost:3000,https://mi-app

## Criterios de aceptación (qué significa "acabado")

- No existen escrituras concurrentes sobre `websocket.Conn` (solo la write pump escribe).
- Conexiones muertas se detectan (ping/pong y deadlines funcionan).
- Hub no bloquea por I/O y clientes lentos no caen en DoS de la instancia.
- Pub/Sub (Redis) propaga mensajes entre instancias y se cierra ordenadamente.
- `go test ./... -race` no reporta data races en los paquetes que hemos modificado (mínimo `internal/websockets`).

---

## Pasos prioritarios (hacer en este orden)

1) Implementar write pump por cliente (imprescindible)
	 - Archivos a cambiar: `internal/websockets/client.go`, `internal/websockets/handler.go`, `internal/websockets/hub.go`.
	 - Cambios concretos:
		 - Añadir al struct `Client` un campo `send chan []byte` (bufferado, p.ej. 256) y mecanismos de cierre (`closed chan struct{}` o `sync.Once`).
		 - Crear una goroutine `writePump` que lea de `client.send` y haga `Conn.SetWriteDeadline(...)` y `Conn.WriteMessage(websocket.TextMessage, msg)` solo desde esa goroutine.
		 - Cambiar la función pública `Send` para que haga push al canal `send` con un `select` y un caso `default` (si el buffer está lleno, desconectar el cliente o contar drops — se recomienda desconectar para simplificar).
	 - Cómo probar localmente:
		 - Ejecutar `go test ./internal/websockets -run Test...` (añade tests luego). 
		 - Ejecutar el servicio y abrir múltiples clientes que envíen mensajes concurrentes para verificar que no hay panics.

2) Implementar read pump robusto con ping/pong y deadlines
	 - Archivos a cambiar: `internal/websockets/handler.go`, `internal/websockets/client.go` (si hace falta).
	 - Cambios concretos:
		 - Antes del loop de lectura, establecer `conn.SetReadLimit(MaxMessageSize)` (ya existe), `conn.SetReadDeadline(time.Now().Add(pongWait))` y `conn.SetPongHandler(func(string) error { conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })`.
		 - Arrancar una goroutine que envíe pings periódicos (pingPeriod < pongWait) y cierre la conexión si el write pump termina.
		 - En el loop de lectura, ante error, cerrar `send` y llamar `h.Unregister(client)`.
	 - Verificación:
		 - Conectar un cliente que no responda a pings y verificar que se desconecta en el plazo esperado.

3) Modificar `Hub` para envío no bloqueante (usar canales)
	 - Archivo: `internal/websockets/hub.go`.
	 - Cambios concretos:
		 - Cuando se difunda un mensaje, copiar la lista de destinatarios bajo `mu` y luego, fuera del lock, enviar `select { case c.send <- msg: default: // manejar cliente lento -> desconectar }`.
		 - Evitar llamadas directas a `Client.Send` que hagan I/O blocking mientras se mantiene el lock.
		 - Alternativa/Mejora opcional: reescribir `Hub.Run()` con canales (`register`, `unregister`, `publish`) para eliminar locking explícito.
	 - Verificación:
		 - Simular varios clientes y forzar que uno sea lento; comprobar que la difusión no se bloquea y que el cliente lento se desconecta según la política.

4) Cierre ordenado de conexiones al apagar el Hub
	 - Archivo: `internal/websockets/hub.go`.
	 - Cambios concretos:
		 - Implementar `Hub.Close()` para iterar `h.clients` y cerrar cada cliente (cerrar su `send` y `Conn`) y esperar que write pumps terminen.
		 - Asegurar que `pub.Close()` se invoca y se espera.
	 - Verificación:
		 - Arrancar el servicio, forzar SIGTERM y comprobar que el proceso cierra ordenadamente sin goroutines huérfanas.

5) Manejo de backpressure y política de desconexión
	 - Archivos: `client.go`, `hub.go`.
	 - Cambios concretos:
		 - Elegir un tamaño de buffer (p.ej. 256) para `client.send`.
		 - Si al enviar no hay espacio (`default` case), desconectar al cliente y loggear la razón (cliente lento).
	 - Verificación:
		 - Tests que llenen el canal de un cliente y comprueben que se desconecta y que otros clientes siguen recibiendo mensajes.

---

## Pasos secundarios (importantes antes de producción)

6) Robustecer `RedisPubSub` (reconexión y cierre)
	 - Archivo: `internal/websockets/redis_pubsub.go`.
	 - Cambios:
		 - Asegurar que si `PSubscribe` falla, se reintenta con backoff exponencial y no se crean goroutines duplicadas.
		 - Asegurar que `Close()` cancela contexto y que la goroutine de `Start()` sale correctamente.
	 - Verificación:
		 - Test de integración con Redis (arrancar Redis via Docker Compose) y comprobar reintentos cortos ante cortes.

7) Asegurar `Upgrader` y orígenes permitidos
	 - Archivo: `internal/websockets/handler.go` (upgrader var) y `internal/config/config.go`.
	 - Cambios:
		 - No usar `CheckOrigin: func(...) bool { return true }` en producción. Leer `WS_ORIGINS` y comprobar el header `Origin`.
	 - Verificación:
		 - Intentar conectar desde un origen no permitido y confirmar que se rechaza.

8) Centralizar configuración (JWT_SECRET, REDIS_ADDR)
	 - Pasar `JWT_SECRET` desde `internal/config` al paquete `websockets` o añadir una función inicializadora para pruebas.
	 - Verificación: tests que inyecten `JWT_SECRET` sin depender de variables globales en paquetes.

9) Pruebas y detector de data races
	 - Añadir tests unitarios: `hub_test.go`, `redis_pubsub_test.go`.
	 - Ejecutar:
```
go test ./... -v
go test ./... -race
```

10) Documentación y contrato de autorización
	 - Documentar en este archivo el formato de mensajes JSON (join/leave/broadcast/envelope) y el contrato/backends que `CanJoinRoom` espera (endpoints, formato de respuesta JSON `{ "allowed": true }`).

---

## Comandos rápidos para verificar durante el desarrollo

Ejecutar tests y race detector:

```powershell
cd c:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\realtime_service
go test ./... -v
go test ./... -race
```

Construir y ejecutar local:

```powershell
$env:JWT_SECRET = "prueba";
go run ./cmd/api
```

Ejecutar con Docker Compose (incluye Redis):

```powershell
docker-compose up --build
```

## Notas finales

- Voy a ir implementando los pasos prioritarios si me das OK; iré aplicando cambios en pequeños commits y ejecutaré `go test -race` tras cada bloque de cambios.
- Si prefieres que implemente un subconjunto primero (por ejemplo: write pump + Hub non-blocking), dime y empiezo por esos archivos.

---

Fecha: 2025-11-03

