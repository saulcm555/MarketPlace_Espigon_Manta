# 🛠️ Carpeta `src/lib/`

## ¿Qué va aquí?

Esta carpeta contiene **utilidades y librerías personalizadas** que no son componentes ni llamadas directas a la API. Son funciones y clases reutilizables que resuelven problemas específicos de la aplicación.

## ¿Por qué es necesaria?

Sin esta carpeta:
- **Lógica compleja** mezclada dentro de componentes
- **Código duplicado** para manejar WebSockets, validaciones, formatos, etc.
- **Difícil testear** funciones que están dentro de componentes
- **No reutilizable** entre diferentes partes de la app
- **Componentes gordos** con responsabilidades que no les corresponden

## ¿Qué archivos debería tener?

### 1. **`websocket.ts`** - Cliente WebSocket para notificaciones en tiempo real

Este es el archivo MÁS IMPORTANTE de esta carpeta para tu proyecto.

**Por qué:**
- Tienes un servicio `realtime_service` en Go (puerto 8081)
- Necesitas notificaciones en tiempo real (nuevas órdenes, mensajes, actualizaciones)
- WebSocket requiere lógica compleja: conexión, reconexión, autenticación, manejo de eventos

**Qué debe hacer:**
- **Conectar** al servidor WebSocket usando el token JWT
- **Reconectar automáticamente** si se pierde la conexión
- **Autenticar** la conexión con el token del usuario
- **Recibir mensajes** del servidor y distribuirlos a los componentes
- **Enviar mensajes** al servidor cuando sea necesario
- **Manejar diferentes tipos de mensajes**: notificaciones, chat, actualizaciones de estado
- **Mantener el estado** de conexión (conectado, desconectado, reconectando)
- **Limpiar recursos** al desconectar

**Cómo se usará:**
- Al hacer login, se conecta el WebSocket
- Los componentes se suscriben a eventos específicos
- Cuando llega una notificación, se actualiza la UI automáticamente
- Al hacer logout, se desconecta el WebSocket

**Eventos que debe manejar (según tu backend):**
- `notification` - Nueva notificación para el usuario
- `order_update` - Actualización en una orden
- `message` - Nuevo mensaje de chat
- `delivery_update` - Actualización en el estado de entrega
- `inventory_alert` - Alerta de stock bajo (para vendedores)
- `ping/pong` - Keep-alive para mantener la conexión

### 2. **`validations.ts`** - Funciones de validación de formularios

**Qué contiene:**
- **Validación de email**: Verifica formato correcto
- **Validación de password**: Mínimo 8 caracteres, mayúsculas, números, símbolos
- **Validación de teléfono**: Formato ecuatoriano
- **Validación de RUC**: Verifica RUC válido (para vendedores)
- **Validación de precio**: Mayor a 0, máximo 2 decimales
- **Validación de stock**: Número entero positivo
- **Validación de cantidad**: Entre 1 y stock disponible
- **Sanitización de inputs**: Limpiar caracteres peligrosos

**Por qué es importante:**
- Validación consistente en todos los formularios
- Prevenir envío de datos inválidos al backend
- Mensajes de error estandarizados
- Reutilizable en cualquier formulario

### 3. **`formatters.ts`** - Funciones de formateo de datos

