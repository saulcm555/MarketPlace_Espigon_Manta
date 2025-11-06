# 🔄 Carpeta `src/context/`

## ¿Qué va aquí?

Esta carpeta contiene **Contexts de React** que permiten compartir estado global entre componentes sin pasar props nivel por nivel (prop drilling).

## ¿Por qué es necesaria?

Sin esta carpeta:
- **Prop drilling**: Pasar datos del carrito de App → Navbar, App → ProductList → ProductCard, App → Cart
- **Estado duplicado**: Carrito guardado en múltiples lugares = inconsistencias
- **Difícil sincronización**: Actualizar carrito en un lugar no actualiza en otro
- **Código complejo**: Callbacks pasados por 5 niveles de componentes
- **No reactivo**: Cambios en un componente no reflejan en otros

## ¿Qué archivos debería tener?

### 1. **`AuthContext.tsx`** - Gestión de autenticación y usuario

Este es el Context MÁS IMPORTANTE para tu marketplace.

**Qué maneja:**
- **Estado del usuario autenticado**: Datos del usuario (Client, Seller o Admin)
- **Token JWT**: Token de autenticación para peticiones al backend
- **Estado de autenticación**: Si el usuario está logueado o no
- **Rol del usuario**: Tipo de usuario (client, seller, admin)

**Funcionalidades que provee:**
- `login(email, password)` - Iniciar sesión
  - Llama a la API de login
  - Guarda token en localStorage
  - Guarda datos del usuario en estado
  - Conecta el WebSocket
  
- `logout()` - Cerrar sesión
  - Limpia token del localStorage
  - Limpia estado del usuario
  - Desconecta el WebSocket
  - Redirige al login
  
- `register(data, type)` - Registrar nuevo usuario
  - Registra cliente o vendedor
  - Automáticamente hace login después del registro
  
- `updateProfile(data)` - Actualizar perfil
  - Actualiza datos en el backend
  - Actualiza estado local
  
- `isAuthenticated` - Booleano que indica si hay sesión activa
- `user` - Objeto con los datos del usuario
- `token` - Token JWT actual
- `userRole` - Rol del usuario ('client', 'seller', 'admin')

**Por qué es crítico:**
- **Todas las rutas privadas** necesitan verificar autenticación
- **Todas las peticiones API** necesitan el token
- **Navbar** muestra información del usuario
- **WebSocket** requiere autenticación
- **Permisos** se basan en el rol del usuario

**Dónde se usa:**
- `PrivateRoute.tsx` - Verifica si hay sesión
- `RoleRoute.tsx` - Verifica el rol
- `Navbar.tsx` - Muestra nombre del usuario, botón logout
- `api/client.ts` - Obtiene el token para headers
- Cualquier componente que necesite saber quién está logueado

### 2. **`CartContext.tsx`** - Gestión del carrito de compras

Este Context maneja todo lo relacionado con el carrito.

**Qué maneja:**
- **Items del carrito**: Array de productos con cantidades
- **Total del carrito**: Suma de todos los subtotales
- **Cantidad de items**: Total de productos en el carrito

**Funcionalidades que provee:**
- `addItem(product, quantity)` - Agregar producto al carrito
  - Si ya existe, incrementa cantidad
  - Si no existe, lo agrega nuevo
  - Actualiza localStorage para persistencia
  
- `removeItem(productId)` - Eliminar producto del carrito
  - Quita el producto completamente
  - Actualiza localStorage
  
- `updateQuantity(productId, newQuantity)` - Cambiar cantidad
  - Actualiza cantidad de un producto específico
  - Recalcula subtotal y total
  - Valida que no exceda el stock disponible
  
- `clearCart()` - Vaciar carrito completo
  - Útil después de completar una compra
  - Limpia localStorage
  
- `getItemQuantity(productId)` - Obtener cantidad de un producto
  - Útil para mostrar cantidad en ProductCard
  
- `isInCart(productId)` - Verificar si producto está en carrito
  - Útil para cambiar botón "Agregar" por "En carrito"

