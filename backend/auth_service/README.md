# 🔐 Auth Service - Microservicio de Autenticación

## Pilar 1 del Segundo Parcial | MarketPlace Espigón Manta

---

## 📋 Resumen

Este microservicio implementa el **Pilar 1 (15%)** del segundo parcial: un sistema de autenticación independiente que maneja registro, login, logout, refresh tokens y validación JWT.

**Objetivo cumplido:** Separar la autenticación del REST Service, evitando el antipatrón de llamadas constantes al servicio de autenticación en cada request.

---

## 🏗️ Arquitectura Implementada

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    FRONTEND     │     │  REST SERVICE   │     │REALTIME SERVICE │
│  React + Vite   │     │   Puerto 3000   │     │   Puerto 8080   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ Login/Register        │ Valida JWT            │ Valida JWT
         │                       │ LOCALMENTE            │ LOCALMENTE
         ▼                       │                       │
┌─────────────────┐              │                       │
│  AUTH SERVICE   │◄─────────────┴───────────────────────┘
│   Puerto 4001   │         (Solo comparten JWT_SECRET)
│                 │
│ • /auth/register│
│ • /auth/login   │
│ • /auth/logout  │
│ • /auth/refresh │
│ • /auth/me      │
│ • /auth/validate│
│ • /health       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│        PostgreSQL (Supabase)            │
│        Schema: auth_service             │
│                                         │
│  ┌─────────┐ ┌───────────────┐ ┌──────┐│
│  │  users  │ │refresh_tokens │ │revoke││
│  └─────────┘ └───────────────┘ └──────┘│
└─────────────────────────────────────────┘
```

### ✅ Validación LOCAL de Tokens (Sin Antipatrón)

Los servicios REST y Realtime validan tokens **localmente** usando el `JWT_SECRET` compartido, sin llamar al Auth Service en cada request:

1. Frontend envía request con `Authorization: Bearer <token>`
2. El servicio verifica la firma del JWT con `JWT_SECRET`
3. Verifica `exp` (expiración), `iss` (issuer), `aud` (audience)
4. **NO consulta al Auth Service** ✓

---

## 📁 Estructura del Proyecto

```
backend/auth_service/
├── src/
│   ├── main.ts                    # Entry point
│   ├── config/
│   │   ├── database.ts            # Conexión TypeORM a PostgreSQL
│   │   └── env.ts                 # Variables de entorno tipadas
│   ├── models/
│   │   ├── User.ts                # Entidad usuarios
│   │   ├── RefreshToken.ts        # Entidad refresh tokens
│   │   └── RevokedToken.ts        # Entidad blacklist de tokens
│   ├── services/
│   │   ├── authService.ts         # Lógica de negocio (register, login, logout)
│   │   └── tokenService.ts        # Generación y validación JWT
│   ├── controllers/
│   │   └── authController.ts      # Handlers de endpoints
│   ├── middlewares/
│   │   ├── authMiddleware.ts      # Verificación de JWT
│   │   └── rateLimiter.ts         # Protección contra fuerza bruta
│   ├── routes/
│   │   └── authRoutes.ts          # Definición de rutas
│   └── tests/
│       ├── auth.test.ts           # Tests unitarios e integración
│       └── setup.ts               # Configuración Jest
├── docs/
│   ├── openapi.yaml               # Documentación Swagger/OpenAPI
│   └── Auth_Service.postman_collection.json
├── .env                           # Variables de entorno
├── .env.example                   # Plantilla de variables
├── Dockerfile                     # Imagen Docker
├── docker-compose.yml             # Orquestación
├── package.json
├── tsconfig.json
└── jest.config.js
```

---

## 🗄️ Base de Datos (Schema: `auth_service`)

### Tabla `users`
Centraliza las credenciales de todos los tipos de usuario.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `email` | VARCHAR(255) | Email único para login |
| `password_hash` | VARCHAR(255) | Contraseña hasheada con bcrypt |
| `role` | ENUM | `'client'`, `'seller'`, `'admin'` |
| `reference_id` | INTEGER | ID en la tabla original (id_client, id_seller, id_admin) |
| `name` | VARCHAR(255) | Nombre del usuario |
| `is_active` | BOOLEAN | Si la cuenta está activa |
| `email_verified` | BOOLEAN | Si el email fue verificado |
| `login_attempts` | INTEGER | Intentos fallidos de login |
| `locked_until` | TIMESTAMP | Fecha hasta la que está bloqueada |
| `last_login` | TIMESTAMP | Último login exitoso |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última actualización |

### Tabla `refresh_tokens`
Almacena los refresh tokens para poder revocarlos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK a users.id |
| `token_hash` | VARCHAR(64) | SHA256 del token (nunca el token real) |
| `device_info` | VARCHAR(255) | Info del dispositivo |
| `ip_address` | VARCHAR(45) | IP del cliente |
| `user_agent` | TEXT | User-Agent del navegador |
| `expires_at` | TIMESTAMP | Fecha de expiración |
| `is_revoked` | BOOLEAN | Si fue revocado |
| `revoked_at` | TIMESTAMP | Cuándo fue revocado |
| `created_at` | TIMESTAMP | Fecha de creación |

### Tabla `revoked_tokens` (Blacklist)
Lista negra de access tokens revocados antes de expirar.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | Identificador único |
| `token_jti` | VARCHAR(36) | JWT ID único del token |
| `user_id` | UUID | Usuario al que pertenecía |
| `reason` | VARCHAR(50) | Razón: 'logout', 'password_change', etc. |
| `original_exp` | TIMESTAMP | Expiración original del token |
| `revoked_at` | TIMESTAMP | Cuándo se revocó |

---

## 🔌 API Endpoints

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/register` | Registrar nuevo usuario | ❌ |
| `POST` | `/auth/login` | Iniciar sesión | ❌ |
| `POST` | `/auth/logout` | Cerrar sesión | ✅ Bearer |
| `POST` | `/auth/refresh` | Renovar tokens | ❌ (usa refresh_token) |
| `GET` | `/auth/me` | Obtener perfil del usuario | ✅ Bearer |
| `GET` | `/auth/validate` | Validar token (interno) | ❌ |
| `GET` | `/health` | Health check | ❌ |

