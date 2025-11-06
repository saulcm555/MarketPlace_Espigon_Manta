# ============================================
# GUÍA: CÓMO PROBAR TU BACKEND
# ============================================
# Marketplace Espigon - Manta
# Sistema de Notificaciones en Tiempo Real
# ============================================

## 📋 REQUISITOS PREVIOS

Antes de empezar, asegúrate de tener:

1. **Docker Desktop** instalado y corriendo
2. **Node.js** instalado (v18 o superior)
3. **Go** instalado (v1.20 o superior)
4. **Git** para clonar el repositorio

---

## 🚀 PASO 1: INICIAR LOS SERVICIOS

### 1.1 Iniciar Realtime Service (WebSocket + Redis)

```powershell
# Navega a la carpeta del servicio
cd C:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\realtime_service

# Inicia los contenedores Docker
docker compose up -d

# Verifica que estén corriendo (deberías ver 3 contenedores)
docker compose ps
```

**Resultado esperado:**
```
NAME                          STATUS              PORTS
realtime_service-api1-1      Up 10 seconds       0.0.0.0:8080->8080/tcp
realtime_service-api2-1      Up 10 seconds       0.0.0.0:8081->8081/tcp
realtime_service-redis-1     Up 10 seconds       0.0.0.0:6379->6379/tcp
```

### 1.2 Iniciar REST Service (API Node.js)

```powershell
# Abre una NUEVA terminal PowerShell
cd C:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\rest_service

# Instala dependencias (solo la primera vez)
npm install --legacy-peer-deps

# Inicia el servidor en modo desarrollo
npm run dev
```

**Resultado esperado:**
```
✅ Conexión a la base de datos establecida correctamente
✅ Redis connected successfully
🚀 Servidor Express corriendo en puerto 3000
```

---

## ✅ PASO 2: VERIFICAR QUE TODO FUNCIONA

Ejecuta el script de verificación:

```powershell
cd C:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\realtime_service
.\test_backend.ps1
```

**¿Qué verifica este script?**
- ✅ Redis funcionando
- ✅ Realtime Service respondiendo
- ✅ REST Service respondiendo
- ✅ Sistema de notificaciones operativo
- ✅ Mensajes publicándose correctamente

**Resultado esperado:**
```
✅ Redis funcionando
✅ Realtime Service funcionando
✅ REST Service funcionando
✅ Mensaje publicado
✅ 2 suscriptores recibieron el mensaje
```

---

## 🔌 PASO 3: PROBAR WEBSOCKET (OPCIONAL)

Si quieres ver notificaciones en tiempo real en un cliente WebSocket:

### 📝 RESUMEN RÁPIDO DEL FLUJO COMPLETO

```powershell
# 1. Generar token JWT
cd C:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\realtime_service
$env:JWT_SECRET = (Select-String -Path .env -Pattern "JWT_SECRET=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }); go run token_gen.go
# Copia el token que aparece

# 2. Conectar con wscat (reemplaza TOKEN_AQUI)
wscat -c "ws://localhost:8080/ws?token=TOKEN_AQUI"

# 3. Una vez conectado, unirse a sala (envía este JSON):
{"type":"join","payload":{"room":"client-user-123"}}

# 4. En OTRA terminal, enviar notificación de prueba:
docker exec realtime_service-redis-1 redis-cli PUBLISH ws:room:client-user-123 '{"type":"notification","data":{"message":"Test!"}}'

# ¡Verás el mensaje en tiempo real en la primera terminal! 🎉
```

### Pasos Detallados:

### 3.1 Generar Token de Autenticación

```powershell
cd C:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\realtime_service
$env:JWT_SECRET = (Select-String -Path .env -Pattern "JWT_SECRET=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }); go run token_gen.go
```

Esto generará un token JWT. **Cópialo**. 

**Nota:** El comando carga automáticamente el JWT_SECRET desde tu archivo `.env` antes de generar el token.

### 3.2 Instalar wscat (solo una vez)

```powershell
npm install -g wscat
```

