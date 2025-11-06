# 🏗️ Carpeta `src/types/`

## ¿Qué va aquí?

Esta carpeta contiene **todas las interfaces y tipos TypeScript** que definen la estructura de los datos que fluyen entre el frontend y el backend.

## ¿Por qué es necesaria?

Sin esta carpeta, estarías usando `any` en todas partes, lo que significa:
- **Pérdida de autocomplete** en el editor (no sabrás qué propiedades tiene un objeto)
- **Errores en runtime** que TypeScript podría detectar en tiempo de desarrollo
- **Código frágil** que se rompe cuando el backend cambia
- **Dificulta la colaboración** porque nadie sabe qué estructura tienen los datos
- **Bugs silenciosos** por acceder a propiedades que no existen

## ¿Qué archivos debería tener?

### 1. **`product.ts`** - Tipos relacionados con productos
Debe reflejar exactamente la estructura de `backend/rest_service/src/models/productModel.ts` o `backend/realtime_service/internal/models/product.go`:

- **Interface `Product`**: Estructura completa de un producto tal como viene del backend
  - Propiedades: id, name, description, price, stock, category_id, subcategory_id, seller_id, image_url, created_at, updated_at
  
- **Interface `CreateProductDTO`**: Datos necesarios para crear un producto nuevo
  - Solo las propiedades que el usuario debe enviar (sin id, sin timestamps)
  
- **Interface `UpdateProductDTO`**: Datos permitidos para actualizar un producto
  - Similar a CreateProductDTO pero con propiedades opcionales
  
- **Type `ProductStatus`**: Estados posibles de un producto
  - Ejemplo: 'active' | 'inactive' | 'out_of_stock'

### 2. **`user.ts`** - Tipos de usuarios
Debe coincidir con tus modelos de backend (Client, Seller, Admin):

- **Interface `Client`**: Estructura de un cliente/comprador
  - Propiedades: id, name, email, phone, address, created_at
  
- **Interface `Seller`**: Estructura de un vendedor
  - Propiedades: id, name, email, business_name, ruc, phone, address, created_at
  
- **Interface `Admin`**: Estructura de un administrador
  - Propiedades: id, name, email, role, permissions, created_at
  
- **Interface `RegisterClientDTO`**: Datos para registrar un cliente
  
- **Interface `RegisterSellerDTO`**: Datos para registrar un vendedor
  
- **Interface `LoginDTO`**: Datos para login (email, password)
  
- **Interface `AuthResponse`**: Respuesta del backend al hacer login
  - Propiedades: token, user (Client | Seller | Admin), expiresIn

### 3. **`order.ts`** - Tipos de órdenes
Debe reflejar tu modelo de Order y OrderItem:

- **Interface `Order`**: Estructura completa de una orden
  - Propiedades: id, client_id, total, state, payment_method_id, created_at, updated_at
  - Puede incluir relaciones: items, client, payment_method
  
- **Interface `OrderItem`**: Ítems dentro de una orden
  - Propiedades: id, order_id, product_id, quantity, unit_price, subtotal
  - Puede incluir: product (objeto Product completo)
  
- **Interface `CreateOrderDTO`**: Datos para crear una orden
  - items: array de { product_id, quantity }
  - payment_method_id
  - delivery_address
  
- **Type `OrderState`**: Estados posibles de una orden
  - 'pendiente' | 'procesando' | 'completado' | 'cancelado' | 'en_camino'

### 4. **`category.ts`** - Tipos de categorías
- **Interface `Category`**: Estructura de una categoría
  - Propiedades: id, name, description, image_url, created_at
  
- **Interface `Subcategory`**: Estructura de una subcategoría
  - Propiedades: id, category_id, name, description, created_at
  
- **Interface `CreateCategoryDTO`**: Datos para crear categoría
- **Interface `CreateSubcategoryDTO`**: Datos para crear subcategoría

### 5. **`cart.ts`** - Tipos del carrito de compras
- **Interface `CartItem`**: Ítem en el carrito (solo frontend)
  - Propiedades: product (objeto Product), quantity, subtotal
  
- **Interface `Cart`**: Carrito completo (si se guarda en backend)
  - Propiedades: id, client_id, items, total, created_at, updated_at