### Ejemplos de Uso

#### Registro
```bash
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "Password123!",
    "role": "client",
    "reference_id": 1,
    "name": "Juan Pérez"
  }'
```

#### Login
```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "Password123!"
  }'
```

**Respuesta:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": "uuid-del-usuario",
    "email": "usuario@ejemplo.com",
    "role": "client",
    "reference_id": 1,
    "name": "Juan Pérez"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 900
}
```

#### Refresh Token
```bash
curl -X POST http://localhost:4001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJhbGciOiJIUzI1NiIs..."}'
```

#### Logout
```bash
curl -X POST http://localhost:4001/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJhbGciOiJIUzI1NiIs..."}'
```

---

## 🔑 Estructura del JWT

### Access Token (15 min)
```json
{
  "jti": "uuid-unico",
  "sub": "user-uuid",
  "email": "usuario@ejemplo.com",
  "role": "client",
  "reference_id": 1,
  "name": "Juan Pérez",
  "iss": "auth-service",
  "aud": "marketplace-espigon",
  "iat": 1704326400,
  "exp": 1704327300
}
```

### Refresh Token (7 días)
```json
{
  "jti": "uuid-unico",
  "sub": "user-uuid",
  "type": "refresh",
  "iss": "auth-service",
  "iat": 1704326400,
  "exp": 1704931200
}
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Server
PORT=4001
NODE_ENV=development

# Database (Supabase)
DB_HOST=aws-1-us-east-2.pooler.supabase.com
DB_PORT=5432
DB_USERNAME=postgres.tuproyecto
DB_PASSWORD=tu-password
DB_DATABASE=postgres
DB_SCHEMA=auth_service

