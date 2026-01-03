# 🔐 Pilar 1: Microservicio de Autenticación

## 📋 Documento de Planificación e Implementación

---

## 📌 Resumen Ejecutivo

Este documento detalla la planificación para implementar el **Pilar 1 del Segundo Parcial**: un **Microservicio de Autenticación Independiente** que separará la lógica de autenticación del servicio REST principal, eliminando el antipatrón de llamadas constantes al servicio de autenticación en cada request.

---

## 🎯 Objetivo del Pilar 1

> **Separar la autenticación en un servicio independiente, evitando el antipatrón de llamadas constantes al servicio de autenticación en cada request.**

---

## 📊 Análisis del Estado Actual

### 🔍 Cómo <funciona> la autenticación ACTUALMENTE

| Aspecto | Estado Actual | Ubicación |
|---------|---------------|-----------|
| **Lógica de Login** | Embebida en REST Service | `rest_service/src/infrastructure/http/controllers/authController.ts` |
| **Tipos de Usuario** | Client, Seller, Admin | Tablas separadas: `client`, `seller`, `admin` |
| **Tokens** | Solo Access Token JWT (24h) | Sin refresh tokens |
| **Validación** | Local en cada servicio | `authMiddleware.ts`, `auth.go` |
| **Almacenamiento** | PostgreSQL (usuarios) | Sin tabla de tokens revocados |
| **Seguridad** | Bcrypt para passwords | Sin rate limiting, sin blacklist |

### 📁 Archivos Actuales de Autenticación

```
backend/rest_service/src/
├── infrastructure/
│   ├── http/
│   │   ├── controllers/
│   │   │   └── authController.ts      ← Login/Register (3 tipos de usuario)
│   │   └── routes/
│   │       └── authRoutes.ts          ← Rutas: /auth/login/*, /auth/register/*
│   └── middlewares/
│       ├── authMiddleware.ts          ← Validación JWT local
│       └── roleMiddleware.ts          ← Control de roles
└── models/
    ├── clientModel.ts                 ← Entidad Cliente
    ├── sellerModel.ts                 ← Entidad Vendedor
    └── adminModel.ts                  ← Entidad Administrador

backend/realtime_service/internal/websockets/
└── auth.go                            ← Validación JWT en Go (WebSocket)
```

### 🔴 Problemas Identificados (Antipatrones)

1. **Acoplamiento Alto**: La lógica de autenticación está dentro del REST Service
2. **Sin Refresh Tokens**: Solo access tokens de 24h (poco seguro)
3. **Sin Revocación de Tokens**: No hay forma de invalidar tokens activos
4. **Sin Rate Limiting**: Vulnerable a ataques de fuerza bruta
5. **Usuarios Dispersos**: 3 tablas diferentes (`client`, `seller`, `admin`)
6. **Secret Compartido**: Todos los servicios usan el mismo `JWT_SECRET`

---

## 🏗️ Arquitectura Propuesta

### 📐 Diagrama de la Nueva Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                    React + TypeScript + Vite                            │
└────────────┬────────────────────┬────────────────────┬──────────────────┘
             │                    │                    │
             │ HTTP/REST          │ HTTP/REST          │ WebSocket
             ▼                    ▼                    ▼
┌────────────────────┐  ┌────────────────┐  ┌────────────────────────────┐
│  🔐 AUTH SERVICE   │  │  REST SERVICE  │  │    REALTIME SERVICE        │
│  (NUEVO)           │  │  (Existente)   │  │    (Existente)             │
│  Puerto: 4001      │  │  Puerto: 3000  │  │    Puerto: 8080            │
│                    │  │                │  │                            │
│  ✓ Register        │  │  ✓ CRUD APIs   │  │  ✓ WebSocket               │
│  ✓ Login           │  │  ✓ Business    │  │  ✓ Notificaciones          │
│  ✓ Logout          │  │                │  │                            │
│  ✓ Refresh Token   │  │  Valida JWT    │  │  Valida JWT                │
│  ✓ Validate Token  │  │  LOCALMENTE ✓  │  │  LOCALMENTE ✓              │
│  ✓ Revoke Token    │  │                │  │                            │
│  ✓ Rate Limiting   │  │  (Sin llamar   │  │  (Sin llamar               │
│                    │  │   al Auth)     │  │   al Auth)                 │
└─────────┬──────────┘  └────────────────┘  └────────────────────────────┘
          │
          │ TypeORM
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    🗄️ BASE DE DATOS AUTH                                │
│                    PostgreSQL (Separada o Schema dedicado)              │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐│
│  │      users       │  │  refresh_tokens  │  │   revoked_tokens        ││
│  │                  │  │                  │  │   (blacklist)           ││
│  │  - id           │  │  - id            │  │                          ││
│  │  - email        │  │  - user_id       │  │  - id                    ││
│  │  - password     │  │  - token         │  │  - token_jti             ││
│  │  - role         │  │  - expires_at    │  │  - user_id               ││
│  │  - created_at   │  │  - device_info   │  │  - revoked_at            ││
│  │  - updated_at   │  │  - is_revoked    │  │  - reason                ││
│  └──────────────────┘  └──────────────────┘  └─────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 🔑 Concepto Clave: Validación LOCAL de Tokens

> **El anti-patrón a evitar**: Que REST Service o Realtime Service llamen al Auth Service en CADA request para validar el token.

**Solución Implementada:**
1. Auth Service firma tokens con una **clave privada RSA** (asimétrica) o **secreto compartido HMAC** (simétrica)
2. Los demás servicios tienen la **clave pública** o el **mismo secreto** para validar la FIRMA del token
3. La validación incluye verificar:
   - Firma (criptográficamente)
   - Expiración (`exp`)
   - Emisor (`iss`)
   - NO se consulta al Auth Service

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE VALIDACIÓN LOCAL                            │
│                                                                         │
│   1. Usuario hace request con token                                     │
│      ┌──────────┐                       ┌──────────────────┐           │
│      │ Frontend │ ───── Bearer JWT ────▶│   REST Service   │           │
│      └──────────┘                       └────────┬─────────┘           │
│                                                   │                     │
│   2. REST Service valida LOCALMENTE               │                     │
│      - Verifica firma con JWT_SECRET     ◀───────┘                     │
│      - Verifica expiración (exp)                                        │
│      - Verifica issuer (iss = auth-service)                            │
│      - NO llama al Auth Service ✅                                      │
│                                                                         │
│   3. Si token válido → procesa request                                  │
│      Si token inválido → 401 Unauthorized                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Componentes a Implementar

### 1️⃣ Auth Service (Microservicio Nuevo)

#### Tecnología Sugerida

| Opción | Lenguaje | Framework | Pros | Contras |
|--------|----------|-----------|------|---------|
| **A** | TypeScript | Express/Fastify | Consistente con REST Service | Más código similar |
| **B** | Python | FastAPI | Consistente con Report Service | Diferente ecosistema |
| **C** | Go | Gin/Fiber | Alto rendimiento, consistente con Realtime | Curva de aprendizaje |

