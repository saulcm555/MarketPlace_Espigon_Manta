# 📡 Carpeta `src/api/`

## ¿Qué va aquí?

Esta carpeta contiene **todos los archivos que se comunican con el backend REST** (tu servicio Node.js en el puerto 8080).

## ¿Por qué es necesaria?

Sin esta carpeta, cada componente tendría que escribir su propia lógica de `fetch()` o `axios`, lo que resultaría en:
- **Código duplicado** en múltiples lugares
- **Difícil mantenimiento** cuando cambien las URLs o la autenticación
- **Inconsistencias** en cómo se manejan errores o headers
- **Imposible centralizar** la configuración del token JWT

## ¿Qué archivos debería tener?

### 1. **`client.ts`** - Configuración base de Axios
- Crea una instancia de axios con la URL base del backend
- Configura headers comunes (Content-Type, Authorization)
- Implementa interceptores para:
  - Agregar automáticamente el token JWT a cada petición
  - Manejar errores globalmente (401, 403, 500)
  - Refrescar tokens cuando expiren
  - Hacer logout automático si el token es inválido

### 2. **`auth.ts`** - Endpoints de autenticación
- `login()` - Enviar credenciales y recibir token
- `register()` - Registrar nuevos usuarios (clientes/vendedores)
- `logout()` - Cerrar sesión
- `getCurrentUser()` - Obtener datos del usuario autenticado
- `updateProfile()` - Actualizar información del perfil

### 3. **`products.ts`** - Endpoints de productos
- `getAllProducts()` - Listar todos los productos
- `getProductById(id)` - Obtener detalle de un producto
- `getProductsByCategory(categoryId)` - Filtrar por categoría
- `getProductsBySubcategory(subcategoryId)` - Filtrar por subcategoría
- `searchProducts(query)` - Buscar productos por nombre/descripción
- `createProduct(data)` - Crear nuevo producto (solo vendedores)
- `updateProduct(id, data)` - Actualizar producto (solo vendedores)
- `deleteProduct(id)` - Eliminar producto (solo vendedores)

### 4. **`categories.ts`** - Endpoints de categorías
- `getAllCategories()` - Listar todas las categorías
- `getCategoryById(id)` - Obtener una categoría específica
- `getSubcategoriesByCategory(categoryId)` - Obtener subcategorías de una categoría
- `createCategory(data)` - Crear categoría (solo admin)
- `updateCategory(id, data)` - Actualizar categoría (solo admin)
- `deleteCategory(id)` - Eliminar categoría (solo admin)

### 5. **`orders.ts`** - Endpoints de órdenes
- `createOrder(cartItems, paymentMethodId)` - Crear nueva orden desde el carrito
- `getMyOrders()` - Obtener órdenes del usuario autenticado
- `getOrderById(id)` - Ver detalle de una orden específica
- `cancelOrder(id)` - Cancelar una orden
- `getOrdersByStatus(status)` - Filtrar órdenes por estado
- `updateOrderStatus(id, newStatus)` - Actualizar estado (vendedores/admin)

### 6. **`cart.ts`** - Endpoints del carrito (opcional si usas backend)
- `getCart()` - Obtener carrito del usuario
- `addToCart(productId, quantity)` - Agregar producto al carrito
- `updateCartItem(itemId, quantity)` - Actualizar cantidad
- `removeFromCart(itemId)` - Eliminar producto del carrito
- `clearCart()` - Vaciar carrito completo

### 7. **`inventory.ts`** - Endpoints de inventario (para vendedores)
- `getInventoryByProduct(productId)` - Ver inventario de un producto
- `updateInventory(productId, newStock)` - Actualizar stock
- `getInventoryBySeller()` - Ver todos los inventarios del vendedor

### 8. **`deliveries.ts`** - Endpoints de entregas
- `getDeliveriesByOrder(orderId)` - Ver entregas de una orden
- `updateDeliveryStatus(deliveryId, newStatus)` - Actualizar estado de entrega
- `getActiveDeliveries()` - Ver entregas activas
- `assignDelivery(deliveryId, deliveryPersonId)` - Asignar repartidor

### 9. **`payments.ts`** - Endpoints de métodos de pago
- `getPaymentMethods()` - Listar métodos de pago disponibles
- `addPaymentMethod(data)` - Agregar método de pago
- `updatePaymentMethod(id, data)` - Actualizar método de pago
- `deletePaymentMethod(id)` - Eliminar método de pago

### 10. **`notifications.ts`** - Endpoints de notificaciones
- `getMyNotifications()` - Obtener notificaciones del usuario
- `markAsRead(notificationId)` - Marcar notificación como leída
- `deleteNotification(notificationId)` - Eliminar notificación
- `getUnreadCount()` - Contar notificaciones no leídas

### 11. **`sellers.ts`** - Endpoints de vendedores
- `getSellerProfile(sellerId)` - Ver perfil público de un vendedor
- `getProductsBySeller(sellerId)` - Ver productos de un vendedor específico
- `updateSellerProfile(data)` - Actualizar perfil de vendedor

### 12. **`reports.ts`** - Endpoints del servicio de reportes (Python)
- `getSalesReport(startDate, endDate)` - Obtener reporte de ventas
- `getInventoryReport()` - Reporte de inventario
- `getUserReport()` - Reporte de usuarios
- `exportReportPDF(reportType)` - Exportar reporte en PDF
- `exportReportExcel(reportType)` - Exportar reporte en Excel

## Beneficios de tener esta carpeta

✅ **Centralización**: Todos los endpoints en un solo lugar  
✅ **Mantenibilidad**: Cambiar una URL solo requiere editar un archivo  
✅ **Reutilización**: Cualquier componente puede importar y usar las funciones  
✅ **Tipado**: Funciones con tipos de entrada/salida claros (TypeScript)  
✅ **Testing**: Fácil mockear las llamadas API en pruebas  
✅ **Debugging**: Logs centralizados de todas las peticiones  

## Cómo se usará desde los componentes

Los componentes NO harán fetch directamente, sino que importarán funciones de esta carpeta:

```
Componente → Importa función → api/products.ts → Backend REST
```

Por ejemplo:
- `ProductList.tsx` importará `getAllProducts()` de `api/products.ts`
- `LoginForm.tsx` importará `login()` de `api/auth.ts`
- `OrderDetail.tsx` importará `getOrderById()` de `api/orders.ts`

## Relación con otras carpetas

- **Usa**: `src/types/` (para tipar las peticiones y respuestas)
- **Usa**: `src/config/` (para obtener las URLs del backend)
- **Usada por**: Todos los componentes que necesiten datos del backend

## Notas importantes

- Todas las funciones deben retornar **Promises** para poder usar async/await
- Los errores deben ser **manejados consistentemente** (try/catch)
- El token JWT debe **incluirse automáticamente** en todas las peticiones autenticadas
- Las respuestas del backend deben ser **transformadas** al formato que espera el frontend si es necesario
