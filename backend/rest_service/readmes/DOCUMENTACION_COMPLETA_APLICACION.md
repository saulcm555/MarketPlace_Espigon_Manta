# 📚 Documentación de la Capa de Aplicación
## MarketPlace Espigón Manta

> **Fecha**: 12 de octubre de 2025  
> **Arquitectura**: Clean Architecture  
> **Stack**: Node.js + TypeScript + TypeORM + PostgreSQL

---

## 📊 Resumen Rápido

- **Total de DTOs**: 28 archivos
- **Total de Casos de Uso**: 27 archivos
- **Módulos**: 9 (Clients, Admins, Cart, Categories, Products, Orders, Payments, Sellers, Inventory)

---

## 🗂️ ¿Qué son los DTOs?

Los **DTOs (Data Transfer Objects)** son archivos que definen **qué datos se necesitan** para cada operación. Son como formularios que dicen "dame estos datos y yo hago la tarea".

### Ejemplo simple:
- **LoginClient.dto.ts** dice: "Para iniciar sesión necesito email y contraseña"
- **CreateProduct.dto.ts** dice: "Para crear un producto necesito nombre, precio, descripción, etc."

---

## ⚙️ ¿Qué son los Casos de Uso?

Los **Casos de Uso** son archivos que tienen la **lógica de negocio**. Toman los datos del DTO y hacen las validaciones y operaciones necesarias.

### Ejemplo simple:
- **LoginClient.ts** recibe email y contraseña → verifica que sean correctos → devuelve los datos del cliente
- **CreateProduct.ts** recibe datos del producto → valida que todo esté bien → guarda el producto en la base de datos

---

## 📁 Módulos del Sistema

---

### 👥 **1. CLIENTS (Clientes)**

#### DTOs (3 archivos):

**LoginClient.dto.ts**
- Necesita: email, contraseña
- Para: Iniciar sesión

**RegisterClient.dto.ts**
- Necesita: nombre, email, contraseña, dirección, teléfono, documento, fecha de nacimiento, foto de perfil
- Para: Registrar nuevo cliente

**UpdateClientProfile.dto.ts**
- Necesita: cualquier campo que quiera actualizar (nombre, email, dirección, etc.)
- Para: Actualizar datos del perfil

**types.ts**
- Contiene: tipos reutilizables como tipo de documento (cédula, pasaporte, RUC) y direcciones adicionales
- Para: No repetir código

#### Casos de Uso (3 archivos):

**LoginClient.ts**
- **Qué hace**: Valida email y contraseña, busca al cliente en la base de datos
- **Validaciones**: Email válido, contraseña correcta
- **Retorna**: Datos del cliente (sin contraseña por seguridad)

**RegisterClient.ts**
- **Qué hace**: Registra un nuevo cliente en el sistema
- **Validaciones**: Email válido, contraseña mínimo 6 caracteres, edad mayor a 18 años
- **Retorna**: Cliente creado (sin contraseña)

**UpdateClientProfile.ts**
- **Qué hace**: Actualiza los datos del perfil del cliente
- **Validaciones**: Si cambia email lo valida, si cambia contraseña valida longitud, si cambia edad valida 18+
- **Retorna**: Cliente actualizado (sin contraseña)

---

### 🛡️ **2. ADMINS (Administradores)**

#### DTOs (3 archivos):

**LoginAdmin.dto.ts**
- Necesita: email, contraseña
- Para: Login de administradores

**ManageProducts.dto.ts**
- Necesita: ID del producto, ID del admin, razón (opcional)
- Para: Aprobar, rechazar o eliminar productos

**ManageUsers.dto.ts**
- Necesita: filtros como página, límite, estado
- Para: Listar usuarios, activar/desactivar cuentas, ver estadísticas

#### Casos de Uso (3 archivos):

**LoginAdmin.ts**
- **Qué hace**: Autentica al administrador
- **Validaciones**: Email y contraseña correctos
- **Retorna**: Datos del admin (sin contraseña)

**ManageProducts.ts**
- **Qué hace**: Gestiona la aprobación de productos de vendedores
- **Tiene 4 métodos**:
  - Aprobar producto (cambia estado a "aprobado")
  - Rechazar producto (cambia estado a "rechazado")
  - Ver productos pendientes
  - Eliminar producto
- **Validaciones**: Que el producto exista

**ManageUsers.ts**
- **Qué hace**: Administra usuarios del sistema
- **Tiene 6 métodos**:
  - Listar todos los clientes (con paginación)
  - Listar todos los vendedores (con paginación)
  - Activar/desactivar clientes
  - Activar/desactivar vendedores
  - Ver estadísticas del sistema (total usuarios, productos, órdenes, ingresos)
  - Buscar usuario por ID
