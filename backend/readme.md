# 🛍️ Marketplace Espigón Manta

## Descripción del Proyecto

**Marketplace Espigón Manta** es una plataforma de comercio electrónico desarrollada con TypeScript que conecta vendedores locales con clientes en la región de Manta, Ecuador. El sistema está diseñado siguiendo los principios de **Arquitectura Limpia (Clean Architecture)** y patrones de **Domain-Driven Design (DDD)**.

## 🤝 Colaboración y Desarrollo

### Contexto Académico
Este proyecto fue desarrollado como parte de un trabajo colaborativo en el curso de **Aplicaciones para Servidores Web**. 

### Contribuciones del Equipo
- **Saul Castro**: Arquitectura base y estructura inicial del proyecto
- **Lilibeth Pinargote - Jair Jama**: Implementación colaborativa de entidades y repositorios

### Mi Contribución Específica
- ✅ Documentación completa del sistema
- ✅ Optimización de la configuración TypeScript 
- ✅ Eliminación y refactoring del módulo Service
- ✅ Mejoras en la arquitectura del proyecto
- ✅ Personalización para el contexto de Manta, Ecuador

## 🏗️ Arquitectura del Sistema

El proyecto implementa una arquitectura en capas bien definida:

### 📁 Estructura de Carpetas

```
src/
├── domain/           # Capa de Dominio (Entidades y Contratos)
│   ├── entities/     # Entidades del negocio
│   └── repositories/ # Interfaces de repositorios
├── applications/     # Capa de Aplicación (Casos de Uso)
├── infraestructure/ # Capa de Infraestructura (Implementaciones)
└── app.ts           # Punto de entrada de la aplicación
```

### 🔧 Capas de la Arquitectura

1. **Domain Layer (Dominio)**: Contiene la lógica de negocio pura
2. **Application Layer (Aplicación)**: Orquesta los casos de uso
3. **Infrastructure Layer (Infraestructura)**: Implementa los detalles técnicos

## 🛒 Funcionalidades del Marketplace

### 👥 Gestión de Usuarios

#### **Clientes**
- ✅ Registro y autenticación de clientes
- ✅ Gestión de perfiles de usuario
- ✅ Historial de compras
- ✅ Gestión de direcciones de entrega

#### **Vendedores (Sellers)**
- ✅ Registro de vendedores con información comercial
- ✅ Gestión de inventarios
- ✅ Panel de control de ventas
- ✅ Información de ubicación y contacto

#### **Administradores**
- ✅ Gestión completa del marketplace
- ✅ Supervisión de vendedores y clientes
- ✅ Control de categorías y productos

### 🛍️ Catálogo de Productos

#### **Productos**
- ✅ Creación y gestión de productos
- ✅ Información detallada (nombre, descripción, precio, imágenes)
- ✅ Control de stock e inventario
- ✅ Categorización jerárquica

#### **Categorías y Subcategorías**
- ✅ Sistema de categorización en dos niveles
- ✅ Organización visual con imágenes
- ✅ Navegación intuitiva por categorías

### 🛒 Sistema de Compras

#### **Carrito de Compras**
- ✅ Agregar/quitar productos
- ✅ Modificar cantidades
- ✅ Cálculo automático de totales
- ✅ Persistencia de carrito por usuario

#### **Gestión de Pedidos**
- ✅ Procesamiento de órdenes
- ✅ Seguimiento de estados (pendiente, procesado, enviado, entregado)
- ✅ Cálculo de montos totales
- ✅ Gestión de tipos de entrega

### 💳 Sistema de Pagos

#### **Métodos de Pago**
- ✅ Múltiples opciones de pago
- ✅ Integración con sistemas de pago
- ✅ Registro seguro de transacciones

### 🚚 Logística y Entrega

#### **Gestión de Deliveries**
- ✅ Asignación de repartidores
- ✅ Seguimiento de entregas
- ✅ Diferentes tipos de entrega (domicilio, pickup, etc.)

### 📦 Gestión de Inventario

#### **Control de Stock**
- ✅ Seguimiento en tiempo real
- ✅ Alertas de stock bajo
- ✅ Gestión por vendedor
- ✅ Historial de movimientos

## 🎯 Entidades del Dominio

### Entidades Principales

| Entidad | Descripción | Atributos Clave |
|---------|-------------|-----------------|
| **Client** | Clientes del marketplace | id, name, email, address |
| **Seller** | Vendedores registrados | id, name, business_name, location |
| **Product** | Productos en venta | id, name, price, stock, description |
| **Category** | Categorías de productos | id, name, description, photo |
| **SubCategory** | Subcategorías | id, name, parent_category |
| **Cart** | Carrito de compras | id, client_id, products |
| **Order** | Órdenes de compra | id, date, status, total_amount |
| **Inventory** | Control de inventario | id, product_id, quantity |
| **PaymentMethod** | Métodos de pago | id, type, details |
| **Delivery** | Gestión de entregas | id, order_id, delivery_type |
| **Admin** | Administradores | id, name, permissions |

## 🔄 Servicios de Aplicación

Cada entidad tiene su servicio correspondiente que maneja la lógica de negocio:

- `AdminService` - Gestión de administradores
- `ClientService` - Gestión de clientes
- `SellerService` - Gestión de vendedores
- `ProductService` - CRUD de productos
- `CategoryService` - Gestión de categorías
- `SubCategoryService` - Gestión de subcategorías
- `CartService` - Lógica del carrito
- `OrderService` - Procesamiento de pedidos
- `InventoryService` - Control de inventario
- `PaymentMethodService` - Gestión de pagos
- `DeliveryService` - Logística de entregas

## 🛠️ Tecnologías Utilizadas

- **TypeScript**: Lenguaje principal
- **Node.js**: Runtime de JavaScript
- **Clean Architecture**: Patrón arquitectónico
- **Domain-Driven Design**: Metodología de diseño

## 📦 Configuración del Proyecto

### Scripts Disponibles

```bash
npm run dev      # Modo desarrollo con hot-reload
npm run build    # Compilar TypeScript a JavaScript
npm run start    # Ejecutar aplicación compilada
```

### Dependencias de Desarrollo

- `typescript` - Compilador de TypeScript
- `ts-node-dev` - Desarrollo con hot-reload
- `@types/node` - Tipos de Node.js
- `rimraf` - Limpieza de directorios

## 🚀 Próximas Funcionalidades

- [ ] Sistema de reseñas y calificaciones
- [ ] Chat en tiempo real entre clientes y vendedores
- [ ] Sistema de promociones y descuentos
- [ ] Analytics y reportes para vendedores
- [ ] Integración con APIs de pago locales
- [ ] Aplicación móvil
- [ ] Sistema de notificaciones push

## 📊 Estado del Proyecto

**Versión**: 1.0.0  
**Estado**: En Desarrollo  
**Última Actualización**: Octubre 2025  
**Curso**: Aplicaciones para Servidores Web  

El Marketplace Espigón Manta está en desarrollo activo, implementando las funcionalidades core del sistema de comercio electrónico con un enfoque en la experiencia del usuario local y la facilidad de uso para vendedores de la región de Manta.

---

*Desarrollado con ❤️ en colaboración académica para la comunidad de Manta, Ecuador*