# JWT
JWT_SECRET=supersecreto123
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=auth-service
JWT_AUDIENCE=marketplace-espigon

# Security
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_LOGIN_POINTS=10
RATE_LIMIT_LOGIN_DURATION=60
```

---

## 🚀 Cómo Ejecutar

### Desarrollo Local
```bash
cd backend/auth_service
npm install
npm run dev
```

### Con Docker
```bash
cd backend/auth_service
docker-compose up --build
```

### Tests
```bash
npm test              # Ejecutar tests
npm run test:watch    # Modo watch
npm run test:coverage # Con cobertura
```

---

## 🛡️ Características de Seguridad

| Característica | Implementación |
|----------------|----------------|
| **Hashing de Passwords** | bcrypt con 10 salt rounds |
| **Access Token** | JWT firmado, expira en 15 minutos |
| **Refresh Token** | JWT firmado, expira en 7 días |
| **Blacklist** | Tokens revocados en tabla `revoked_tokens` |
| **Rate Limiting** | 10 intentos de login por minuto por IP |
| **Bloqueo de Cuenta** | Después de 5 intentos fallidos, bloqueo 15 min |
| **Headers de Seguridad** | Helmet.js habilitado |
| **CORS** | Configurado para dominios permitidos |

---

## 📊 Integración con Otros Servicios

### Frontend (React)
El frontend debe:
1. Llamar a `/auth/login` para obtener tokens
2. Guardar `access_token` en memoria y `refresh_token` en httpOnly cookie o localStorage
3. Enviar `Authorization: Bearer <access_token>` en cada request
4. Usar `/auth/refresh` cuando el access token expire

### REST Service
Valida tokens localmente usando el mismo `JWT_SECRET`:
```typescript
// En authMiddleware.ts del REST Service
import jwt from 'jsonwebtoken';

const payload = jwt.verify(token, process.env.JWT_SECRET, {
  issuer: 'auth-service',
  audience: 'marketplace-espigon'
});
```

### Realtime Service (Go)
Valida tokens localmente:
```go
// En auth.go
token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
    return []byte(os.Getenv("JWT_SECRET")), nil
})
```

---

## 📝 Notas de Implementación

### Fases Completadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| 1 | Estructura de carpetas y configuración base | ✅ |
| 2 | Configuración de base de datos en Supabase | ✅ |
| 3 | Modelos TypeORM (User, RefreshToken, RevokedToken) | ✅ |
| 4 | Servicios (authService, tokenService) | ✅ |
| 5 | Controladores y rutas | ✅ |
| 6 | Middlewares (auth, rate limiting) | ✅ |
| 7 | Docker y docker-compose | ✅ |
| 8 | Tests unitarios e integración | ✅ |
| 9 | Documentación OpenAPI y Postman | ✅ |
| 10 | Integración con Frontend y REST Service | ✅ |

### Antipatrón Resuelto

**Antes:** Cada servicio llamaba al Auth Service para validar tokens (N llamadas por request)

**Ahora:** Cada servicio valida tokens localmente con `JWT_SECRET` compartido (0 llamadas al Auth Service por request)

---

## 📚 Documentación Adicional

- **OpenAPI/Swagger:** [docs/openapi.yaml](docs/openapi.yaml)
- **Postman Collection:** [docs/Auth_Service.postman_collection.json](docs/Auth_Service.postman_collection.json)

---

## 🎓 Criterios de Evaluación Cumplidos

✅ Microservicio independiente separado del REST Service  
✅ JWT con Access Token + Refresh Token  
✅ Validación local de tokens (sin antipatrón)  
✅ Revocación de tokens (blacklist)  
✅ Rate limiting para prevenir ataques de fuerza bruta  
✅ Dockerizado y listo para despliegue  
✅ Tests automatizados  
✅ Documentación completa  

---

**Autor:** Proyecto de examen - Segundo Parcial  
**Fecha:** Enero 2026  
**Versión:** 1.0.0