- **Validaciones**: Filtros válidos, usuario existe

---

### 🛒 **3. CART (Carrito de Compras)**

#### DTOs (2 archivos):

**AddToCart.dto.ts**
- Necesita: ID del cliente, ID del producto, cantidad
- Para: Agregar productos al carrito

**ManageCart.dto.ts**
- Necesita: ID del carrito, ID del producto (según operación)
- Para: Ver, actualizar, eliminar items o limpiar todo el carrito

#### Casos de Uso (2 archivos):

**AddToCart.ts**
- **Qué hace**: Agrega un producto al carrito del cliente
- **Validaciones**: Cantidad mayor a 0
- **Retorna**: Item agregado al carrito

**ManageCart.ts**
- **Qué hace**: Operaciones completas del carrito
- **Tiene 4 métodos**:
  - Ver carrito completo del cliente
  - Actualizar cantidad de un producto
  - Eliminar un producto del carrito
  - Vaciar carrito completo
- **Validaciones**: Cantidad mayor a 0, carrito existe

---

### 🏷️ **4. CATEGORIES (Categorías)**

#### DTOs (4 archivos):

**CreateCategory.dto.ts**
- Necesita: nombre, descripción, foto (opcional)
- Para: Crear categorías principales

**CreateSubCategory.dto.ts**
- Necesita: ID de la categoría padre, nombre, descripción
- Para: Crear subcategorías dentro de una categoría

**QueryCategories.dto.ts**
- Necesita: filtros varios
- Para: Buscar y consultar categorías y subcategorías

**ManageCategories.dto.ts**
- Necesita: ID y campos a actualizar
- Para: Actualizar o eliminar categorías y subcategorías

#### Casos de Uso (4 archivos):

**CreateCategory.ts**
- **Qué hace**: Crea una nueva categoría principal
- **Validaciones**: Nombre mínimo 3 caracteres, descripción requerida
- **Retorna**: Categoría creada

**CreateSubCategory.ts**
- **Qué hace**: Crea una subcategoría asociada a una categoría padre
- **Validaciones**: Nombre mínimo 3 caracteres, categoría padre existe
- **Retorna**: Subcategoría creada

**QueryCategories.ts**
- **Qué hace**: Consultas de categorías
- **Tiene 4 métodos**:
  - Listar todas las categorías (opción de incluir subcategorías)
  - Buscar categoría por ID
  - Listar subcategorías de una categoría
  - Buscar subcategoría por ID
- **Validaciones**: IDs válidos

**ManageCategories.ts**
- **Qué hace**: Actualizar y eliminar categorías
- **Tiene 4 métodos**:
  - Actualizar categoría
  - Eliminar categoría
  - Actualizar subcategoría
  - Eliminar subcategoría
- **Validaciones**: Categoría existe, hay campos para actualizar

---

### 📦 **5. PRODUCTS (Productos)**

#### DTOs (4 archivos):

**CreateProduct.dto.ts**
- Necesita: vendedor, categoría, nombre, descripción, precio, stock, imagen
- Para: Crear nuevos productos

**ListProducts.dto.ts**
- Necesita: filtros (página, límite, categoría, precio, búsqueda, ordenamiento)
- Para: Listar productos con filtros avanzados

**QueryProducts.dto.ts**
- Necesita: ID o criterios de búsqueda
- Para: Buscar productos específicos

**ManageProducts.dto.ts**
- Necesita: ID del producto y campos a actualizar
- Para: Actualizar o eliminar productos (por vendedores)

#### Casos de Uso (4 archivos):

**CreateProduct.ts**
- **Qué hace**: Crea un nuevo producto
- **Validaciones**: Precio no negativo, nombre mínimo 3 caracteres, campos requeridos
- **Retorna**: Producto creado

**ListProducts.ts**
- **Qué hace**: Lista productos con filtros súper completos
- **Tiene**: Paginación, filtros por categoría/vendedor/precio, búsqueda por texto, ordenamiento (precio/nombre/fecha/stock)
- **Retorna**: Lista de productos + información de paginación (total páginas, página actual, etc.)

**QueryProducts.ts**
- **Qué hace**: Búsquedas específicas de productos
- **Tiene 4 métodos**:
  - Buscar producto por ID
  - Buscar productos por texto (nombre/descripción)
  - Filtrar productos por categoría/subcategoría
  - Listar productos de un vendedor
- **Validaciones**: Búsqueda mínimo 2 caracteres

