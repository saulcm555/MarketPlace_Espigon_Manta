# ⚙️ Carpeta `src/config/`

## ¿Qué va aquí?

Esta carpeta contiene **archivos de configuración centralizada** del frontend: URLs de servicios, constantes, variables de entorno, y configuraciones que se usan en múltiples lugares de la aplicación.

## ¿Por qué es necesaria?

Sin esta carpeta, tendrías:
- **URLs hardcodeadas** en 50 archivos diferentes
- **Imposible cambiar** entre entornos (desarrollo, staging, producción)
- **Valores mágicos** repetidos por todo el código
- **Difícil mantenimiento** cuando cambien puertos o dominios
- **Configuraciones inconsistentes** entre diferentes partes de la app

## ¿Qué archivos debería tener?

### 1. **`api.ts`** - Configuración de APIs y servicios backend

Este archivo centraliza todas las URLs de tus servicios backend:

**Contenido:**
- **API_CONFIG**: Objeto con las URLs de tus 3 servicios
  - `REST_API_URL`: URL del servicio REST (Node.js, puerto 8080)
  - `WS_URL`: URL del servicio WebSocket (Go, puerto 8081)
  - `REPORTS_URL`: URL del servicio de reportes (Python, FastAPI)
  
- **Funciones auxiliares**:
  - `getAuthHeaders()`: Retorna headers con el token JWT
  - `getApiUrl()`: Retorna la URL completa de un endpoint
  - `isProduction()`: Verifica si estás en producción o desarrollo

**Por qué es importante:**
- Tu proyecto tiene **3 servicios backend diferentes**
- Cada servicio corre en un puerto diferente
- En producción, las URLs cambiarán a dominios reales
- Necesitas agregar el token JWT a cada petición
- Un solo lugar para cambiar todas las URLs

### 2. **`constants.ts`** - Constantes de la aplicación

Este archivo contiene valores que se usan en múltiples lugares y que NO deben cambiar:

**Contenido:**
- **Estados de órdenes**: Array con todos los estados posibles
  - ['pendiente', 'procesando', 'en_camino', 'completado', 'cancelado']
  
- **Estados de entregas**: Estados del proceso de entrega
  - ['pendiente', 'asignado', 'en_camino', 'entregado', 'fallido']
  
- **Tipos de notificaciones**: Categorías de notificaciones
  - ['order_created', 'order_updated', 'delivery_status', 'low_stock', 'new_message']
  
- **Roles de usuario**: Tipos de usuarios en el sistema
  - ['client', 'seller', 'admin', 'delivery_person']
  
- **Métodos de pago**: Formas de pago aceptadas
  - ['efectivo', 'tarjeta_credito', 'tarjeta_debito', 'transferencia']
  
- **Límites de paginación**: Cantidad de items por página
  - DEFAULT_PAGE_SIZE = 20
  - MAX_PAGE_SIZE = 100
  
- **Validaciones**: Reglas de negocio
  - MIN_PRODUCT_PRICE = 0.01
  - MAX_PRODUCT_NAME_LENGTH = 100
  - MIN_PASSWORD_LENGTH = 8
  - MAX_CART_ITEMS = 50
  
- **Tiempos**: Configuraciones de tiempo
  - TOKEN_EXPIRATION_TIME = 24 * 60 * 60 * 1000 (24 horas en ms)
  - NOTIFICATION_DURATION = 5000 (5 segundos)
  - WEBSOCKET_RECONNECT_DELAY = 3000 (3 segundos)

**Por qué es importante:**
- Evita "valores mágicos" como `if (status === 'pendiente')`
- Un solo lugar para cambiar reglas de negocio
- Fácil de testear y validar
- Autocomplete al usar las constantes

### 3. **`routes.ts`** - Rutas de la aplicación

Este archivo define todas las rutas (paths) de tu aplicación como constantes:

**Contenido:**
- **ROUTES**: Objeto con todas las rutas
  - HOME: '/'
  - LOGIN: '/login'
  - REGISTER: '/register'
  - PRODUCTS: '/products'
  - PRODUCT_DETAIL: '/products/:id'
  - CART: '/cart'
  - CHECKOUT: '/checkout'
  - ORDERS: '/orders'
  - ORDER_DETAIL: '/orders/:id'
  - PROFILE: '/profile'
  - DASHBOARD_SELLER: '/seller/dashboard'
  - DASHBOARD_ADMIN: '/admin/dashboard'

**Funciones auxiliares**:
- `getProductDetailRoute(productId)`: Genera '/products/123'
- `getOrderDetailRoute(orderId)`: Genera '/orders/456'
- `getCategoryRoute(categoryId)`: Genera '/category/789'