### 6. **`inventory.ts`** - Tipos de inventario
- **Interface `Inventory`**: Registro de inventario
  - Propiedades: id, product_id, stock, min_stock, max_stock, last_updated
  
- **Interface `InventoryMovement`**: Movimiento de inventario
  - Propiedades: id, product_id, type ('entrada' | 'salida'), quantity, reason, created_at

### 7. **`delivery.ts`** - Tipos de entregas
- **Interface `Delivery`**: Estructura de una entrega
  - Propiedades: id, order_id, state, address, estimated_date, delivered_date, created_at
  
- **Type `DeliveryState`**: Estados de entrega
  - 'pendiente' | 'asignado' | 'en_camino' | 'entregado' | 'fallido'

### 8. **`payment.ts`** - Tipos de métodos de pago
- **Interface `PaymentMethod`**: Método de pago
  - Propiedades: id, name, type ('efectivo' | 'tarjeta' | 'transferencia'), is_active
  
- **Interface `Payment`**: Registro de pago
  - Propiedades: id, order_id, payment_method_id, amount, status, transaction_id, created_at

### 9. **`notification.ts`** - Tipos de notificaciones
- **Interface `Notification`**: Estructura de notificación
  - Propiedades: id, user_id, type, title, message, is_read, created_at
  
- **Type `NotificationType`**: Tipos de notificación
  - 'order_created' | 'order_updated' | 'delivery_status' | 'low_stock' | 'new_message'

### 10. **`message.ts`** - Tipos de mensajes (chat/WebSocket)
- **Interface `Message`**: Mensaje de chat
  - Propiedades: id, sender_id, receiver_id, content, type, is_read, created_at
  
- **Interface `WebSocketMessage`**: Mensaje del WebSocket
  - Propiedades: type, payload, timestamp

### 11. **`api.ts`** - Tipos genéricos de API
- **Interface `ApiResponse<T>`**: Respuesta estándar de la API
  - Propiedades: success, data (tipo genérico T), message, errors
  
- **Interface `PaginatedResponse<T>`**: Respuesta paginada
  - Propiedades: data (array de T), total, page, limit, hasMore
  
- **Interface `ApiError`**: Estructura de error de la API
  - Propiedades: code, message, field (para errores de validación)

### 12. **`index.ts`** - Exportar todo
Este archivo re-exporta todos los tipos para facilitar las importaciones:
- En lugar de importar de 10 archivos diferentes
- Solo importas de `@/types`

## Beneficios de tener esta carpeta

✅ **Autocomplete**: El editor sugiere propiedades disponibles  
✅ **Detección de errores**: TypeScript avisa si accedes a propiedades inexistentes  
✅ **Documentación viva**: Los tipos sirven como documentación del API  
✅ **Refactoring seguro**: Si cambias un tipo, ves todos los lugares afectados  
✅ **Sincronización Front-Back**: Los tipos deben coincidir con los modelos del backend  
✅ **Menos bugs**: Errores de tipado se detectan ANTES de ejecutar el código  

## Cómo se usará en el código

Los componentes y funciones API importarán estos tipos para tipar variables, parámetros y retornos:

```
api/products.ts → Usa Product, CreateProductDTO
components/ProductCard.tsx → Usa Product
context/CartContext.tsx → Usa CartItem, Product
pages/Orders.tsx → Usa Order, OrderItem
```

## Relación con otras carpetas

- **Usada por**: `src/api/` (tipar peticiones/respuestas)
- **Usada por**: `src/context/` o `src/store/` (tipar el estado)
- **Usada por**: `src/components/` (tipar props)
- **Usada por**: `src/pages/` (tipar datos)

## Notas importantes

- Los tipos **DEBEN coincidir exactamente** con lo que retorna tu backend
- Si el backend cambia un campo, **actualizar aquí inmediatamente**
- Usar **interfaces para objetos**, **types para uniones/primitivos**
- Marcar propiedades opcionales con `?` solo si realmente lo son en el backend
- Usar **tipos específicos** en lugar de `string` cuando sea posible (ejemplo: 'pendiente' | 'completado' en lugar de string)
- Considerar crear **tipos derivados** usando Utility Types de TypeScript (Partial, Pick, Omit, etc.)