### 3.3 Conectar al WebSocket

```powershell
wscat -c "ws://localhost:8080/ws?token=PEGA_TU_TOKEN_AQUI"
```

### 3.4 Unirse a una Sala

Una vez conectado, escribe:

```json
{"type":"join","payload":{"room":"client-user-123"}}
```

**Importante:** El formato de la sala debe ser `client-{user_id}` donde `user_id` coincide con el usuario del token. Como el token generado tiene `user_id: "user-123"`, la sala debe ser `client-user-123`.

**Resultado esperado:**
```json
{"type":"joined","payload":{"room":"client-user-123"}}
```

### 3.5 Enviar Notificación de Prueba

En **otra terminal PowerShell**, publica un mensaje de prueba directamente a Redis:

```powershell
cd C:\Users\Lilibeth\MarketPlace_Espigon_Manta\backend\realtime_service
.\test_backend.ps1
```

O publica un mensaje específico a tu sala:

```powershell
docker exec realtime_service-redis-1 redis-cli PUBLISH ws:room:client-user-123 '{"type":"notification","data":{"message":"Hola desde Redis!","timestamp":"2024-11-05T12:00:00Z"}}'
```

**¡Verás el mensaje llegar en tiempo real en tu terminal de wscat!** 🎉

**Ejemplo de salida en wscat:**
```json
< {"type":"notification","payload":{"message":"Hola desde Redis!","timestamp":"2024-11-05T12:00:00Z"}}
```

---

## 📊 ENDPOINTS DISPONIBLES

### REST Service (Puerto 3000)

- **GET** `http://localhost:3000/` - Health check
- **GET** `http://localhost:3000/api-docs` - Swagger documentation
- **POST** `http://localhost:3000/api/auth/login/client` - Login cliente
- **POST** `http://localhost:3000/api/auth/register/client` - Registro cliente
- **POST** `http://localhost:3000/api/orders` - Crear orden (requiere auth)

### Realtime Service (Puerto 8080/8081)

- **GET** `http://localhost:8080/health` - Health check
- **GET** `http://localhost:8080/admin/clients` - Ver clientes conectados
- **WebSocket** `ws://localhost:8080/ws?token=JWT` - Conexión WebSocket

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema: Docker no inicia

```powershell
# Reinicia Docker Desktop
# Luego:
docker compose down
docker compose up -d --build
```

### Problema: REST Service no conecta a base de datos

Verifica tu archivo `.env` en `rest_service`:
```env
# Conexión a base de datos (valores individuales requeridos)
DB_HOST=tu_host_supabase
DB_PORT=6543
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=postgres

# Autenticación
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# Realtime Service
REALTIME_SERVICE_URL=http://localhost:8080
```

Verifica tu archivo `.env` en `realtime_service`:
```env
# JWT (debe ser IDÉNTICO al de rest_service)
JWT_SECRET=tu_clave_secreta_aqui

# Redis (usa 'redis' si está en Docker Compose)
REDIS_ADDR=redis:6379

# Backend REST (usa host.docker.internal para Docker)
BACKEND_URL=http://host.docker.internal:3000/api
```

**⚠️ IMPORTANTE:** 
- JWT_SECRET debe ser idéntico en ambos servicios
- Nunca compartas tus valores reales de `.env` en repositorios públicos
- Las credenciales de base de datos deben estar en variables individuales (DB_HOST, DB_USER, etc.)

### Problema: WebSocket no conecta

1. Verifica que el token sea válido (genera uno nuevo con el comando completo que incluye JWT_SECRET)
2. Asegúrate de que Realtime Service esté corriendo: `docker compose ps`
3. Revisa los logs: `docker logs realtime_service-api1-1`

### Problema: "not authorized" al unirse a una sala

Asegúrate de que el nombre de la sala coincida con el formato correcto:
- Para clientes: `client-{user_id}` donde `user_id` está en el token JWT
- Ejemplo: Si el token tiene `user_id: "user-123"`, usa sala `client-user-123`
- Para verificar tu user_id del token, revisa la salida de `token_gen.go`

