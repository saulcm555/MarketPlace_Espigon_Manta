# 🌱 Seeds - Administrador del Sistema

## ¿Qué es un Seed?

Un **seed** es un script que se ejecuta **UNA SOLA VEZ** para crear datos iniciales en la base de datos (como el primer administrador).


## Ejecutar el Seed

```bash
# 1. Detén el servidor si está corriendo (Ctrl+C)

# 2. Ejecuta el seed
npx ts-node src/infrastructure/database/seeds/create-admin.seed.ts
# 3. Inicia el servidor
npm run dev


## 📋 ¿Qué Hace el Seed?

El seed crea un administrador en la base de datos con los datos que pusiste en tu `.env`:

1. **Lee tus credenciales** del archivo `.env` (no están en el código)
2. **Verifica** si ya existe un admin con ese email
3. **Encripta** tu contraseña (guarda un hash, no texto plano)
4. **Crea** el administrador en la base de datos
5. **Te muestra** las credenciales para que hagas login en Swagger

---

## ✅ Protecciones Automáticas del Seed

### 1. Detecta Duplicados
Si ejecutas el seed dos veces, **NO crea dos admins**. Te avisa que ya existe y termina.

### 2. Encripta la Contraseña
Tu contraseña NO se guarda en texto plano. Se encripta con bcrypt:
- Tú pones: `MiContraseña123`
- Se guarda: `$2b$10$rXqE...` (imposible de descifrar)

### 3. Conexión Independiente
El seed abre su propia conexión temporal que se cierra automáticamente cuando termina. No interfiere con el servidor.


## 📝 Uso en Swagger

Después de ejecutar el seed:

1. Abre http://localhost:3000/api-docs
2. Busca `POST /api/auth/login/admin`
3. Haz clic en "Try it out"
4. Ingresa el email y password que pusiste en tu `.env`
5. Copia el token de la respuesta
6. Haz clic en el botón "Authorize" 🔓
7. Pega el token y haz clic en "Authorize"
8. ¡Listo! Ahora puedes usar todos los endpoints protegidos
