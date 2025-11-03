
# Docker / docker-compose para realtime_service

Este archivo explica cómo ejecutar localmente `realtime_service` con Redis usando `docker-compose`.

Requisitos
- Tener Docker y docker-compose instalados en tu máquina.

Arrancar el stack

PowerShell:

```powershell
cd backend/realtime_service
docker compose up --build
```

Qué inicia
- `redis`: servidor Redis expuesto en el puerto del host 6379.
- `api1`: la primera instancia de la API (host:8080 -> contenedor:8080).
- `api2`: la segunda instancia de la API (host:8081 -> contenedor:8080).

Prueba rápida
- Conecta un cliente WebSocket a `ws://localhost:8080/ws` y otro a `ws://localhost:8081/ws`.
- Haz que ambos clientes se unan a la misma room y envía un mensaje de broadcast. Deberías ver que el mensaje llega a los clientes en ambas instancias (replicación vía Redis Pub/Sub).

Detener el stack

```powershell
docker compose down
```

Notas
- El `docker-compose.yml` configura `JWT_SECRET=prueba` y `REDIS_ADDR=redis:6379`. En producción usa secretos seguros y TLS.
- Si quieres más réplicas, puedes añadir más servicios `api` o usar una orquestación (Docker Swarm / Kubernetes).