**Estado que expone:**
- `items` - Array de CartItem
- `total` - Total a pagar
- `itemCount` - Cantidad total de productos

**Por qué es importante:**
- El carrito se usa en **múltiples lugares**:
  - Navbar (contador de items)
  - ProductCard (botón agregar)
  - ProductDetail (botón agregar)
  - CartPage (lista completa)
  - Checkout (resumen de compra)
- **Debe sincronizarse** entre todos estos lugares
- **Debe persistir** si el usuario cierra la pestaña
- **Debe limpiar** después de una compra exitosa

### 3. **`NotificationContext.tsx`** - Gestión de notificaciones

Este Context maneja las notificaciones en tiempo real del WebSocket.

**Qué maneja:**
- **Notificaciones no leídas**: Array de notificaciones recibidas
- **Conexión WebSocket**: Estado de la conexión en tiempo real
- **Contador de no leídas**: Cantidad de notificaciones sin leer

**Funcionalidades que provee:**
- `connectWebSocket()` - Conectar al servicio de notificaciones
  - Se llama automáticamente al hacer login
  - Usa el token del AuthContext
  
- `disconnectWebSocket()` - Desconectar
  - Se llama al hacer logout
  
- `markAsRead(notificationId)` - Marcar como leída
  - Actualiza en el backend
  - Actualiza estado local
  
- `deleteNotification(notificationId)` - Eliminar notificación
  
- `getUnreadCount()` - Obtener cantidad de no leídas
  - Para mostrar badge en el ícono de notificaciones

**Estado que expone:**
- `notifications` - Array de notificaciones
- `unreadCount` - Cantidad de no leídas
- `isConnected` - Estado de conexión del WebSocket

**Por qué es importante:**
- Tu `realtime_service` en Go envía notificaciones en tiempo real
- Notificaciones de:
  - Nuevas órdenes (para vendedores)
  - Estado de orden actualizado (para clientes)
  - Estado de entrega (para clientes)
  - Stock bajo (para vendedores)
  - Nuevos mensajes (chat)
- Deben mostrarse en **tiempo real** sin recargar la página
- Badge en Navbar debe actualizarse automáticamente

### 4. **`ThemeContext.tsx`** - Tema claro/oscuro (opcional)

Si quieres implementar modo oscuro:

**Qué maneja:**
- Estado del tema actual (light/dark)
- Persistencia en localStorage
- Aplicación de clases CSS

**Funcionalidades:**
- `toggleTheme()` - Cambiar entre claro y oscuro
- `setTheme(theme)` - Establecer tema específico
- `theme` - Tema actual

**Por qué podría ser útil:**
- Experiencia de usuario personalizable
- Reducir cansancio visual en la noche
- Tendencia moderna en aplicaciones

### 5. **`SearchContext.tsx`** - Estado de búsqueda (opcional)

Si quieres mantener filtros y búsquedas entre navegaciones:

**Qué maneja:**
- Término de búsqueda actual
- Filtros aplicados (categoría, precio, etc.)
- Historial de búsquedas

**Funcionalidades:**
- `setSearchQuery(query)` - Guardar búsqueda
- `applyFilters(filters)` - Aplicar filtros
- `clearFilters()` - Limpiar filtros

**Por qué podría ser útil:**
- Mantener filtros al navegar entre páginas
- Historial de búsquedas del usuario
- Búsquedas sugeridas

## Estructura típica de un Context

Cada Context sigue este patrón:

**1. Definir el tipo del Context (TypeScript)**
- Interface con el estado y funciones que proveerá

**2. Crear el Context**
- `createContext<TipoContext>()`

**3. Crear el Provider**
- Componente que envuelve a la app
- Mantiene el estado
- Provee funciones para modificar el estado
- Maneja efectos secundarios (localStorage, API)

**4. Crear hook personalizado**
- `useAuth()`, `useCart()`, `useNotifications()`
- Simplifica el uso del Context
- Valida que se use dentro del Provider