**Recomendación**: **TypeScript + Express** para mantener consistencia con el proyecto existente.

#### Estructura del Microservicio

```
backend/auth_service/
├── src/
│   ├── main.ts                        # Entry point
│   ├── config/
│   │   ├── database.ts                # Conexión PostgreSQL
│   │   ├── jwt.ts                     # Configuración JWT
│   │   └── env.ts                     # Variables de entorno
│   ├── controllers/
│   │   └── authController.ts          # Handlers de endpoints
│   ├── services/
│   │   ├── authService.ts             # Lógica de autenticación
│   │   ├── tokenService.ts            # Generación/validación tokens
│   │   └── rateLimitService.ts        # Rate limiting
│   ├── repositories/
│   │   ├── userRepository.ts          # Acceso a datos usuarios
│   │   ├── refreshTokenRepository.ts  # Acceso a refresh tokens
│   │   └── revokedTokenRepository.ts  # Acceso a tokens revocados
│   ├── models/
│   │   ├── User.ts                    # Entidad Usuario unificada
│   │   ├── RefreshToken.ts            # Entidad Refresh Token
│   │   └── RevokedToken.ts            # Entidad Token Revocado
│   ├── middlewares/
│   │   ├── rateLimiter.ts             # Rate limiting middleware
│   │   └── validateRequest.ts         # Validación de inputs
│   ├── routes/
│   │   └── authRoutes.ts              # Definición de rutas
│   └── utils/
│       ├── passwordUtils.ts           # Bcrypt helpers
│       └── jwtUtils.ts                # JWT helpers
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

### 2️⃣ Base de Datos Propia

#### Opción A: Base de Datos Separada
```
PostgreSQL (auth_db) - Puerto: 5433
└── Schema: public
    ├── users
    ├── refresh_tokens
    └── revoked_tokens
```

#### Opción B: Schema Dedicado en BD Existente (RECOMENDADA)
```
PostgreSQL (marketplace_db) - Puerto: 5432
├── Schema: public        ← Tablas existentes (products, orders, etc.)
└── Schema: auth          ← NUEVO: Tablas de autenticación
    ├── users
    ├── refresh_tokens
    └── revoked_tokens
```

### 3️⃣ Modelos de Base de Datos

#### Tabla: `auth.users`

```sql
CREATE TABLE auth.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('client', 'seller', 'admin')),
    
    -- Referencia al registro específico del rol
    reference_id    INTEGER NOT NULL,  -- id_client, id_seller, o id_admin
    
    -- Metadatos
    is_active       BOOLEAN DEFAULT true,
    email_verified  BOOLEAN DEFAULT false,
    last_login      TIMESTAMP,
    login_attempts  INTEGER DEFAULT 0,
    locked_until    TIMESTAMP,
    
    -- Timestamps
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_role_reference ON auth.users(role, reference_id);
```

#### Tabla: `auth.refresh_tokens`

```sql
CREATE TABLE auth.refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,  -- SHA256 del token
    
    -- Información del dispositivo
    device_info     VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    
    -- Validez
    expires_at      TIMESTAMP NOT NULL,
    is_revoked      BOOLEAN DEFAULT false,
    revoked_at      TIMESTAMP,
    
    -- Timestamps
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON auth.refresh_tokens(token_hash);
```

#### Tabla: `auth.revoked_tokens` (Blacklist)

```sql
CREATE TABLE auth.revoked_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_jti       VARCHAR(255) NOT NULL UNIQUE,  -- JWT ID (claim jti)
    user_id         UUID REFERENCES auth.users(id),
    
    -- Motivo de revocación
    reason          VARCHAR(50) CHECK (reason IN ('logout', 'password_change', 'admin_action', 'suspicious_activity')),
    
    -- Expiración (para limpieza automática)
    original_exp    TIMESTAMP NOT NULL,  -- Cuándo expiraba el token
    
    -- Timestamps
    revoked_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revoked_tokens_jti ON auth.revoked_tokens(token_jti);
CREATE INDEX idx_revoked_tokens_exp ON auth.revoked_tokens(original_exp);
```

### 4️⃣ Endpoints Requeridos

| Método | Endpoint | Descripción | Auth | Rate Limit |
|--------|----------|-------------|------|------------|
| `POST` | `/auth/register` | Registrar nuevo usuario | No | 5/min |
| `POST` | `/auth/login` | Iniciar sesión | No | 10/min |
| `POST` | `/auth/logout` | Cerrar sesión | Sí | No |
| `POST` | `/auth/refresh` | Renovar access token | No* | 30/min |
| `GET` | `/auth/me` | Obtener usuario actual | Sí | No |
| `GET` | `/auth/validate` | Validar token (interno) | No | No |

*Requiere refresh token válido en el body

#### Detalle de Endpoints

##### POST /auth/register
```typescript
// Request
{
  "email": "usuario@example.com",
  "password": "SecurePass123!",
  "role": "client",  // 'client' | 'seller' | 'admin'
  "profile_data": {  // Datos específicos del rol
    // Para client: client_name, phone, address
    // Para seller: seller_name, phone, bussines_name, location
  }
}

// Response 201
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "client"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "expires_in": 900  // 15 minutos
}
```

##### POST /auth/login
```typescript
// Request
{
  "email": "usuario@example.com",
  "password": "SecurePass123!"
}

// Response 200
{
  "message": "Login exitoso",
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "client",
    "reference_id": 1,  // id_client, id_seller, etc.
    "name": "Nombre Usuario"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "expires_in": 900
}

// Response 401 (credenciales inválidas)
{
  "error": "Credenciales inválidas",
  "code": "INVALID_CREDENTIALS"
}

// Response 429 (rate limit)
{
  "error": "Demasiados intentos. Intente nuevamente en X minutos",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 300
}
```

##### POST /auth/logout
```typescript
// Headers: Authorization: Bearer <access_token>
// Request
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "logout_all_devices": false  // Opcional: cerrar todas las sesiones
}

// Response 200
{
  "message": "Sesión cerrada exitosamente"
}
```

##### POST /auth/refresh
```typescript
// Request
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}

// Response 200
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",  // Nuevo refresh token (rotación)
  "expires_in": 900
}

// Response 401 (refresh token inválido o revocado)
{
  "error": "Refresh token inválido o expirado",
  "code": "INVALID_REFRESH_TOKEN"
}
```

##### GET /auth/me
```typescript
// Headers: Authorization: Bearer <access_token>