**ManageProducts.ts**
- **Qué hace**: Gestión de productos por vendedores
- **Tiene 2 métodos**:
  - Actualizar producto (nombre, precio, descripción, stock, etc.)
  - Eliminar producto
- **Validaciones**: Precio y stock no negativos, vendedor es dueño del producto

---

### 📋 **6. ORDERS (Órdenes)**

#### DTOs (4 archivos):

**CreateOrder.dto.ts**
- Necesita: cliente, carrito, método de pago, tipo de entrega, dirección
- Para: Crear una orden de compra

**UpdateOrderStatus.dto.ts**
- Necesita: ID de orden, nuevo estado
- Para: Cambiar el estado de la orden

**QueryOrders.dto.ts**
- Necesita: filtros de búsqueda
- Para: Buscar y listar órdenes

**CancelOrder.dto.ts**
- Necesita: ID de orden, ID de cliente, razón
- Para: Cancelar una orden

#### Casos de Uso (4 archivos):

**CreateOrder.ts**
- **Qué hace**: Crea una orden desde el carrito del cliente
- **Validaciones**: Carrito existe, método de pago válido
- **Retorna**: Orden creada con estado "pendiente"

**UpdateOrderStatus.ts**
- **Qué hace**: Actualiza el estado de una orden
- **Validaciones especiales**: Solo permite transiciones válidas:
  - Pendiente → Procesando o Cancelada
  - Procesando → Enviada o Cancelada
  - Enviada → Entregada
  - Entregada y Cancelada son estados finales
- **Retorna**: Orden actualizada

**QueryOrders.ts**
- **Qué hace**: Consultas de órdenes
- **Tiene 3 métodos**:
  - Buscar orden por ID
  - Listar órdenes de un cliente (con filtro por estado)
  - Listar órdenes de un vendedor (con filtro por estado)
- **Retorna**: Órdenes ordenadas por fecha (más reciente primero)

**CancelOrder.ts**
- **Qué hace**: Cancela una orden
- **Validaciones**: Cliente es dueño de la orden, orden no está entregada, orden no está ya cancelada
- **Retorna**: Orden con estado "cancelada"

---

### 💳 **7. PAYMENTS (Pagos)**

#### DTOs (2 archivos):

**CreatePayment.dto.ts**
- Necesita: orden, método de pago, monto, detalles
- Para: Registrar un pago

**QueryPayments.dto.ts**
- Necesita: ID o filtros de búsqueda
- Para: Consultar métodos de pago e historial

#### Casos de Uso (2 archivos):

**CreatePayment.ts**
- **Qué hace**: Registra un pago (preparado para integración con pasarela real)
- **Validaciones**: Monto mayor a 0, orden existe, método de pago existe
- **Retorna**: Método de pago usado

**QueryPayments.ts**
- **Qué hace**: Consultas de pagos
- **Tiene 4 métodos**:
  - Buscar método de pago por ID
  - Ver método de pago de una orden específica
  - Ver historial de pagos de un cliente (a través de sus órdenes)
  - Listar todos los métodos de pago disponibles
- **Retorna**: Información de pagos

---

### 🏪 **8. SELLERS (Vendedores)**

#### DTOs (3 archivos):

**RegisterSeller.dto.ts**
- Necesita: nombre, email, contraseña, teléfono, nombre del negocio, ubicación
- Para: Registrar nuevo vendedor

**ManageSeller.dto.ts**
- Necesita: email y contraseña para login, o campos a actualizar
- Para: Login y actualización de perfil

**GetSellerDashboard.dto.ts**
- Necesita: ID del vendedor, rango de fechas (opcional)
- Para: Ver estadísticas y dashboard del vendedor

#### Casos de Uso (3 archivos):

**RegisterSeller.ts**
- **Qué hace**: Registra un nuevo vendedor en el sistema
- **Validaciones**: Email válido, contraseña mínimo 6 caracteres, nombre del negocio requerido
- **Retorna**: Vendedor creado (sin contraseña)

**ManageSeller.ts**
- **Qué hace**: Gestión de vendedores
- **Tiene 3 métodos**:
  - Login (verificar email y contraseña)
  - Actualizar perfil (nombre, email, contraseña, teléfono, negocio, ubicación)
  - Ver perfil por ID
- **Validaciones**: Email válido si se actualiza, contraseña mínimo 6 caracteres
- **Retorna**: Datos del vendedor (sin contraseña)

