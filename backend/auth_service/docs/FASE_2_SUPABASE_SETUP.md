# 🗄️ FASE 2: Configuración de Base de Datos en Supabase

## 🎯 ¿Qué vamos a crear y POR QUÉ?

### 1. Schema `auth`
**¿Qué es?** Un "contenedor" separado para las tablas de autenticación.

**¿Por qué?** Para separar la lógica de autenticación del resto de datos (productos, órdenes, etc. están en el schema `public`). Esto es una buena práctica de arquitectura de microservicios.

---

### 2. Tabla `auth.users` 
**¿Qué es?** Tabla UNIFICADA de credenciales de todos los usuarios.

**¿Por qué?** Actualmente tenemos 3 tablas separadas (`client`, `seller`, `admin`) cada una con su propio email y password. Esto es un **antipatrón**. La tabla `auth.users` centraliza SOLO las credenciales de autenticación.

| Columna | Tipo | ¿Para qué sirve? |
|---------|------|------------------|
| `id` | UUID | Identificador único del usuario en el sistema de auth |
| `email` | VARCHAR | Email para login (único) |
| `password_hash` | VARCHAR | Contraseña encriptada con bcrypt |
| `role` | VARCHAR | Tipo de usuario: 'client', 'seller', 'admin' |
| `reference_id` | INTEGER | **CLAVE**: El `id_client`, `id_seller` o `id_admin` de las tablas originales |
| `login_attempts` | INTEGER | Contador de intentos fallidos (para bloquear después de X intentos) |
| `locked_until` | TIMESTAMP | Si la cuenta está bloqueada, hasta cuándo |

**Ejemplo de cómo funciona `reference_id`:**
- Si `role = 'client'` y `reference_id = 5` → Este usuario es el `client` con `id_client = 5`
- Si `role = 'seller'` y `reference_id = 3` → Este usuario es el `seller` con `id_seller = 3`

---

### 3. Tabla `auth.refresh_tokens`
**¿Qué es?** Almacena los refresh tokens activos de cada usuario.

**¿Por qué?** El profesor pide implementar **JWT con Access Token + Refresh Token**:
- **Access Token**: Corta duración (15 min), se usa en cada request
- **Refresh Token**: Larga duración (7 días), se usa para obtener nuevos access tokens

Guardamos los refresh tokens para poder:
1. **Revocarlos** cuando el usuario hace logout
2. **Saber en qué dispositivos** tiene sesión activa
3. **Cerrar todas las sesiones** si es necesario (cambio de contraseña, robo de cuenta)

| Columna | ¿Para qué sirve? |
|---------|------------------|
| `user_id` | A qué usuario pertenece este refresh token |
| `token_hash` | Hash del token (nunca guardamos el token real por seguridad) |
| `device_info` | "Chrome en Windows", "Safari en iPhone", etc. |
| `expires_at` | Cuándo expira (7 días después de crearse) |
| `is_revoked` | Si fue invalidado (logout, cambio password) |

---

### 4. Tabla `auth.revoked_tokens` (Blacklist)
**¿Qué es?** Lista negra de access tokens que fueron invalidados ANTES de expirar.

**¿Por qué?** Los JWT son **stateless** - una vez emitidos, son válidos hasta que expiran. Si un usuario hace logout, su access token sigue siendo válido por 15 minutos más. 

La blacklist guarda los `jti` (JWT ID) de tokens que deben rechazarse aunque no hayan expirado.

| Columna | ¿Para qué sirve? |
|---------|------------------|
| `token_jti` | El identificador único del JWT (claim `jti`) |
| `reason` | Por qué se revocó: 'logout', 'password_change', 'suspicious_activity' |
| `original_exp` | Cuándo expiraba el token (para limpiar la tabla después) |

**Flujo de validación:**
1. Usuario envía request con access token
2. Verificamos firma y expiración del JWT ✓
3. **Verificamos si el `jti` está en `revoked_tokens`** ← Por esto necesitamos esta tabla
4. Si está → 401 Unauthorized
5. Si no está → Request válido

---

## 📍 Acceso a Supabase

1. Ir a: https://supabase.com/dashboard
2. Iniciar sesión con las credenciales del proyecto
3. Seleccionar el proyecto: **MarketPlace Espigón Manta**
4. En el menú lateral, ir a: **SQL Editor**

---

## 🚀 SCRIPT SQL A EJECUTAR

### Paso 1: Abrir SQL Editor en Supabase
1. Clic en **SQL Editor** (menú izquierdo)
2. Clic en **+ New query**

### Paso 2: Copiar y Ejecutar este Script