**Qué contiene:**
- **formatCurrency(amount)**: Formatea números como moneda ($12.50)
- **formatDate(date)**: Formatea fechas legibles (15 de Nov, 2025)
- **formatDateTime(date)**: Fecha y hora (15/11/2025 14:30)
- **formatPhoneNumber(phone)**: Formatea teléfonos (09XX-XXX-XXX)
- **formatRUC(ruc)**: Formatea RUC con guiones
- **truncateText(text, maxLength)**: Corta texto largo y agrega "..."
- **capitalize(text)**: Primera letra mayúscula
- **formatOrderNumber(id)**: Convierte ID a formato orden (#0001234)

**Por qué es importante:**
- Presentación consistente de datos en toda la app
- Fechas y monedas en formato local
- Legibilidad mejorada para el usuario
- Un solo lugar para cambiar formatos

### 4. **`localStorage.ts`** - Manejo seguro de localStorage

**Qué contiene:**
- **saveToken(token)**: Guarda token JWT de forma segura
- **getToken()**: Recupera token y valida que no haya expirado
- **removeToken()**: Limpia token al hacer logout
- **saveUser(user)**: Guarda datos del usuario
- **getUser()**: Recupera datos del usuario
- **clearAll()**: Limpia todo el localStorage
- **isTokenExpired()**: Verifica si el token expiró

**Por qué es importante:**
- Centraliza el acceso al localStorage
- Manejo de errores (localStorage puede fallar)
- Validación de tokens expirados
- Serialización/deserialización segura de objetos
- Facilita el testing (puedes mockear fácilmente)

### 5. **`http.ts`** - Utilidades HTTP (complemento a axios)

**Qué contiene:**
- **handleApiError(error)**: Maneja errores de la API de forma consistente
- **buildQueryParams(params)**: Convierte objeto a query string (?page=1&limit=20)
- **uploadFile(file)**: Maneja subida de archivos con FormData
- **downloadFile(url, filename)**: Descarga archivos (reportes PDF/Excel)
- **retryRequest(fn, maxRetries)**: Reintenta peticiones fallidas
- **cancelableRequest()**: Crea peticiones cancelables (para búsquedas)

**Por qué es importante:**
- Lógica HTTP compleja centralizada
- Manejo de errores consistente
- Funcionalidades avanzadas sin ensuciar componentes
- Soporte para casos especiales (uploads, downloads)

### 6. **`permissions.ts`** - Control de permisos y autorización

**Qué contiene:**
- **can(user, action)**: Verifica si un usuario puede realizar una acción
- **isClient(user)**: Verifica si es un cliente
- **isSeller(user)**: Verifica si es un vendedor
- **isAdmin(user)**: Verifica si es un administrador
- **canEditProduct(user, product)**: Verifica si puede editar un producto
- **canCancelOrder(user, order)**: Verifica si puede cancelar una orden
- **canViewReport(user)**: Verifica si puede ver reportes

**Por qué es importante:**
- Control de acceso centralizado
- Evitar duplicar lógica de permisos
- Fácil cambiar reglas de negocio
- Mostrar/ocultar elementos según permisos

### 7. **`cart.ts`** - Lógica del carrito (si no usas Context/Store)

**Qué contiene:**
- **addToCart(product, quantity)**: Agregar producto al carrito
- **removeFromCart(productId)**: Eliminar producto
- **updateQuantity(productId, quantity)**: Actualizar cantidad
- **getCartTotal()**: Calcular total del carrito
- **getCartItemCount()**: Contar items en el carrito
- **clearCart()**: Vaciar carrito
- **isInCart(productId)**: Verificar si un producto está en el carrito

**Por qué podría ser útil:**
- Si decides NO usar Context para el carrito
- Lógica de carrito reutilizable
- Persistencia en localStorage

### 8. **`notifications.ts`** - Manejo de notificaciones toast/snackbar

**Qué contiene:**
- **showSuccess(message)**: Mostrar notificación de éxito
- **showError(message)**: Mostrar notificación de error
- **showWarning(message)**: Mostrar notificación de advertencia
- **showInfo(message)**: Mostrar notificación informativa
- **showNotification(type, message, duration)**: Función genérica

**Por qué es importante:**
- Feedback visual consistente al usuario
- Centraliza el uso de la librería de toasts (sonner, react-toastify, etc.)
- Fácil cambiar librería de notificaciones sin tocar componentes

### 9. **`debounce.ts`** - Utilidades de performance

**Qué contiene:**
- **debounce(fn, delay)**: Retrasa ejecución de función (para búsquedas)
- **throttle(fn, limit)**: Limita frecuencia de ejecución
- **memoize(fn)**: Cachea resultados de funciones puras

**Por qué es importante:**
- Optimizar búsquedas en tiempo real
- Evitar múltiples llamadas innecesarias a la API
- Mejorar performance de la app

### 10. **`analytics.ts`** - Tracking de eventos (opcional)

**Qué contiene:**
- **trackPageView(page)**: Registrar vista de página
- **trackEvent(category, action)**: Registrar evento
- **trackPurchase(order)**: Registrar compra
- **trackSearch(query)**: Registrar búsqueda

**Por qué podría ser útil:**
- Análisis de comportamiento de usuarios
- Métricas de negocio
- Integración con Google Analytics, Mixpanel, etc.

## Diferencia entre `lib/` y `utils/`

Muchos proyectos tienen ambas carpetas:

- **`lib/`**: Código más complejo, clases, servicios, lógica de negocio
  - Ejemplo: Cliente WebSocket, manejador de localStorage complejo
  
- **`utils/`**: Funciones simples, helpers, utilidades puras
  - Ejemplo: formatear fecha, validar email, capitalizar texto

En tu caso, como ya tienes `lib/utils.ts` (de shadcn/ui), puedes:
- Mantener `lib/utils.ts` para utilidades de UI (cn, classNames, etc.)
- Agregar archivos específicos en `lib/` para lógica de negocio

## Beneficios de tener esta carpeta

✅ **Separación de responsabilidades**: Lógica fuera de componentes  
✅ **Reutilización**: Funciones usables en múltiples lugares  
✅ **Testeable**: Fácil escribir tests unitarios  
✅ **Mantenibilidad**: Un solo lugar para cada tipo de lógica  
✅ **Performance**: Optimizaciones centralizadas  
✅ **Escalabilidad**: Agregar nueva lógica sin ensuciar componentes  

## Cómo se usará desde componentes

```
Componente → Importa función/clase → lib/websocket.ts → WebSocket Server
Componente → Importa función → lib/formatters.ts → Retorna texto formateado
Componente → Importa función → lib/validations.ts → Valida input
```

## Relación con otras carpetas

- **Usa**: `src/types/` (tipar parámetros y retornos)
- **Usa**: `src/config/` (URLs, constantes)
- **Usada por**: `src/components/` (toda la lógica reutilizable)
- **Usada por**: `src/pages/` (lógica de negocio)
- **Usada por**: `src/api/` (utilidades HTTP)

## Notas importantes

- Funciones en `lib/` deben ser **puras cuando sea posible** (mismo input = mismo output)
- **No importar componentes** en lib (solo tipos, configuración)
- Cada archivo debe tener **una responsabilidad clara**
- Documentar funciones complejas con JSDoc
- Escribir **tests unitarios** para la lógica crítica
- El archivo **`websocket.ts` es CRÍTICO** para tu realtime_service