**Por qué es importante:**
- Evita escribir '/products/detail' en un lugar y '/products/:id' en otro
- Un solo lugar para cambiar todas las rutas
- Genera rutas dinámicas fácilmente
- Previene errores de tipeo en las rutas

### 4. **`env.ts`** - Variables de entorno

Este archivo lee y valida las variables de entorno:

**Contenido:**
- Lee las variables de `.env` usando `import.meta.env.VITE_*`
- Valida que existan las variables críticas
- Proporciona valores por defecto para desarrollo
- Exporta un objeto tipado con todas las variables

**Variables que debe leer**:
- `VITE_API_URL`: URL del backend REST
- `VITE_WS_URL`: URL del WebSocket
- `VITE_REPORTS_URL`: URL del servicio de reportes
- `VITE_APP_NAME`: Nombre de la aplicación
- `VITE_ENVIRONMENT`: 'development' | 'staging' | 'production'
- `VITE_ENABLE_ANALYTICS`: boolean
- `VITE_ENABLE_SENTRY`: boolean (para logging de errores)

**Por qué es importante:**
- Variables sensibles (API keys) no van en el código
- Fácil cambiar configuración sin tocar código
- Diferentes configuraciones por entorno
- Validación temprana de configuración requerida

### 5. **`theme.ts`** - Configuración de tema (opcional)

Si usas temas personalizados más allá de Tailwind:

**Contenido:**
- Colores personalizados del marketplace
- Configuración de breakpoints
- Espaciados personalizados
- Configuración de animaciones

**Por qué podría ser útil:**
- Centralizar colores de la marca
- Configuración compartida entre componentes
- Fácil cambiar tema oscuro/claro

### 6. **`features.ts`** - Feature flags (opcional)

Para activar/desactivar funcionalidades:

**Contenido:**
- `ENABLE_CHAT`: boolean - Habilitar chat en tiempo real
- `ENABLE_REVIEWS`: boolean - Habilitar reviews de productos
- `ENABLE_WISHLIST`: boolean - Habilitar lista de deseos
- `ENABLE_NOTIFICATIONS`: boolean - Habilitar notificaciones push

**Por qué podría ser útil:**
- Activar features gradualmente
- Desactivar features rotas sin borrar código
- A/B testing de funcionalidades

## Ejemplo de uso en otros archivos

### Desde `src/api/client.ts`:
```
import { API_CONFIG } from '@/config/api';

axios.create({
  baseURL: API_CONFIG.REST_API_URL
})
```

### Desde un componente:
```
import { ROUTES } from '@/config/routes';
import { ORDER_STATES } from '@/config/constants';

<Link to={ROUTES.CART}>Ir al carrito</Link>

{ORDER_STATES.map(state => ...)}
```

### Desde `src/lib/websocket.ts`:
```
import { API_CONFIG } from '@/config/api';

new WebSocket(API_CONFIG.WS_URL)
```

## Beneficios de tener esta carpeta

✅ **Centralización**: Una sola fuente de verdad para configuración  
✅ **Mantenibilidad**: Cambiar URLs/constantes en un solo lugar  
✅ **Entornos**: Fácil cambiar entre dev/staging/production  
✅ **Tipado**: TypeScript valida las configuraciones  
✅ **DRY**: No repetir valores en múltiples archivos  
✅ **Seguridad**: Variables sensibles en .env, no en el código  

## Relación con otras carpetas

- **Usada por**: `src/api/` (URLs de backend)
- **Usada por**: `src/lib/` (configuración de WebSocket)
- **Usada por**: `src/components/` (rutas, constantes)
- **Usada por**: `src/routes/` (definición de rutas)
- **Lee de**: `.env` (variables de entorno)

## Archivos relacionados en la raíz del proyecto

Necesitarás crear también:

**`.env.development`** (desarrollo local):
```
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8081/ws
VITE_REPORTS_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

**`.env.production`** (producción):
```
VITE_API_URL=https://api.tumarketplace.com/api
VITE_WS_URL=wss://ws.tumarketplace.com/ws
VITE_REPORTS_URL=https://reports.tumarketplace.com
VITE_ENVIRONMENT=production
```

**`.env.example`** (template para otros desarrolladores):
```
VITE_API_URL=
VITE_WS_URL=
VITE_REPORTS_URL=
VITE_ENVIRONMENT=development
```

## Notas importantes

- **NUNCA** commitear `.env` con credenciales reales (agregar a `.gitignore`)
- Usar prefijo `VITE_` para que Vite exponga las variables al frontend
- Validar variables requeridas al inicio de la app
- Documentar cada variable en `.env.example`
- Mantener sincronizadas las URLs con el backend real