**GetSellerDashboard.ts**
- **Qué hace**: Genera un dashboard completo con estadísticas del vendedor
- **Estadísticas que calcula**:
  - Total de productos
  - Productos activos (con stock)
  - Productos con bajo stock (menos de 10 unidades)
  - Total de ventas
  - Total de ingresos
  - Órdenes pendientes
  - Órdenes completadas
  - Órdenes canceladas
  - Últimas 5 órdenes
  - Productos más vendidos (preparado)
- **Retorna**: Dashboard completo con todas las métricas

---

### 📊 **9. INVENTORY (Inventario)**

#### DTOs (2 archivos):

**UpdateStock.dto.ts**
- Necesita: ID producto, ID vendedor, cantidad, tipo de operación (establecer/sumar/restar)
- Para: Actualizar el stock de productos

**QueryInventory.dto.ts**
- Necesita: ID producto o ID vendedor
- Para: Consultar inventario

#### Casos de Uso (2 archivos):

**UpdateStock.ts**
- **Qué hace**: Actualiza el stock de un producto
- **Tiene 3 operaciones**:
  - **set**: Establece un stock exacto (ej: stock = 50)
  - **add**: Suma al stock actual (ej: tengo 50, sumo 20 = 70)
  - **subtract**: Resta del stock actual (ej: tengo 50, resto 10 = 40)
- **Validaciones**: Stock no puede ser negativo, vendedor es dueño del producto
- **Retorna**: Producto con stock actualizado

**QueryInventory.ts**
- **Qué hace**: Consultas de inventario
- **Tiene 4 métodos**:
  - Ver inventario de un producto específico
  - Ver todo el inventario de un vendedor (ordenado por stock bajo primero)
  - **Alerta**: Productos con bajo stock (menos de 10 unidades por defecto)
  - **Alerta**: Productos sin stock (0 unidades)
- **Retorna**: Información del inventario

---

## 🔄 Flujos Completos del Sistema

---

### 🛍️ **FLUJO: Cliente compra un producto**

1. **Entra al sistema**
   - Usa: `RegisterClient` o `LoginClient`
   - Resultado: Cliente autenticado

2. **Busca productos**
   - Usa: `QueryProducts` (buscar por nombre, filtrar por categoría)
   - Usa: `ListProducts` (ver catálogo con filtros y ordenamiento)
   - Resultado: Ve lista de productos disponibles

3. **Agrega al carrito**
   - Usa: `AddToCart` (puede agregar varios productos)
   - Resultado: Productos en el carrito

4. **Revisa su carrito**
   - Usa: `ManageCart` → método getCart
   - Puede: Actualizar cantidades, eliminar productos
   - Resultado: Carrito listo para comprar

5. **Crea la orden**
   - Usa: `CreateOrder` (indica método de pago y tipo de entrega)
   - Resultado: Orden creada con estado "pendiente"

6. **Procesa el pago**
   - Usa: `CreatePayment`
   - Resultado: Pago registrado

7. **Hace seguimiento**
   - Usa: `QueryOrders` (ver estado de su orden)
   - Estados posibles: Pendiente → Procesando → Enviada → Entregada
   - Si necesita: Usa `CancelOrder` (solo si no está entregada)

---

### 👨‍💼 **FLUJO: Admin gestiona el sistema**

1. **Entra al panel de administración**
   - Usa: `LoginAdmin`
   - Resultado: Admin autenticado

2. **Configura categorías**
   - Usa: `CreateCategory` (ej: Electrónica, Ropa, Hogar)
   - Usa: `CreateSubCategory` (ej: Electrónica → Celulares, Laptops)
   - Usa: `QueryCategories` (ver todas las categorías)
   - Usa: `ManageCategories` (actualizar o eliminar si es necesario)

3. **Aprueba productos**
   - Usa: `ManageProducts` → método getPendingProducts
   - Ve: Lista de productos que los vendedores subieron
   - Puede: Aprobar o rechazar cada producto
   - Puede: Eliminar productos si viola políticas

4. **Gestiona usuarios**
   - Usa: `ManageUsers` → getAllClients o getAllSellers
   - Ve: Lista de todos los usuarios
   - Puede: Activar o desactivar cuentas
   - Puede: Buscar usuario específico por ID

5. **Ve estadísticas**
   - Usa: `ManageUsers` → getSystemStats
   - Ve: Total de clientes, vendedores, productos, órdenes, ingresos totales

---

### 🏪 **FLUJO: Vendedor vende productos**

1. **Se registra/entra al sistema**
   - Usa: `RegisterSeller` (primera vez)
   - Usa: `ManageSeller` → loginSeller (siguientes veces)
   - Resultado: Vendedor autenticado