## Cómo se conectan entre sí

Los Contexts pueden depender unos de otros:

```
AuthContext (padre)
    ↓
NotificationContext (necesita token de Auth)
    ↓
CartContext (necesita saber si user está autenticado)
```

**Orden de Providers en `main.tsx`:**
```
<AuthProvider>          ← Más externo (padre)
  <NotificationProvider> ← Hijo de Auth
    <CartProvider>       ← Hijo de Notification
      <App />
    </CartProvider>
  </NotificationProvider>
</AuthProvider>
```

## Beneficios de usar Context

✅ **No prop drilling**: Acceso directo desde cualquier componente  
✅ **Sincronización**: Un solo estado compartido  
✅ **Reactivo**: Cambios se reflejan automáticamente  
✅ **Organizado**: Lógica centralizada  
✅ **Testeable**: Fácil mockear Contexts en tests  
✅ **Persistencia**: Fácil guardar en localStorage  
✅ **Reutilizable**: Múltiples componentes usan la misma lógica  

## Cómo se usará desde componentes

**En lugar de esto (sin Context):**
```
<App cart={cart} user={user} notifications={notif}>
  <Navbar cart={cart} user={user} notifications={notif}>
    <NotificationBell notifications={notif} />
  </Navbar>
  <ProductList cart={cart}>
    <ProductCard cart={cart} addToCart={addToCart} />
  </ProductList>
</App>
```

**Con Context:**
```
// En Navbar.tsx
const { user, logout } = useAuth();
const { itemCount } = useCart();
const { unreadCount } = useNotifications();

// En ProductCard.tsx
const { addItem } = useCart();
const { isAuthenticated } = useAuth();

// En CartPage.tsx
const { items, total, removeItem, clearCart } = useCart();
```

## Relación con otras carpetas

- **Usa**: `src/types/` (tipar el estado y funciones)
- **Usa**: `src/api/` (llamadas al backend)
- **Usa**: `src/lib/websocket.ts` (NotificationContext)
- **Usa**: `src/lib/localStorage.ts` (persistencia)
- **Usada por**: `src/components/` (todos los componentes)
- **Usada por**: `src/pages/` (todas las páginas)
- **Usada por**: `src/routes/` (PrivateRoute, RoleRoute)

## Context vs Store (Zustand/Redux)

**Cuándo usar Context:**
- ✅ Proyecto pequeño/mediano
- ✅ Pocos estados globales (auth, cart, notifications)
- ✅ No necesitas DevTools complejas
- ✅ Quieres menos dependencias

**Cuándo usar Store (Zustand/Redux):**
- Para proyectos muy grandes
- Necesitas middleware complejo
- Quieres time-travel debugging
- Estado muy complejo con muchas dependencias

**Para tu marketplace, Context es suficiente.**

## Notas importantes

- **Solo crear Context** para estado que se comparte entre MUCHOS componentes
- **No abusar**: No crear Context para todo, solo lo necesario
- **Validar en hooks**: `useAuth()` debe verificar que esté dentro de `<AuthProvider>`
- **Persistir lo necesario**: Carrito y token en localStorage, notificaciones no
- **Limpiar efectos**: Desconectar WebSocket, limpiar timers
- **Optimizar renders**: Usar `useMemo` para valores calculados
- **Separar responsabilidades**: Un Context = Una responsabilidad
- **Typear correctamente**: Usar TypeScript para todo el estado y funciones

## Contextos esenciales para tu marketplace

| Context | Prioridad | Razón |
|---------|-----------|-------|
| **AuthContext** | 🔴 CRÍTICA | Login, token, permisos - TODO depende de esto |
| **CartContext** | 🔴 CRÍTICA | Core del marketplace - compras |
| **NotificationContext** | 🟡 ALTA | Tienes realtime_service - notificaciones en vivo |
| ThemeContext | 🟢 BAJA | Opcional - mejora UX pero no esencial |
| SearchContext | 🟢 BAJA | Opcional - puede hacerse sin Context |
