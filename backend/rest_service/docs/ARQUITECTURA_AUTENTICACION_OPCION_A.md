# 🔐 Arquitectura de Autenticación - Opción A (Auth Service como fuente de verdad)

**Fecha:** 17 de Enero 2026  
**Autor:** Equipo de Desarrollo  
**Versión:** 2.0

---

## 📋 Índice

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura](#arquitectura)
3. [Flujo de Registro](#flujo-de-registro)
4. [Flujo de Login](#flujo-de-login)
5. [Estructura de JWT](#estructura-de-jwt)
6. [Migraciones de Base de Datos](#migraciones-de-base-de-datos)
7. [Ejemplos de API](#ejemplos-de-api)
8. [Pasos de Implementación](#pasos-de-implementación)

---

## 🎯 Resumen Ejecutivo

### Cambios Principales

✅ **Auth Service** (`auth_service.users`) es la fuente de verdad para autenticación  
✅ **REST Service** (`client`, `seller`, `admin`) solo almacena perfiles de negocio  
✅ **No hay FK** entre servicios (arquitectura microservicios con eventual consistency)  
✅ **No hay fallbacks** al REST Service (login 100% en Auth Service)  
✅ **JWT simplificado** con `sub` (user_id UUID), `email`, `role`, `name`

### Ventajas

- ✨ Separación clara de responsabilidades
- 🔒 Autenticación centralizada
- 🚀 Escalabilidad independiente
- 🛡️ Mayor seguridad (1 sola fuente de passwords)
- 🔄 Consistencia eventual entre servicios

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                              │
│  (React + TypeScript)                                        │
└────────────┬─────────────────────────────────┬───────────────┘
             │                                 │
             │ 1. POST /auth/register          │ 3. POST /api/clients
             │    (email, password, role)      │    (user_id, perfil)
             │                                 │
             ▼                                 ▼
┌─────────────────────────────┐    ┌──────────────────────────┐
│      AUTH SERVICE            │    │     REST SERVICE         │
│      (Puerto 4001)           │    │     (Puerto 3000)        │
│                              │    │                          │
│  ┌───────────────────────┐  │    │  ┌────────────────────┐  │
│  │ auth_service.users    │  │    │  │ client             │  │
│  ├───────────────────────┤  │    │  ├────────────────────┤  │
│  │ id (UUID) PK          │  │    │  │ id_client PK       │  │
│  │ email UNIQUE          │  │    │  │ user_id (UUID)     │  │
│  │ password_hash         │  │    │  │ client_name        │  │
│  │ role (enum)           │  │    │  │ address            │  │
│  │ name                  │  │    │  │ ...                │  │
│  │ is_active             │  │    │  └────────────────────┘  │
│  │ ...                   │  │    │                          │
│  └───────────────────────┘  │    │  ┌────────────────────┐  │
│                              │    │  │ seller             │  │
│  Returns:                    │    │  ├────────────────────┤  │
│  - access_token (JWT)        │    │  │ id_seller PK       │  │
│  - refresh_token             │    │  │ user_id (UUID)     │  │
│  - user { id, email, role }  │    │  │ seller_name        │  │
│                              │    │  │ ...                │  │
└──────────────────────────────┘    │  └────────────────────┘  │
                                    │                          │
                                    │  ┌────────────────────┐  │
                                    │  │ admin              │  │
                                    │  ├────────────────────┤  │
                                    │  │ id_admin PK        │  │
                                    │  │ user_id (UUID)     │  │
                                    │  │ admin_name         │  │
                                    │  │ ...                │  │
                                    │  └────────────────────┘  │
                                    └──────────────────────────┘
```

### Relación entre Servicios

```sql
-- NO HAY FK porque son DBs separadas
-- La relación es lógica: client.user_id = auth_service.users.id
-- La consistencia se mantiene a nivel de aplicación
```

---

## 📝 Flujo de Registro

### Paso 1: Crear Usuario en Auth Service

**Endpoint:** `POST http://localhost:4001/auth/register`

**Request:**
```json
{
  "email": "juan.perez@example.com",
  "password": "MiPassword123!",
  "role": "client",
  "name": "Juan Pérez"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "juan.perez@example.com",
    "role": "client",
    "name": "Juan Pérez"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

### Paso 2: Crear Perfil en REST Service

El frontend extrae `user.id` del response y crea el perfil:

**Endpoint:** `POST http://localhost:3000/api/clients`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_name": "Juan Pérez",
  "address": "Av. Principal 123, Manta",
  "phone": "0987654321",
  "document_type": "cedula",
  "document_number": "1234567890"
}
```

**Response (201 Created):**
```json
{
  "id_client": 1,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "client_name": "Juan Pérez",
  "client_email": "juan.perez@example.com",
  "address": "Av. Principal 123, Manta",
  "phone": "0987654321",
  "created_at": "2026-01-17T10:30:00Z"
}
```

### Errores Comunes

**Error: Email ya existe**
```json
{
  "error": "EMAIL_EXISTS",
  "message": "El email ya está registrado"
}
```

**Error: Password débil**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "La contraseña debe tener al menos 8 caracteres"
}
```

---

## 🔑 Flujo de Login

### Request

**Endpoint:** `POST http://localhost:4001/auth/login`

**Request:**
```json
{
  "email": "juan.perez@example.com",
  "password": "MiPassword123!"
}
```

### Response Exitoso (200 OK)

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "juan.perez@example.com",
    "role": "client",
    "name": "Juan Pérez"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3NzBjODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6Imp1YW4ucGVyZXpAZXhhbXBsZS5jb20iLCJyb2xlIjoiY2xpZW50IiwibmFtZSI6Ikp1YW4gUMOpcmV6IiwiaXNzIjoibWFya2V0cGxhY2UtZXNwaWdvbi1tYW50YSIsImF1ZCI6Im1hcmtldHBsYWNlLWNsaWVudHMiLCJpYXQiOjE3MzY3NjE4MDAsImV4cCI6MTczNjc2MjcwMH0...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

### Errores Comunes

**Error: Credenciales inválidas (401)**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Credenciales inválidas"
}
```

**Error: Cuenta bloqueada (403)**
```json
{
  "error": "ACCOUNT_LOCKED",
  "message": "Cuenta bloqueada. Intente nuevamente en 15 minutos"
}
```

**Error: Cuenta desactivada (403)**
```json
{
  "error": "ACCOUNT_INACTIVE",
  "message": "La cuenta está desactivada"
}
```

---

## 🎫 Estructura de JWT

### Access Token Payload

```json
{
  "jti": "770c8400-e29b-41d4-a716-446655440000",
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "juan.perez@example.com",
  "role": "client",
  "name": "Juan Pérez",
  "iss": "marketplace-espigon-manta",
  "aud": "marketplace-clients",
  "iat": 1736761800,
  "exp": 1736762700
}
```

### Campos del Token

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `jti` | UUID | JWT ID único para revocación |
| `sub` | UUID | **User ID** (PK de auth_service.users) |
| `email` | string | Email del usuario |
| `role` | enum | `client`, `seller`, o `admin` |
| `name` | string | Nombre completo |
| `iss` | string | Emisor del token |
| `aud` | string | Audiencia autorizada |
| `iat` | number | Timestamp de emisión |
| `exp` | number | Timestamp de expiración (15 min) |

### Uso del Token

```typescript
// En el frontend
const token = response.data.access_token;
localStorage.setItem('auth_token', token);

// En requests posteriores
axios.get('/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// En el backend (middleware)
const decoded = jwt.verify(token, JWT_SECRET);
const userId = decoded.sub; // UUID del usuario
const userRole = decoded.role; // client, seller, admin
```

---

## 🗄️ Migraciones de Base de Datos

### 1. Auth Service: Eliminar reference_id

**Archivo:** `backend/auth_service/migrations/remove_reference_id_from_users.sql`

```sql
-- Eliminar reference_id (ya no se necesita)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'auth_service' 
        AND table_name = 'users' 
        AND column_name = 'reference_id'
    ) THEN
        DROP INDEX IF EXISTS auth_service.idx_users_reference_id;
        ALTER TABLE auth_service.users DROP COLUMN reference_id;
        RAISE NOTICE 'Columna reference_id eliminada exitosamente';
    END IF;
END $$;
```

**Ejecutar:**
```bash
cd backend/auth_service
psql $DATABASE_URL -f migrations/remove_reference_id_from_users.sql
```

### 2. REST Service: Agregar user_id

**Archivo:** `backend/rest_service/migrations/add_user_id_to_profiles.sql`

```sql
-- Agregar user_id a client
ALTER TABLE client ADD COLUMN user_id UUID NULL;
CREATE INDEX idx_client_user_id ON client(user_id);
COMMENT ON COLUMN client.user_id IS 'UUID del usuario en auth_service.users';

-- Agregar user_id a seller
ALTER TABLE seller ADD COLUMN user_id UUID NULL;
CREATE INDEX idx_seller_user_id ON seller(user_id);
COMMENT ON COLUMN seller.user_id IS 'UUID del usuario en auth_service.users';

-- Agregar user_id a admin
ALTER TABLE admin ADD COLUMN user_id UUID NULL;
CREATE INDEX idx_admin_user_id ON admin(user_id);
COMMENT ON COLUMN admin.user_id IS 'UUID del usuario en auth_service.users';
```

**Ejecutar:**
```bash
cd backend/rest_service
psql $DATABASE_URL -f migrations/add_user_id_to_profiles.sql
```

### 3. Migración de Datos Existentes

**Script:** `backend/auth_service/scripts/migrate_users_to_auth.ts`

Este script:
1. Lee usuarios de `client`, `seller`, `admin` del REST Service
2. Crea usuarios en `auth_service.users` con UUID
3. Actualiza `user_id` en las tablas del REST Service

**Ejecutar:**
```bash
cd backend/auth_service
npm install bcrypt uuid
npx ts-node scripts/migrate_users_to_auth.ts
```

**Output esperado:**
```
🚀 Iniciando migración de usuarios...

✅ Conexión a bases de datos establecida

📦 Migrando clientes...
  ✓ Cliente migrado: juan@example.com (550e8400-e29b-41d4-a716-446655440000)
  ✓ Cliente migrado: maria@example.com (660f9511-f3ac-52e5-b827-557766551111)

📦 Migrando vendedores...
  ✓ Vendedor migrado: tienda1@example.com (770g0622-g4bd-63f6-c938-668877662222)

📦 Migrando administradores...
  ✓ Admin migrado: saulcastrocm@hotmail.com (880h1733-h5ce-74g7-d049-779988773333)

✨ Migración completada exitosamente!

📊 Resumen:
   - Clientes migrados: 2
   - Vendedores migrados: 1
   - Administradores migrados: 1
   - Total: 4

🎉 Script finalizado exitosamente
```

---

## 📡 Ejemplos de API

### Registro de Cliente

```bash
# Paso 1: Crear usuario en Auth Service
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo.cliente@example.com",
    "password": "Password123!",
    "role": "client",
    "name": "Nuevo Cliente"
  }'

# Response:
{
  "user": {
    "id": "990i2844-i6df-85h8-e15a-889900884444",
    "email": "nuevo.cliente@example.com",
    "role": "client",
    "name": "Nuevo Cliente"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}

# Paso 2: Crear perfil en REST Service
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "990i2844-i6df-85h8-e15a-889900884444",
    "client_name": "Nuevo Cliente",
    "address": "Calle Falsa 123",
    "phone": "0999999999"
  }'
```

### Login de Vendedor

```bash
curl -X POST http://localhost:4001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tienda1@example.com",
    "password": "VendedorPass123"
  }'

# Response:
{
  "user": {
    "id": "770g0622-g4bd-63f6-c938-668877662222",
    "email": "tienda1@example.com",
    "role": "seller",
    "name": "Tienda 1"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

### Refresh Token

```bash
curl -X POST http://localhost:4001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900
}
```

### Logout

```bash
curl -X POST http://localhost:4001/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "logout_all_devices": false
  }'

# Response:
{
  "message": "Logout exitoso"
}
```

### Validar Token

```bash
curl -X POST http://localhost:4001/auth/validate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# Response:
{
  "valid": true,
  "payload": {
    "jti": "770c8400-e29b-41d4-a716-446655440000",
    "sub": "550e8400-e29b-41d4-a716-446655440000",
    "email": "juan.perez@example.com",
    "role": "client",
    "name": "Juan Pérez",
    "iat": 1736761800,
    "exp": 1736762700
  }
}
```

---

## 🚀 Pasos de Implementación

### Checklist de Implementación

#### Backend - Auth Service

- [x] ✅ Actualizar entidad `User` (eliminar `reference_id`)
- [x] ✅ Actualizar interfaces `RegisterData`, `AuthResponse` (sin `reference_id`)
- [x] ✅ Actualizar `tokenService` (JWT sin `reference_id`)
- [x] ✅ Ejecutar migration `remove_reference_id_from_users.sql`
- [ ] ⏳ Verificar que `/auth/register` funciona
- [ ] ⏳ Verificar que `/auth/login` funciona
- [ ] ⏳ Verificar que `/auth/refresh` funciona

#### Backend - REST Service

- [x] ✅ Agregar campo `user_id` a `ClientEntity`
- [x] ✅ Agregar campo `user_id` a `SellerEntity`
- [x] ✅ Agregar campo `user_id` a `AdminEntity`
- [x] ✅ Ejecutar migration `add_user_id_to_profiles.sql`
- [ ] ⏳ Actualizar `POST /api/clients` para aceptar `user_id`
- [ ] ⏳ Actualizar `POST /api/sellers` para aceptar `user_id`
- [ ] ⏳ Actualizar `POST /api/admins` para aceptar `user_id`
- [ ] ⏳ Eliminar endpoints de login del REST Service (`/auth/login/client`, etc.)

#### Frontend

- [x] ✅ Eliminar funciones de fallback en `auth.ts`
- [x] ✅ Simplificar `login()` para usar solo Auth Service
- [x] ✅ Actualizar `register()` para flujo en 2 pasos
- [ ] ⏳ Actualizar componentes de registro para crear perfil después de register
- [ ] ⏳ Actualizar `AuthContext` para manejar nuevo flujo
- [ ] ⏳ Probar login con usuarios existentes
- [ ] ⏳ Probar registro completo (Auth + REST)

#### Migración de Datos

- [x] ✅ Crear script `migrate_users_to_auth.ts`
- [ ] ⏳ Ejecutar script en desarrollo
- [ ] ⏳ Verificar que `user_id` se actualizó en todas las tablas
- [ ] ⏳ Ejecutar script en producción

#### Pruebas

- [ ] ⏳ Probar registro de nuevo cliente
- [ ] ⏳ Probar login de cliente existente
- [ ] ⏳ Probar refresh token
- [ ] ⏳ Probar logout
- [ ] ⏳ Probar acceso a endpoints protegidos con JWT
- [ ] ⏳ Probar intentos fallidos de login (bloqueo)
- [ ] ⏳ Probar registro con email duplicado

---

## 🎓 Preguntas Frecuentes

### ¿Por qué no hay FK entre user_id y users.id?

Porque Auth Service y REST Service pueden estar en bases de datos separadas (arquitectura microservicios). La consistencia se mantiene a nivel de aplicación (eventual consistency).

### ¿Qué pasa si elimino un usuario de auth_service.users?

Debes implementar un soft delete (`is_active = false`) en lugar de eliminar físicamente. Si eliminas el usuario, el perfil en REST Service quedará huérfano (no podrá hacer login).

### ¿Puedo crear perfiles sin usuario en Auth Service?

No. El flujo correcto es:
1. Crear usuario en Auth Service (obtener `user_id`)
2. Crear perfil en REST Service con ese `user_id`

### ¿Cómo sincronizo email entre auth_service.users y client.client_email?

No es necesario. `auth_service.users.email` es la fuente de verdad. El REST Service puede leer el email del JWT cuando sea necesario.

### ¿El password está duplicado?

NO. Después de la migración, los passwords solo existen en `auth_service.users.password_hash`. Los campos `client_password`, `seller_password`, `admin_password` del REST Service quedarán obsoletos y eventualmente se deben eliminar.

---

## 📞 Soporte

Si tienes dudas o problemas con la implementación:

1. Revisa los logs del Auth Service: `docker logs auth-service`
2. Revisa la consola del frontend para errores de red
3. Verifica que las migraciones se ejecutaron correctamente
4. Consulta este documento para ejemplos de requests/responses

---

**Última actualización:** 17 de Enero 2026  
**Próxima revisión:** Después de completar checklist de implementación