### Problema: "server error" al unirse

Verifica que el archivo `.env` en `realtime_service` tenga:
```env
BACKEND_URL=http://host.docker.internal:3000/api
```

**NO uses `localhost`** en BACKEND_URL cuando corres en Docker, usa `host.docker.internal` para acceder a servicios en tu máquina host.

---

## 📁 ESTRUCTURA DEL PROYECTO

```
backend/
├── realtime_service/          # WebSocket Service (Go + Docker)
│   ├── cmd/api/main.go       # Punto de entrada
│   ├── internal/
│   │   ├── websockets/       # Hub y manejo de conexiones
│   │   └── services/         # Lógica de negocio
│   ├── docker-compose.yml    # Configuración Docker
│   ├── token_gen.go          # Generador de tokens
│   └── test_backend.ps1      # Script de verificación
│
└── rest_service/              # REST API (Node.js + TypeScript)
    ├── src/
    │   ├── application/       # Casos de uso
    │   ├── domain/           # Entidades y lógica
    │   └── infrastructure/   # Controllers, routes, DB
    ├── package.json
    └── .env                  # Variables de entorno
```

---

## 🎯 CÓMO FUNCIONA EL SISTEMA DE NOTIFICACIONES

```
1. Cliente crea una orden
        ↓
2. REST API guarda en base de datos
        ↓
3. REST API publica mensaje en Redis
        Canal: ws:room:client-{id}
        ↓
4. Realtime Service escucha Redis (2 instancias)
        ↓
5. Realtime Service busca cliente conectado
        ↓
6. Envía notificación via WebSocket
        ↓
7. Cliente recibe notificación en tiempo real! 🔔
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- `GUIA_PRUEBAS_WEBSOCKET.md` - Guía detallada de WebSocket
- `TEST_INTEGRACION_COMPLETA.md` - Pruebas de integración
- `GUIA_INTEGRACION_WEBSOCKET_REST.md` - Arquitectura de integración
- `QUE_PASA_CUANDO_SUBEN_CONTENEDORES.md` - Explicación de Docker

---

## 🆘 SOPORTE

Si algo no funciona:

1. **Ver logs de Docker:**
   ```powershell
   docker logs realtime_service-api1-1
   docker logs realtime_service-redis-1
   ```

2. **Ver logs de REST Service:**
   En la terminal donde ejecutaste `npm run dev`

3. **Verificar servicios:**
   ```powershell
   .\test_backend.ps1
   ```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Configuración Inicial
- [ ] Docker Desktop instalado y corriendo
- [ ] Archivo `.env` configurado en `rest_service` con DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET
- [ ] Archivo `.env` configurado en `realtime_service` con JWT_SECRET idéntico
- [ ] BACKEND_URL en realtime_service usa `host.docker.internal:3000/api`
- [ ] Dependencias instaladas: `npm install --legacy-peer-deps` en rest_service

### Servicios Activos
- [ ] 3 contenedores de Docker activos (redis, api1, api2)
- [ ] REST Service iniciado con `npm run dev` en otra terminal
- [ ] Script de verificación `.\test_backend.ps1` ejecutado exitosamente

### Verificaciones
- [ ] Redis respondiendo a PING
- [ ] Realtime Service respondiendo a /health (puertos 8080 y 8081)
- [ ] REST Service respondiendo (puerto 3000)
- [ ] Mensaje de prueba publicado (2 suscriptores confirmados)
- [ ] Swagger docs accesible en http://localhost:3000/api-docs

### WebSocket (Opcional)
- [ ] Token JWT generado con comando que incluye JWT_SECRET
- [ ] Conexión WebSocket establecida con wscat
- [ ] Unido a sala con formato `client-user-123`
- [ ] Notificación de prueba recibida en tiempo real

**Si todos los puntos de "Servicios Activos" y "Verificaciones" están marcados: ¡Tu backend está funcionando perfectamente!** 🎉