// Response 200
{
  "user": {
    "id": "uuid",
    "email": "usuario@example.com",
    "role": "client",
    "reference_id": 1,
    "name": "Nombre Usuario",
    "email_verified": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

##### GET /auth/validate (Interno)
```typescript
// Headers: Authorization: Bearer <access_token>
// Este endpoint es principalmente para verificación interna si se necesita

// Response 200
{
  "valid": true,
  "user": {
    "id": "uuid",
    "role": "client",
    "reference_id": 1
  },
  "expires_at": "2025-01-01T00:15:00Z"
}

// Response 401
{
  "valid": false,
  "error": "Token expirado o inválido"
}
```

### 5️⃣ Estructura de los JWT Tokens

#### Access Token (Corta duración: 15 minutos)

```typescript
// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload
{
  "jti": "unique-token-id-uuid",      // JWT ID (para blacklist)
  "sub": "user-uuid",                  // Subject (user id)
  "iss": "auth-service",               // Issuer
  "aud": "marketplace-espigon",        // Audience
  
  // Claims personalizados
  "email": "usuario@example.com",
  "role": "client",
  "reference_id": 1,                   // id_client, id_seller, etc.
  "name": "Nombre Usuario",
  
  // Timestamps
  "iat": 1735500000,                   // Issued at
  "exp": 1735500900                    // Expiration (15 min después)
}
```

#### Refresh Token (Larga duración: 7 días)

```typescript
// Payload
{
  "jti": "unique-refresh-token-id",
  "sub": "user-uuid",
  "iss": "auth-service",
  "type": "refresh",
  
  "iat": 1735500000,
  "exp": 1736104800                    // 7 días después
}
```

### 6️⃣ Seguridad: Rate Limiting

#### Implementación con Redis

```typescript
// Configuración de Rate Limiting
const RATE_LIMITS = {
  login: {
    points: 10,           // 10 intentos
    duration: 60,         // por minuto
    blockDuration: 300    // bloqueo de 5 minutos
  },
  register: {
    points: 5,
    duration: 60,
    blockDuration: 600    // bloqueo de 10 minutos
  },
  refresh: {
    points: 30,
    duration: 60,
    blockDuration: 60
  }
};
```

#### Implementación sin Redis (In-Memory)

```typescript
// Para desarrollo/demo, usar rate-limiter-flexible con almacenamiento en memoria
import { RateLimiterMemory } from 'rate-limiter-flexible';

const loginLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});
```

### 7️⃣ Blacklist de Tokens

#### Estrategia de Verificación

```typescript
// La verificación de blacklist DEBE ser local para evitar el antipatrón
// Opciones:

// Opción A: Redis Cache (RECOMENDADA)
// - Al revocar token, guardar JTI en Redis con TTL = tiempo restante del token
// - Al validar, verificar si JTI existe en Redis

// Opción B: Cache en memoria con sincronización
// - Mantener lista de JTIs revocados en memoria
// - Sincronizar periódicamente con la BD
// - Más complejo pero funciona sin Redis

// Flujo de validación
async function validateAccessToken(token: string): Promise<boolean> {
  // 1. Verificar firma y expiración (local)
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // 2. Verificar si está en blacklist (Redis local o memoria)
  const isRevoked = await redisClient.exists(`revoked:${decoded.jti}`);
  
  return !isRevoked;
}
```

---

## 🔄 Integración con Servicios Existentes

---

## 🛠️ CAMBIOS DETALLADOS A IMPLEMENTAR

Esta sección detalla **TODOS** los cambios específicos que deben realizarse en cada componente del sistema existente.

---

### 📂 CAMBIOS EN REST SERVICE (`backend/rest_service/`)

#### 📁 Archivos a ELIMINAR o DEPRECAR

| Archivo | Acción | Razón |
|---------|--------|-------|
| `src/infrastructure/http/controllers/authController.ts` | **ELIMINAR** funciones de login/register | La lógica se mueve al Auth Service |
| `src/infrastructure/http/routes/authRoutes.ts` | **MODIFICAR** | Eliminar rutas de login/register, mantener solo proxy o eliminar |
| `src/infrastructure/middlewares/validations/authValidations.ts` | **MOVER** al Auth Service | Las validaciones van con el servicio |

#### 📁 Archivos a MODIFICAR

##### 1. `src/infrastructure/middlewares/authMiddleware.ts`

```typescript
// ============================================
// ANTES (Código Actual)
// ============================================
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader?.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// ============================================
// DESPUÉS (Código Nuevo)
// ============================================
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { createClient } from "redis";  // NUEVO: Para verificar blacklist

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_ISSUER = "auth-service";  // NUEVO: Verificar emisor
const JWT_AUDIENCE = "marketplace-espigon";  // NUEVO: Verificar audiencia

// NUEVO: Cliente Redis para verificar blacklist (opcional)
let redisClient: ReturnType<typeof createClient> | null = null;

async function initRedis() {
    if (process.env.REDIS_URL) {
        redisClient = createClient({ url: process.env.REDIS_URL });
        await redisClient.connect();
    }
}
initRedis().catch(console.error);

// NUEVO: Verificar si token está en blacklist
async function isTokenRevoked(jti: string): Promise<boolean> {
    if (!redisClient) return false;  // Sin Redis, no hay blacklist
    const exists = await redisClient.exists(`revoked:${jti}`);
    return exists === 1;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // Mantener soporte para servicios internos
    const serviceToken = req.headers["x-service-token"] as string;
    const internalService = req.headers["x-internal-service"] as string;
    
    if (serviceToken === "internal-service-graphql-reports-2024" && internalService === "report-service") {
        (req as any).user = { type: "internal-service", service: internalService, role: "service" };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        // MODIFICADO: Validación LOCAL con verificaciones adicionales
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,      // NUEVO: Verificar que viene del Auth Service
            audience: JWT_AUDIENCE   // NUEVO: Verificar audiencia correcta
        }) as jwt.JwtPayload;

        // NUEVO: Verificar si el token está revocado (blacklist)
        if (decoded.jti && await isTokenRevoked(decoded.jti)) {
            return res.status(401).json({ message: "Token has been revoked" });
        }

        (req as any).user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}
```

##### 2. `src/main/main.ts`

```typescript
// ============================================
// CAMBIOS NECESARIOS
// ============================================

// ANTES
import authRoutes from "../infrastructure/http/routes/authRoutes";
app.use("/api/auth", authRoutes);

// DESPUÉS - OPCIÓN A: Eliminar rutas de auth (Frontend llama directo a Auth Service)
// import authRoutes from "../infrastructure/http/routes/authRoutes";  // COMENTAR
// app.use("/api/auth", authRoutes);  // COMENTAR

// DESPUÉS - OPCIÓN B: Proxy a Auth Service (si quieres mantener /api/auth en REST)
import { createProxyMiddleware } from 'http-proxy-middleware';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' }
}));
```

##### 3. `src/infrastructure/http/routes/authRoutes.ts`

```typescript
// ============================================
// ANTES (Código Actual)
// ============================================
import { Router } from "express";
import { loginClient, loginSeller, loginAdmin, verifyToken, registerClient, registerSeller } from "../controllers/authController";

const router = Router();
router.post("/login/client", loginValidation, validateRequest, loginClient);
router.post("/login/seller", loginValidation, validateRequest, loginSeller);
router.post("/login/admin", loginValidation, validateRequest, loginAdmin);
router.post("/register/client", registerClientValidation, validateRequest, registerClient);
router.post("/register/seller", registerSellerValidation, validateRequest, registerSeller);
router.get("/verify", authMiddleware, verifyToken);
export default router;

// ============================================
// DESPUÉS - OPCIÓN A: Eliminar completamente
// ============================================
// Eliminar este archivo y las referencias en main.ts
// El Frontend llamará directamente al Auth Service

// ============================================
// DESPUÉS - OPCIÓN B: Mantener solo verify (backward compatibility)
// ============================================
import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";

const router = Router();

// Solo mantener verify para compatibilidad con código existente
router.get("/verify", authMiddleware, (req, res) => {
    const user = (req as any).user;
    res.json({
        valid: true,
        user: {
            id: user.sub || user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        }
    });
});

export default router;
```

##### 4. `.env` (Variables de Entorno)

```env
# ============================================
# NUEVAS VARIABLES NECESARIAS
# ============================================

# Auth Service URL (para proxy o comunicación interna)
AUTH_SERVICE_URL=http://localhost:4001

# JWT Configuration (DEBE coincidir con Auth Service)
JWT_SECRET=your-super-secret-key-shared-with-auth-service
JWT_ISSUER=auth-service
JWT_AUDIENCE=marketplace-espigon

# Redis para blacklist (opcional pero recomendado)
REDIS_URL=redis://localhost:6379
```

##### 5. `package.json` - Nuevas Dependencias

```json
{
  "dependencies": {
    // ... existentes ...
    "http-proxy-middleware": "^3.0.0",  // NUEVO: Solo si usas proxy
    "redis": "^5.9.0"                    // Ya existe, pero asegurar versión
  }
}
```

---

### 📂 CAMBIOS EN REALTIME SERVICE (`backend/realtime_service/`)

#### 📁 Archivos a MODIFICAR

##### 1. `internal/websockets/auth.go`

```go
// ============================================
// ANTES (Código Actual)
// ============================================
package websockets

import (
    "errors"
    "os"
    "strings"
    "github.com/golang-jwt/jwt/v4"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

type Claims struct {
    UserID   string  `json:"user_id"`
    ID       float64 `json:"id,omitempty"`
    IDSeller float64 `json:"id_seller,omitempty"`
    Role     string  `json:"role,omitempty"`
    SellerID string
    jwt.RegisteredClaims
}

func ValidateToken(header string) (*Claims, error) {
    // ... código actual ...
}

// ============================================
// DESPUÉS (Código Modificado)
// ============================================
package websockets

import (
    "context"
    "errors"
    "os"
    "strings"
    "github.com/golang-jwt/jwt/v4"
    "github.com/redis/go-redis/v9"  // NUEVO: Para blacklist
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))
var jwtIssuer = os.Getenv("JWT_ISSUER")       // NUEVO
var jwtAudience = os.Getenv("JWT_AUDIENCE")   // NUEVO

// NUEVO: Cliente Redis para blacklist
var redisClient *redis.Client

func init() {
    redisURL := os.Getenv("REDIS_URL")
    if redisURL != "" {
        opt, _ := redis.ParseURL(redisURL)
        redisClient = redis.NewClient(opt)
    }
}

// Claims MODIFICADO: Agregar campos estándar
type Claims struct {
    UserID      string  `json:"user_id"`
    ID          float64 `json:"id,omitempty"`
    IDSeller    float64 `json:"id_seller,omitempty"`
    Role        string  `json:"role,omitempty"`
    Email       string  `json:"email,omitempty"`       // NUEVO
    Name        string  `json:"name,omitempty"`        // NUEVO
    ReferenceID int     `json:"reference_id,omitempty"` // NUEVO
    SellerID    string
    jwt.RegisteredClaims
}

// NUEVO: Verificar si token está revocado
func isTokenRevoked(jti string) bool {
    if redisClient == nil {
        return false
    }
    ctx := context.Background()
    exists, err := redisClient.Exists(ctx, "revoked:"+jti).Result()
    if err != nil {
        return false
    }
    return exists == 1
}

func ValidateToken(header string) (*Claims, error) {
    if header == "" {
        return nil, errors.New("no authorization header")
    }

    parts := strings.Split(header, " ")
    if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
        return nil, errors.New("invalid authorization format")
    }

    tokenString := parts[1]

    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        // Verificar algoritmo
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, errors.New("unexpected signing method")
        }
        return jwtSecret, nil
    })

    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, errors.New("invalid token claims")
    }

    // NUEVO: Verificar issuer
    if jwtIssuer != "" && claims.Issuer != jwtIssuer {
        return nil, errors.New("invalid token issuer")
    }

    // NUEVO: Verificar audience
    if jwtAudience != "" {
        validAudience := false
        for _, aud := range claims.Audience {
            if aud == jwtAudience {
                validAudience = true
                break
            }
        }
        if !validAudience {
            return nil, errors.New("invalid token audience")
        }
    }

    // NUEVO: Verificar blacklist
    if claims.ID != "" && isTokenRevoked(claims.ID) {
        return nil, errors.New("token has been revoked")
    }

    // Calcular SellerID desde IDSeller si existe
    if claims.IDSeller != 0 {
        claims.SellerID = fmt.Sprintf("%.0f", claims.IDSeller)
    }

    return claims, nil
}
```

##### 2. `.env` o Variables de Entorno Docker

```env
# ============================================
# NUEVAS VARIABLES NECESARIAS
# ============================================
JWT_SECRET=your-super-secret-key-shared-with-auth-service
JWT_ISSUER=auth-service
JWT_AUDIENCE=marketplace-espigon
REDIS_URL=redis://localhost:6379
```

##### 3. `go.mod` - Verificar dependencias

```go
// Asegurar que existe:
require (
    github.com/golang-jwt/jwt/v4 v4.5.2
    github.com/redis/go-redis/v9 v9.7.0
)
```

---

### 📂 CAMBIOS EN FRONTEND (`frontend/`)

#### 📁 Archivos a MODIFICAR

##### 1. `src/api/auth.ts`

```typescript
// ============================================
// ANTES (Código Actual)
// ============================================
import apiClient from './client';

export const loginClient = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login/client', credentials);
  return response.data;
};

export const loginSeller = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login/seller', credentials);
  return response.data;
};

// ============================================
// DESPUÉS (Código Nuevo)
// ============================================
import axios from 'axios';
import apiClient from './client';
import type { LoginRequest, LoginResponse, TokenResponse, User, UserRole } from '@/types/api';

// NUEVO: URL del Auth Service (separada del REST Service)
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4001';

// NUEVO: Cliente Axios específico para Auth Service
const authClient = axios.create({
  baseURL: AUTH_SERVICE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// ============================================
// Login - MODIFICADO: Ya no separa por roles
// ============================================
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/login', credentials);
  
  // NUEVO: Guardar ambos tokens
  if (response.data.access_token) {
    saveAuthData(response.data.access_token, response.data.refresh_token, response.data.user);
  }
  
  return response.data;
};

// DEPRECADO: Mantener para compatibilidad, pero redirigen a login unificado
export const loginClient = (credentials: LoginRequest) => login(credentials);
export const loginSeller = (credentials: LoginRequest) => login(credentials);
export const loginAdmin = (credentials: LoginRequest) => login(credentials);

// ============================================
// Register - MODIFICADO
// ============================================
export const registerClient = async (data: RegisterClientRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/register', {
    ...data,
    role: 'client'
  });
  
  if (response.data.access_token) {
    saveAuthData(response.data.access_token, response.data.refresh_token, response.data.user);
  }
  
  return response.data;
};

export const registerSeller = async (data: RegisterSellerRequest): Promise<LoginResponse> => {
  const response = await authClient.post<LoginResponse>('/auth/register', {
    ...data,
    role: 'seller'
  });
  
  if (response.data.access_token) {
    saveAuthData(response.data.access_token, response.data.refresh_token, response.data.user);
  }
  
  return response.data;
};

// ============================================
// NUEVO: Refresh Token
// ============================================
export const refreshAccessToken = async (): Promise<TokenResponse> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await authClient.post<TokenResponse>('/auth/refresh', {
    refresh_token: refreshToken
  });
  
  // Actualizar tokens almacenados
  if (response.data.access_token) {
    localStorage.setItem('auth_token', response.data.access_token);
    if (response.data.refresh_token) {
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
  }
  
  return response.data;
};

// ============================================
// NUEVO: Logout mejorado
// ============================================
export const logout = async (): Promise<void> => {
  try {
    const accessToken = getAuthToken();
    const refreshToken = getRefreshToken();
    
    if (accessToken) {
      // Notificar al Auth Service para invalidar tokens
      await authClient.post('/auth/logout', 
        { refresh_token: refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    // Siempre limpiar localStorage
    clearAuthData();
  }
};

// ============================================
// NUEVO: Get current user from Auth Service
// ============================================
export const getCurrentUser = async (): Promise<User> => {
  const response = await authClient.get('/auth/me', {
    headers: { Authorization: `Bearer ${getAuthToken()}` }
  });
  return response.data.user;
};

// ============================================
// Token Verification
// ============================================
export const verifyToken = async (): Promise<{ valid: boolean; user?: User }> => {
  try {
    const response = await authClient.get('/auth/validate', {
      headers: { Authorization: `Bearer ${getAuthToken()}` }
    });
    return { valid: response.data.valid, user: response.data.user };
  } catch (error) {
    return { valid: false };
  }
};

// ============================================
// NUEVO: Helper Functions mejoradas
// ============================================
export const saveAuthData = (accessToken: string, refreshToken: string | undefined, user: User): void => {
  localStorage.setItem('auth_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuthData = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getAuthToken = (): string | null => localStorage.getItem('auth_token');
export const getRefreshToken = (): string | null => localStorage.getItem('refresh_token');
export const getSavedUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => !!getAuthToken();
```

##### 2. `src/api/client.ts`

```typescript
// ============================================
// AGREGAR: Interceptor para Auto-Refresh de Tokens
// ============================================
import axios from 'axios';
import { refreshAccessToken, clearAuthData, getAuthToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - agregar token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// NUEVO: Response interceptor - auto refresh en 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si es 401 y no es un retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si el error es TOKEN_EXPIRED, intentar refresh
      if (error.response?.data?.code === 'TOKEN_EXPIRED') {
        
        if (isRefreshing) {
          // Si ya se está refrescando, encolar esta petición
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { access_token } = await refreshAccessToken();
          
          processQueue(null, access_token);
          
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // Refresh falló, hacer logout
          clearAuthData();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // Token inválido (no expirado), hacer logout
      clearAuthData();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

##### 3. `src/context/AuthContext.tsx`

```typescript
// ============================================
// CAMBIOS PRINCIPALES
// ============================================

// NUEVO: Agregar refreshToken al estado
const [refreshToken, setRefreshToken] = useState<string | null>(null);

// MODIFICAR: useEffect de inicialización
useEffect(() => {
  const initAuth = async () => {
    try {
      const savedToken = getAuthToken();
      const savedRefreshToken = getRefreshToken();  // NUEVO
      const savedUser = getSavedUser();

      if (savedToken && savedUser) {
        // Verificar si el token sigue válido
        const { valid } = await verifyToken();
        
        if (valid) {
          setToken(savedToken);
          setRefreshToken(savedRefreshToken);  // NUEVO
          setUser(savedUser);
        } else if (savedRefreshToken) {
          // NUEVO: Intentar refresh si el access token expiró
          try {
            const newTokens = await refreshAccessToken();
            setToken(newTokens.access_token);
            setRefreshToken(newTokens.refresh_token || savedRefreshToken);
            setUser(savedUser);
          } catch {
            clearAuthData();
          }
        } else {
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  initAuth();
}, []);

// MODIFICAR: función login
const login = async (credentials: LoginRequest, role: UserRole = 'client') => {
  const response = await apiLogin(credentials);  // Ya no necesita role
  
  setToken(response.access_token);
  setRefreshToken(response.refresh_token);  // NUEVO
  setUser(response.user);
  
  // Los tokens ya se guardan en apiLogin
  return response;
};

// MODIFICAR: función logout
const logoutUser = async () => {
  await logout();  // Llama al Auth Service
  setToken(null);
  setRefreshToken(null);  // NUEVO
  setUser(null);
};
```

##### 4. `src/types/api.ts`

```typescript
// ============================================
// NUEVOS TIPOS
// ============================================

// NUEVO: Respuesta de tokens
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

// MODIFICAR: LoginResponse
export interface LoginResponse {
  message: string;
  user: User;
  access_token: string;    // Antes era 'token'
  refresh_token: string;   // NUEVO
  expires_in: number;      // NUEVO
}

// MODIFICAR: User
export interface User {
  id: string;              // Ahora es UUID string
  email: string;
  role: UserRole;
  name: string;
  reference_id: number;    // NUEVO: id_client, id_seller, etc.
  email_verified?: boolean;
  created_at?: string;
}
```

##### 5. `.env` (Variables de Entorno Frontend)

```env
# ============================================
# NUEVAS VARIABLES
# ============================================
VITE_API_URL=http://localhost:3000/api
VITE_AUTH_SERVICE_URL=http://localhost:4001
VITE_WS_URL=ws://localhost:8080/ws
```

##### 6. `vite.config.ts` (Opcional: Proxy para desarrollo)

```typescript
export default defineConfig({
  // ... otras configuraciones ...
  server: {
    port: 8080,
    proxy: {
      // NUEVO: Proxy al Auth Service en desarrollo
      '/auth': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
```

---

### 📂 CAMBIOS EN BASE DE DATOS

#### Script de Migración SQL

```sql
-- ============================================
-- SCRIPT DE MIGRACIÓN PARA AUTH SERVICE
-- Ejecutar en PostgreSQL
-- ============================================

-- 1. Crear schema dedicado para autenticación
CREATE SCHEMA IF NOT EXISTS auth;

-- 2. Crear tabla de usuarios unificada
CREATE TABLE auth.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('client', 'seller', 'admin')),
    reference_id    INTEGER NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    email_verified  BOOLEAN DEFAULT false,
    last_login      TIMESTAMP,
    login_attempts  INTEGER DEFAULT 0,
    locked_until    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_users_email ON auth.users(email);
CREATE INDEX idx_auth_users_role_ref ON auth.users(role, reference_id);

-- 3. Crear tabla de refresh tokens
CREATE TABLE auth.refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    device_info     VARCHAR(255),
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    expires_at      TIMESTAMP NOT NULL,
    is_revoked      BOOLEAN DEFAULT false,
    revoked_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON auth.refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON auth.refresh_tokens(expires_at);

-- 4. Crear tabla de tokens revocados (blacklist)
CREATE TABLE auth.revoked_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_jti       VARCHAR(255) NOT NULL UNIQUE,
    user_id         UUID REFERENCES auth.users(id),
    reason          VARCHAR(50) CHECK (reason IN ('logout', 'password_change', 'admin_action', 'suspicious_activity')),
    original_exp    TIMESTAMP NOT NULL,
    revoked_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revoked_tokens_jti ON auth.revoked_tokens(token_jti);
CREATE INDEX idx_revoked_tokens_exp ON auth.revoked_tokens(original_exp);

-- 5. MIGRACIÓN DE DATOS: Copiar usuarios existentes
-- (Ejecutar solo una vez para migrar datos existentes)

-- Migrar clientes
INSERT INTO auth.users (email, password_hash, role, reference_id, created_at)
SELECT 
    client_email, 
    client_password, 
    'client', 
    id_client,
    created_at
FROM public.client
ON CONFLICT (email) DO NOTHING;

-- Migrar vendedores
INSERT INTO auth.users (email, password_hash, role, reference_id, created_at)
SELECT 
    seller_email, 
    seller_password, 
    'seller', 
    id_seller,
    created_at
FROM public.seller
ON CONFLICT (email) DO NOTHING;

-- Migrar administradores
INSERT INTO auth.users (email, password_hash, role, reference_id, created_at)
SELECT 
    admin_email, 
    admin_password, 
    'admin', 
    id_admin,
    created_at
FROM public.admin
ON CONFLICT (email) DO NOTHING;

-- 6. Crear función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION auth.cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Eliminar refresh tokens expirados
    DELETE FROM auth.refresh_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Eliminar tokens revocados cuyo original ya expiró
    DELETE FROM auth.revoked_tokens 
    WHERE original_exp < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION auth.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at();
```

---

### 📂 ARCHIVOS NUEVOS A CREAR EN AUTH SERVICE

| Ruta | Descripción |
|------|-------------|
| `backend/auth_service/src/main.ts` | Entry point del microservicio |
| `backend/auth_service/src/config/database.ts` | Conexión a PostgreSQL |
| `backend/auth_service/src/config/jwt.ts` | Configuración de JWT |
| `backend/auth_service/src/config/env.ts` | Variables de entorno |
| `backend/auth_service/src/controllers/authController.ts` | Handlers de endpoints |
| `backend/auth_service/src/services/authService.ts` | Lógica de negocio |
| `backend/auth_service/src/services/tokenService.ts` | Generación/validación de tokens |
| `backend/auth_service/src/services/rateLimitService.ts` | Rate limiting |
| `backend/auth_service/src/models/User.ts` | Entidad User |
| `backend/auth_service/src/models/RefreshToken.ts` | Entidad RefreshToken |
| `backend/auth_service/src/models/RevokedToken.ts` | Entidad RevokedToken |
| `backend/auth_service/src/middlewares/rateLimiter.ts` | Middleware rate limit |
| `backend/auth_service/src/middlewares/validateRequest.ts` | Validación de inputs |
| `backend/auth_service/src/routes/authRoutes.ts` | Definición de rutas |
| `backend/auth_service/package.json` | Dependencias |
| `backend/auth_service/tsconfig.json` | Configuración TypeScript |
| `backend/auth_service/Dockerfile` | Containerización |
| `backend/auth_service/.env.example` | Ejemplo de variables |

---

### 📊 RESUMEN DE CAMBIOS POR SERVICIO

| Servicio | Archivos Modificar | Archivos Eliminar | Archivos Crear |
|----------|-------------------|-------------------|----------------|
| **REST Service** | 4 | 1-2 (opcional) | 0 |
| **Realtime Service** | 2 | 0 | 0 |
| **Frontend** | 6 | 0 | 0 |
| **Auth Service** | 0 | 0 | 15+ |
| **Base de Datos** | 0 | 0 | 1 script SQL |

---

### Cambios en REST Service

#### 1. Eliminar lógica de login/register

```typescript
// ANTES (authController.ts) - ELIMINAR
export const loginClient = async (req, res) => { ... }
export const registerClient = async (req, res) => { ... }

// DESPUÉS - Redirigir a Auth Service o eliminar rutas
// Las rutas /api/auth/* apuntarán al nuevo Auth Service
```

#### 2. Mantener validación LOCAL de tokens

```typescript
// authMiddleware.ts - MANTENER pero actualizar
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET; // Mismo secreto que Auth Service

export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  try {
    // Validación LOCAL - NO llama a Auth Service
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'auth-service',      // Verificar issuer
      audience: 'marketplace-espigon'
    });
    
    // Opcionalmente verificar blacklist (Redis local)
    // const isRevoked = await checkBlacklist(decoded.jti);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
}
```

### Cambios en Realtime Service (Go)

```go
// auth.go - MANTENER pero actualizar
func ValidateToken(header string) (*Claims, error) {
    // Validación LOCAL - NO llama a Auth Service
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        return jwtSecret, nil
    })
    
    // Verificar issuer
    if claims.Issuer != "auth-service" {
        return nil, errors.New("invalid issuer")
    }
    
    return claims, nil
}
```

### Cambios en Frontend

```typescript
// api/auth.ts - Actualizar URLs
const AUTH_SERVICE_URL = process.env.VITE_AUTH_SERVICE_URL || 'http://localhost:4001';

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, credentials);
  return response.data;
};

export const refreshToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await axios.post(`${AUTH_SERVICE_URL}/auth/refresh`, { refresh_token: refreshToken });
  return response.data;
};
```

```typescript
// api/client.ts - Agregar interceptor para auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const newTokens = await refreshToken(getRefreshToken());
        saveTokens(newTokens);
        
        error.config.headers.Authorization = `Bearer ${newTokens.access_token}`;
        return apiClient(error.config);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 📚 Referencias y Documentación

### Documentación Oficial

1. **JWT (JSON Web Tokens)**
   - RFC 7519: https://tools.ietf.org/html/rfc7519
   - JWT.io: https://jwt.io/introduction/

2. **OAuth 2.0 y Refresh Tokens**
   - RFC 6749: https://tools.ietf.org/html/rfc6749
   - Best Practices: https://oauth.net/2/

3. **Seguridad en APIs**
   - OWASP API Security: https://owasp.org/www-project-api-security/
   - Auth0 Best Practices: https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/

### Librerías Recomendadas

| Librería | Propósito | NPM |
|----------|-----------|-----|
| `jsonwebtoken` | Generación/verificación JWT | https://www.npmjs.com/package/jsonwebtoken |
| `bcrypt` | Hash de contraseñas | https://www.npmjs.com/package/bcrypt |
| `rate-limiter-flexible` | Rate limiting | https://www.npmjs.com/package/rate-limiter-flexible |
| `uuid` | Generación de IDs únicos | https://www.npmjs.com/package/uuid |
| `helmet` | Seguridad HTTP | https://www.npmjs.com/package/helmet |

---

## 📅 Plan de Implementación Sugerido

### Fase 1: Setup Inicial (2-3 horas)
- [ ] Crear estructura del proyecto `auth_service`
- [ ] Configurar TypeScript, ESLint, package.json
- [ ] Configurar conexión a PostgreSQL
- [ ] Crear schema `auth` y tablas

### Fase 2: Core Authentication (4-6 horas)
- [ ] Implementar modelo User
- [ ] Implementar registro (`POST /auth/register`)
- [ ] Implementar login (`POST /auth/login`)
- [ ] Generar access y refresh tokens

### Fase 3: Token Management (3-4 horas)
- [ ] Implementar refresh token (`POST /auth/refresh`)
- [ ] Implementar logout (`POST /auth/logout`)
- [ ] Implementar blacklist de tokens
- [ ] Implementar `GET /auth/me` y `GET /auth/validate`

### Fase 4: Seguridad (2-3 horas)
- [ ] Implementar rate limiting en login
- [ ] Agregar validaciones de input
- [ ] Configurar CORS y Helmet
- [ ] Tests de seguridad

### Fase 5: Integración (3-4 horas)
- [ ] Modificar REST Service para validación local
- [ ] Modificar Realtime Service para validación local
- [ ] Actualizar Frontend con nuevo flujo
- [ ] Migrar usuarios existentes (opcional)

### Fase 6: Documentación y Deploy (1-2 horas)
- [ ] Documentar API (Swagger)
- [ ] Crear Dockerfile
- [ ] Actualizar docker-compose.yml general
- [ ] README final

---

## ✅ Checklist de Requisitos del Pilar 1

| Requisito | Descripción | Implementado |
|-----------|-------------|--------------|
| Auth Service Independiente | Microservicio dedicado a autenticación | ✅ |
| JWT Access + Refresh | Tokens de corta y larga duración | ✅ (Configuración) |
| Validación Local | Otros servicios validan sin consultar Auth | ⬜ |
| Base de Datos Propia | Tablas: users, refresh_tokens, revoked_tokens | ⬜ |
| Rate Limiting | Límite de intentos en login | ⬜ |
| Blacklist de Tokens | Revocación de tokens activos | ⬜ |
| POST /auth/register | Registro de usuarios | ⬜ (Placeholder) |
| POST /auth/login | Inicio de sesión | ⬜ (Placeholder) |
| POST /auth/logout | Cierre de sesión | ⬜ (Placeholder) |
| POST /auth/refresh | Renovación de token | ⬜ (Placeholder) |
| GET /auth/me | Información del usuario | ⬜ (Placeholder) |
| GET /auth/validate | Validación de token (interno) | ⬜ (Placeholder) |

---

## 📈 ESTADO ACTUAL DE IMPLEMENTACIÓN

> **Última actualización**: 2 de enero de 2026

### ✅ FASE 1: Setup del Auth Service - COMPLETADA (100%)

| Componente | Archivo | Estado |
|------------|---------|--------|
| Entry Point | `src/main.ts` | ✅ Implementado |
| Variables de Entorno | `src/config/env.ts` | ✅ Implementado |
| Conexión BD | `src/config/database.ts` | ✅ Implementado |
| Configuración JWT | `src/config/jwt.ts` | ✅ Implementado |
| Modelo User | `src/models/User.ts` | ✅ Implementado |
| Modelo RefreshToken | `src/models/RefreshToken.ts` | ✅ Implementado |
| Modelo RevokedToken | `src/models/RevokedToken.ts` | ✅ Implementado |
| Rutas Base | `src/routes/authRoutes.ts` | ✅ Placeholder |
| Package.json | `package.json` | ✅ Configurado |
| TypeScript Config | `tsconfig.json` | ✅ Configurado |
| Environment Files | `.env`, `.env.example` | ✅ Configurado |

**Archivos creados:**
```
backend/auth_service/
├── src/
│   ├── main.ts                    ✅
│   ├── config/
│   │   ├── database.ts            ✅
│   │   ├── env.ts                 ✅
│   │   └── jwt.ts                 ✅
│   ├── models/
│   │   ├── index.ts               ✅
│   │   ├── User.ts                ✅
│   │   ├── RefreshToken.ts        ✅
│   │   └── RevokedToken.ts        ✅
│   └── routes/
│       ├── index.ts               ✅
│       └── authRoutes.ts          ✅ (placeholder)
├── package.json                   ✅
├── tsconfig.json                  ✅
├── .env                           ✅
├── .env.example                   ✅
└── .gitignore                     ✅
```

### ⏳ FASE 2: Tablas en Base de Datos - PENDIENTE (0%)

| Tarea | Estado |
|-------|--------|
| Crear schema `auth` en Supabase | ⬜ Pendiente |
| Crear tabla `auth.users` | ⬜ Pendiente |
| Crear tabla `auth.refresh_tokens` | ⬜ Pendiente |
| Crear tabla `auth.revoked_tokens` | ⬜ Pendiente |
| Crear índices | ⬜ Pendiente |
| Migrar usuarios existentes | ⬜ Pendiente |

### ⏳ FASE 3: Implementar Endpoints - PENDIENTE (0%)

| Endpoint | Archivo | Estado |
|----------|---------|--------|
| `POST /auth/register` | `authController.ts` | ⬜ Solo placeholder |
| `POST /auth/login` | `authController.ts` | ⬜ Solo placeholder |
| `POST /auth/logout` | `authController.ts` | ⬜ Solo placeholder |
| `POST /auth/refresh` | `authController.ts` | ⬜ Solo placeholder |
| `GET /auth/me` | `authController.ts` | ⬜ Solo placeholder |
| `GET /auth/validate` | `authController.ts` | ⬜ Solo placeholder |

**Archivos por crear:**
```
backend/auth_service/src/
├── controllers/
│   └── authController.ts          ⬜ Pendiente
├── services/
│   ├── authService.ts             ⬜ Pendiente
│   └── tokenService.ts            ⬜ Pendiente
└── repositories/
    ├── userRepository.ts          ⬜ Pendiente
    ├── refreshTokenRepository.ts  ⬜ Pendiente
    └── revokedTokenRepository.ts  ⬜ Pendiente
```

### ⏳ FASE 4: Seguridad (Rate Limiting + Blacklist) - PENDIENTE (0%)

| Tarea | Archivo | Estado |
|-------|---------|--------|
| Rate Limiter Middleware | `middlewares/rateLimiter.ts` | ⬜ Pendiente |
| Validación de Inputs | `middlewares/validateRequest.ts` | ⬜ Pendiente |
| Verificación Blacklist | `services/tokenService.ts` | ⬜ Pendiente |
| Redis Integration (opcional) | `config/redis.ts` | ⬜ Pendiente |

### ⏳ FASE 5: Modificar REST Service - PENDIENTE (0%)

| Tarea | Archivo | Estado |
|-------|---------|--------|
| Actualizar authMiddleware | `rest_service/src/infrastructure/middlewares/authMiddleware.ts` | ⬜ Pendiente |
| Eliminar/deprecar authController | `rest_service/src/infrastructure/http/controllers/authController.ts` | ⬜ Pendiente |
| Actualizar rutas o proxy | `rest_service/src/main/main.ts` | ⬜ Pendiente |
| Agregar variables de entorno | `rest_service/.env` | ⬜ Pendiente |

### ⏳ FASE 6: Modificar Realtime Service (Go) - PENDIENTE (0%)

| Tarea | Archivo | Estado |
|-------|---------|--------|
| Actualizar auth.go | `realtime_service/internal/websockets/auth.go` | ⬜ Pendiente |
| Agregar verificación issuer/audience | `realtime_service/internal/websockets/auth.go` | ⬜ Pendiente |
| Variables de entorno | `realtime_service/.env` | ⬜ Pendiente |

### ⏳ FASE 7: Modificar Frontend - PENDIENTE (0%)

| Tarea | Archivo | Estado |
|-------|---------|--------|
| Actualizar api/auth.ts | `frontend/src/api/auth.ts` | ⬜ Pendiente |
| Agregar interceptor refresh | `frontend/src/api/client.ts` | ⬜ Pendiente |
| Actualizar AuthContext | `frontend/src/context/AuthContext.tsx` | ⬜ Pendiente |
| Agregar tipos nuevos | `frontend/src/types/api.ts` | ⬜ Pendiente |
| Variables de entorno | `frontend/.env` | ⬜ Pendiente |

### ⏳ FASE 8: Docker y Deployment - PENDIENTE (0%)

| Tarea | Archivo | Estado |
|-------|---------|--------|
| Dockerfile | `auth_service/Dockerfile` | ⬜ Pendiente |
| docker-compose.yml | `auth_service/docker-compose.yml` | ⬜ Pendiente |
| Actualizar compose global | `docker-compose.yml` (raíz) | ⬜ Pendiente |

### ⏳ FASE 9: Testing y Documentación - PENDIENTE (0%)

| Tarea | Estado |
|-------|--------|
| Tests unitarios | ⬜ Pendiente |
| Tests de integración | ⬜ Pendiente |
| Documentación Swagger | ⬜ Pendiente |
| Postman Collection | ⬜ Pendiente |

---

## 📊 RESUMEN DE PROGRESO

| Fase | Descripción | Progreso |
|------|-------------|----------|
| **FASE 1** | Setup Auth Service | ✅ 100% |
| **FASE 2** | Tablas BD | ⬜ 0% |
| **FASE 3** | Endpoints | ⬜ 0% |
| **FASE 4** | Seguridad | ⬜ 0% |
| **FASE 5** | REST Service | ⬜ 0% |
| **FASE 6** | Realtime Service | ⬜ 0% |
| **FASE 7** | Frontend | ⬜ 0% |
| **FASE 8** | Docker | ⬜ 0% |
| **FASE 9** | Testing | ⬜ 0% |

**Progreso Total Estimado: ~11%** (1 de 9 fases completadas)

---

## 🚀 PRÓXIMOS PASOS

1. **INMEDIATO (FASE 2)**: Crear tablas en Supabase
   ```sql
   -- Ejecutar en SQL Editor de Supabase:
   CREATE SCHEMA IF NOT EXISTS auth;
   -- (ver script completo en sección "Script de Migración SQL")
   ```

2. **SIGUIENTE (FASE 3)**: Implementar los 6 endpoints
   - Crear `authController.ts`, `authService.ts`, `tokenService.ts`
   - Implementar lógica de register, login, logout, refresh, me, validate

3. **DESPUÉS (FASE 4)**: Agregar rate limiting y blacklist

---

## 🎯 Justificación Arquitectónica

### ¿Por qué separar la autenticación?

1. **Single Responsibility Principle (SRP)**: Cada servicio tiene una única responsabilidad
2. **Escalabilidad Independiente**: El Auth Service puede escalar por separado si hay picos de login
3. **Seguridad Centralizada**: Un único punto de gestión de credenciales
4. **Facilidad de Auditoría**: Logs centralizados de accesos
5. **Cumplimiento**: Facilita cumplir con GDPR/regulaciones de datos sensibles

### ¿Por qué validación LOCAL?

1. **Performance**: Evita latencia de red en cada request
2. **Disponibilidad**: El sistema funciona aunque Auth Service esté caído temporalmente
3. **Costo**: Reduce llamadas de red y consumo de recursos
4. **Escalabilidad**: No hay cuello de botella en Auth Service

### ¿Por qué Refresh Tokens?

1. **Seguridad**: Access tokens de corta duración limitan ventana de ataque
2. **Experiencia de Usuario**: No requiere login frecuente
3. **Control**: Permite revocar acceso sin cambiar contraseña
4. **Estándar**: Patrón OAuth 2.0 ampliamente adoptado

---

## 📝 Notas Finales

Este documento sirve como guía completa para la implementación del Pilar 1. Cada sección puede expandirse según las necesidades específicas del proyecto. Se recomienda:

1. Leer las referencias de documentación oficial antes de implementar
2. Seguir el orden del plan de implementación
3. Probar cada endpoint individualmente antes de integrar
4. Documentar cualquier decisión que se desvíe de este plan

**Autor**: Equipo de Desarrollo MarketPlace Espigón Manta  
**Fecha**: 29 de Diciembre de 2025  
**Versión**: 1.0