2. **Sube sus productos**
   - Usa: `CreateProduct` (nombre, descripción, precio, stock, imagen)
   - Resultado: Producto creado con estado "pendiente" (espera aprobación del admin)

3. **Gestiona su inventario**
   - Usa: `UpdateStock` (operaciones: establecer, sumar o restar stock)
   - Usa: `QueryInventory` → getLowStockProducts (alerta de productos con poco stock)
   - Usa: `QueryInventory` → getOutOfStockProducts (productos sin stock)

4. **Actualiza sus productos**
   - Usa: `QueryProducts` → getProductsBySeller (ve sus productos)
   - Usa: `ManageProducts` → updateProduct (cambia precio, descripción, etc.)
   - Usa: `ManageProducts` → deleteProduct (elimina producto)

5. **Ve su dashboard**
   - Usa: `GetSellerDashboard`
   - Ve: Total productos, ventas, ingresos, órdenes pendientes, productos con bajo stock
   - Ve: Últimas órdenes recientes

6. **Revisa sus ventas**
   - Usa: `QueryOrders` → getSellerOrders
   - Ve: Órdenes de sus productos
   - Puede: Filtrar por estado (pendiente, completada, cancelada)

7. **Actualiza su perfil**
   - Usa: `ManageSeller` → updateSellerProfile
   - Puede: Cambiar nombre, email, teléfono, nombre del negocio, ubicación

---

## ✅ Validaciones Importantes

### 🔐 **Seguridad**

- **Contraseñas**: Nunca se devuelven en las respuestas (por seguridad)
- **Ownership**: El sistema verifica que solo el dueño pueda modificar/eliminar sus cosas:
  - Vendedor solo puede editar sus productos
  - Cliente solo puede cancelar sus órdenes
  - Cliente solo puede ver su carrito
- **Emails**: Validados con regex (formato correcto)
- **Contraseñas**: Mínimo 6 caracteres

### 📊 **Datos**

- **Edad**: Clientes deben tener 18+ años
- **Precios**: No pueden ser negativos
- **Stock**: No puede ser negativo
- **Cantidades**: En el carrito deben ser mayores a 0
- **Montos**: En pagos deben ser mayores a 0
- **Nombres**: Mínimo 3 caracteres

### 🔄 **Estados de Órdenes**

Solo se permiten estas transiciones:
- **Pendiente** → puede ir a: Procesando o Cancelada
- **Procesando** → puede ir a: Enviada o Cancelada
- **Enviada** → puede ir a: Entregada
- **Entregada** → Estado final (no cambia)
- **Cancelada** → Estado final (no cambia)

---

## 📊 Resumen de Archivos por Módulo

| Módulo | DTOs | Casos de Uso | Total |
|--------|------|--------------|-------|
| Clients | 4 | 3 | 7 |
| Admins | 3 | 3 | 6 |
| Cart | 2 | 2 | 4 |
| Categories | 4 | 4 | 8 |
| Products | 4 | 4 | 8 |
| Orders | 4 | 4 | 8 |
| Payments | 2 | 2 | 4 |
| Sellers | 3 | 3 | 6 |
| Inventory | 2 | 2 | 4 |
| **TOTAL** | **28** | **27** | **55** |

---

## 🚀 Estado del Proyecto

### ✅ **Completado (100%)**
- [x] Estructura de carpetas
- [x] 28 DTOs definidos
- [x] 27 Casos de Uso implementados
- [x] Validaciones de negocio
- [x] Flujos de usuario definidos
- [x] Documentación completa

### 🔜 **Pendiente**
- [ ] Encriptar contraseñas (bcrypt)
- [ ] Implementar JWT para autenticación
- [ ] Integrar pasarela de pagos real
- [ ] Crear controladores HTTP/GraphQL
- [ ] Crear tests unitarios
- [ ] Migraciones de base de datos
- [ ] Documentación de API (Swagger)

---

## 📖 Cómo Leer Este Proyecto

### Si eres **desarrollador frontend**:
- Los **DTOs** te dicen qué datos necesitas enviar al backend
- Los **Casos de Uso** te dicen qué respuestas esperar

### Si eres **desarrollador backend**:
- Los **DTOs** definen tus contratos de entrada/salida
- Los **Casos de Uso** tienen tu lógica de negocio implementada

### Si eres **tester**:
- Las **Validaciones** te dicen qué casos probar
- Los **Flujos** te dan escenarios de prueba completos

---

**Última actualización**: 12 de octubre de 2025  
**Versión**: 1.0.0  
**Autor**: Equipo de Desarrollo MarketPlace Espigón Manta