```sql
-- ============================================
-- FASE 2: SETUP DE BASE DE DATOS PARA AUTH SERVICE
-- Proyecto: MarketPlace Espigón Manta
-- ============================================

-- =============================================
-- PASO 1:
-- =============================================
-- ¿Por qué? Centralizar credenciales de client, seller y admin en una sola tabla
CREATE TABLE IF NOT EXISTS auth.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(150) UNIQUE NOT NULL,       -- Email para login
    password_hash   VARCHAR(255) NOT NULL,              -- Contraseña hasheada con bcrypt
    role            VARCHAR(20) NOT NULL CHECK (role IN ('client', 'seller', 'admin')),
    reference_id    INTEGER NOT NULL,                   -- id_client, id_seller, o id_admin
    is_active       BOOLEAN DEFAULT true,
    email_verified  BOOLEAN DEFAULT false,
    last_login      TIMESTAMP WITH TIME ZONE,
    login_attempts  INTEGER DEFAULT 0,                  -- Para rate limiting
    locked_until    TIMESTAMP WITH TIME ZONE,           -- Bloqueo por intentos fallidos
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_auth_users_role_reference ON auth.users(role, reference_id);

-- =============================================
-- PASO 3: CREAR TABLA auth.refresh_tokens
-- =============================================
-- ¿Por qué? Almacenar refresh tokens para poder revocarlos y controlar sesiones
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,              -- Hash SHA256 del refresh token
    device_info     VARCHAR(255),                       -- Info del dispositivo
    ip_address      VARCHAR(45),                        -- IP del usuario
    user_agent      TEXT,                               -- Browser/App
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,  -- Cuándo expira (7 días)
    is_revoked      BOOLEAN DEFAULT false,              -- Si fue revocado (logout)
    revoked_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON auth.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON auth.refresh_tokens(token_hash);

-- =============================================
-- PASO 4: CREAR TABLA auth.revoked_tokens (BLACKLIST)
-- =============================================
-- ¿Por qué? Invalidar access tokens antes de que expiren (logout, seguridad)
CREATE TABLE IF NOT EXISTS auth.revoked_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_jti       VARCHAR(255) NOT NULL UNIQUE,       -- JWT ID del token revocado
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason          VARCHAR(50) CHECK (reason IN ('logout', 'password_change', 'admin_action', 'suspicious_activity', 'token_refresh')),
    original_exp    TIMESTAMP WITH TIME ZONE NOT NULL,  -- Cuándo expiraba el token
    revoked_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda rápida de tokens revocados
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_jti ON auth.revoked_tokens(token_jti);

-- =============================================
-- PASO 5: TRIGGER PARA updated_at AUTOMÁTICO
-- =============================================
-- ¿Por qué? Actualizar automáticamente la fecha de modificación
CREATE OR REPLACE FUNCTION auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON auth.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at_column();

-- =============================================
-- PASO 6: FUNCIÓN PARA LIMPIAR TOKENS EXPIRADOS
-- =============================================
-- ¿Por qué? Las tablas crecerían infinitamente sin limpieza
CREATE OR REPLACE FUNCTION auth.cleanup_expired_tokens()
RETURNS TABLE(deleted_refresh_tokens INTEGER, deleted_revoked_tokens INTEGER) AS $$
DECLARE
    refresh_count INTEGER;
    revoked_count INTEGER;
BEGIN
    DELETE FROM auth.refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS refresh_count = ROW_COUNT;
    
    DELETE FROM auth.revoked_tokens WHERE original_exp < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    RETURN QUERY SELECT refresh_count, revoked_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================
SELECT '✅ FASE 2 COMPLETADA' as status;
```

### Paso 3: Ejecutar
1. Clic en **Run** (o `Ctrl+Enter`)
2. Debería aparecer: `✅ FASE 2 COMPLETADA`

---

## ✅ Verificar que Todo se Creó

Ejecutar esta query para confirmar:

```sql
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns c 
        WHERE c.table_schema = 'auth' AND c.table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'auth'
ORDER BY table_name;
```

**Resultado esperado:**

| table_name | columnas |
|------------|----------|
| refresh_tokens | 9 |
| revoked_tokens | 6 |
| users | 12 |

---

## ⚠️ IMPORTANTE

1. **NO ejecutar migración de usuarios aún** - Eso se hace cuando los endpoints funcionen
2. **Las tablas están en schema `auth`**, no en `public`
3. **Los passwords se hashean en el código**, no en SQL

---

## 📋 Checklist

- [ ] Schema `auth` creado
- [ ] Tabla `auth.users` creada (12 columnas)
- [ ] Tabla `auth.refresh_tokens` creada (9 columnas)  
- [ ] Tabla `auth.revoked_tokens` creada (6 columnas)
- [ ] Sin errores en la ejecución
- [ ] Captura de pantalla tomada

---
