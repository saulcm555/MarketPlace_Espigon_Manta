# Implementación de Tablas Transaccionales - MarketPlace Espigón Manta

## 📋 Resumen

Este documento explica la implementación de las **tablas transaccionales** (tablas intermedias para relaciones many-to-many) en el sistema de MarketPlace. Se implementaron dos tablas transaccionales principales:

1. **ProductCart** - Relación entre `Cart` y `Product`
2. **ProductOrder** - Relación entre `Order` y `Product`

---

## 🏗️ Arquitectura

El proyecto sigue una **Clean Architecture** con las siguientes capas:

```
src/
├── domain/              # Entidades y lógica de negocio
├── application/         # Casos de uso y DTOs
├── infrastructure/      # Implementaciones (DB, HTTP, etc.)
└── models/             # Modelos TypeORM
```

---

## 📊 Tablas Transaccionales Implementadas

### 1. ProductCart (product_cart)

Tabla intermedia que conecta carritos con productos, permitiendo que un carrito tenga múltiples productos y viceversa.

**Estructura:**
```typescript
@Entity({ name: "product_cart" })
export class ProductCartEntity {
  @PrimaryGeneratedColumn({ name: "id_product_cart" })
  id_product_cart!: number;

  @Column({ name: "id_product" })
  id_product!: number;

  @Column({ name: "id_cart" })
  id_cart!: number;

  @Column({ name: "quantity", type: "int" })
  quantity!: number;

  @CreateDateColumn({ name: "added_at" })
  added_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: "id_product" })
  product!: ProductEntity;

  @ManyToOne(() => CartEntity)
  @JoinColumn({ name: "id_cart" })
  cart!: CartEntity;
}
```

**Ubicación del modelo:** `src/models/cartModel.ts`

---

### 2. ProductOrder (product_order)

Tabla intermedia que conecta órdenes con productos, almacenando información adicional como cantidad y precio unitario al momento de la compra.

**Estructura:**
```typescript
@Entity({ name: "product_order" })
export class ProductOrderEntity {
  @PrimaryGeneratedColumn({ name: "id_product_order" })
  id_product_order!: number;

  @Column({ name: "id_product" })
  id_product!: number;

  @Column({ name: "id_order" })
  id_order!: number;

  @Column({ name: "quantity", type: "int" })
  quantity!: number;

  @Column({ name: "price_unit", type: "decimal", precision: 10, scale: 2 })
  price_unit!: number;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: "id_product" })
  product!: ProductEntity;

  @ManyToOne(() => OrderEntity)
  @JoinColumn({ name: "id_order" })
  order!: OrderEntity;
}
```

**Ubicación del modelo:** `src/models/orderModel.ts`

---

## 🔧 Casos de Uso Implementados

### ProductCart - Casos de Uso

#### 1. AddProductToCart
**Propósito:** Agregar un producto a un carrito específico

**Archivo:** `src/application/use_cases/cart/AddProductToCart.ts`

**Funcionalidad:**
- Valida que el carrito y producto existan
- Verifica stock disponible
- Si el producto ya está en el carrito, actualiza la cantidad
- Si no existe, crea un nuevo registro en ProductCart

**DTO:** `src/application/dtos/cart/AddProductToCart.dto.ts`
```typescript
export interface AddProductToCartDto {
  id_cart: number;
  id_product: number;
  quantity: number;
}
```

---

#### 2. RemoveProductFromCart
**Propósito:** Eliminar un producto del carrito

**Archivo:** `src/application/use_cases/cart/RemoveProductFromCart.ts`

**Funcionalidad:**
- Busca el producto en el carrito usando `id_cart` e `id_product`
- Elimina el registro de ProductCart

**DTO:** `src/application/dtos/cart/RemoveProductFromCart.dto.ts`
```typescript
export interface RemoveProductFromCartDto {
  id_cart: number;
  id_product: number;
}
```

---

#### 3. UpdateCartItemQuantity
**Propósito:** Actualizar la cantidad de un producto en el carrito

**Archivo:** `src/application/use_cases/cart/UpdateCartItemQuantity.ts`

**Funcionalidad:**
- Busca el producto en el carrito
- Valida que haya stock suficiente
- Actualiza la cantidad en ProductCart
- Actualiza la fecha de modificación

**DTO:** `src/application/dtos/cart/UpdateCartItemQuantity.dto.ts`
```typescript
export interface UpdateCartItemQuantityDto {
  id_cart: number;
  id_product: number;
  quantity: number;
}
```

---

#### 4. GetCartWithProducts
**Propósito:** Obtener un carrito con todos sus productos

**Archivo:** `src/application/use_cases/cart/GetCartWithProducts.ts`

**Funcionalidad:**
- Obtiene el carrito con sus relaciones (ProductCart y Product)
- Incluye información del cliente
- Devuelve la estructura completa del carrito

---

### ProductOrder - Caso de Uso

#### CreateOrder
**Propósito:** Crear una orden con sus productos usando transacciones de base de datos

**Archivo:** `src/application/use_cases/orders/CreateOrder.ts`

**Funcionalidad:**
- **Usa transacciones de BD** para garantizar integridad de datos
- Crea la orden principal
- Itera sobre los productos y crea registros en ProductOrder
- Actualiza el stock de cada producto
- Si algo falla, hace rollback de todos los cambios

**DTO:** `src/application/dtos/orders/CreateOrder.dto.ts`
```typescript
export interface CreateOrderDto {
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  delivery_type: string;
  delivery_address?: string;
  productOrders?: {
    id_product: number;
    quantity: number;
    price_unit: number;
  }[];
}
```

**Código clave - Transacción:**
```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // 1. Crear orden
  const order = await queryRunner.manager.save(OrderEntity, newOrder);

  // 2. Crear ProductOrder para cada producto
  for (const productOrder of data.productOrders) {
    const productOrderEntity = queryRunner.manager.create(ProductOrderEntity, {
      id_order: order.id_order,
      id_product: productOrder.id_product,
      quantity: productOrder.quantity,
      price_unit: productOrder.price_unit,
    });
    await queryRunner.manager.save(productOrderEntity);

    // 3. Actualizar stock
    await queryRunner.manager.update(
      ProductEntity,
      { id_product: productOrder.id_product },
      { stock: () => `stock - ${productOrder.quantity}` }
    );
  }

  await queryRunner.commitTransaction();
  return order;
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

---

## 🌐 Endpoints API

### ProductCart Endpoints

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/api/carts/:id/products` | Agregar producto al carrito | Cliente |
| GET | `/api/carts/:id/with-products` | Obtener carrito con productos | Sí |
| PUT | `/api/carts/:id/products/:productId` | Actualizar cantidad | Cliente |
| DELETE | `/api/carts/:id/products/:productId` | Eliminar producto del carrito | Cliente |

**Ejemplo - Agregar producto al carrito:**
```bash
POST /api/carts/1/products
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_product": 1,
  "quantity": 2
}
```

**Respuesta:**
```json
{
  "id_product_cart": 1,
  "id_cart": 1,
  "id_product": 1,
  "quantity": 2,
  "added_at": "2025-10-22T00:00:00.000Z",
  "updated_at": "2025-10-22T00:00:00.000Z"
}
```

---

### ProductOrder Endpoints

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/api/orders` | Crear orden con productos | Cliente |
| GET | `/api/orders/:id` | Obtener orden con productos | Sí |

**Ejemplo - Crear orden:**
```bash
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "id_client": 2,
  "id_cart": 1,
  "id_payment_method": 1,
  "delivery_type": "home_delivery",
  "delivery_address": "Calle Principal 123",
  "productOrders": [
    {
      "id_product": 1,
      "quantity": 5,
      "price_unit": 1200.00
    }
  ]
}
```

**Respuesta:**
```json
{
  "id_order": 3,
  "id_client": 2,
  "id_cart": 1,
  "id_payment_method": 1,
  "total_price": "6000.00",
  "order_date": "2025-10-22T00:00:00.000Z",
  "delivery_type": "home_delivery"
}
```

---

## 🔐 Sistema de Autenticación

Se implementó un sistema completo de autenticación JWT para proteger los endpoints.

### Endpoints de Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login/client` | Login de clientes |
| POST | `/api/auth/login/seller` | Login de vendedores |
| POST | `/api/auth/login/admin` | Login de administradores |
| POST | `/api/auth/register/client` | Registro de clientes |
| GET | `/api/auth/verify` | Verificar token JWT |

**Archivos:**
- Controlador: `src/infrastructure/http/controllers/authController.ts`
- Rutas: `src/infrastructure/http/routes/authRoutes.ts`
- Middleware: `src/infrastructure/middlewares/authMiddleware.ts`

**Características:**
- Tokens JWT con expiración de 24 horas
- Contraseñas hasheadas con bcrypt (10 salt rounds)
- Roles: client, seller, admin
- Secret key configurable via `JWT_SECRET` (env variable)

---

## 📦 Endpoints Auxiliares Creados

### Payment Methods
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/payment-methods` | Obtener métodos de pago |
| GET | `/api/payment-methods/:id` | Obtener método por ID |
| POST | `/api/payment-methods` | Crear método (Admin) |
| PUT | `/api/payment-methods/:id` | Actualizar método (Admin) |
| DELETE | `/api/payment-methods/:id` | Eliminar método (Admin) |

### Deliveries
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/deliveries` | Obtener métodos de entrega |
| GET | `/api/deliveries/:id` | Obtener entrega por ID |
| POST | `/api/deliveries` | Crear entrega |
| PUT | `/api/deliveries/:id` | Actualizar entrega |
| DELETE | `/api/deliveries/:id` | Eliminar entrega (Admin) |

---

## 🧪 Testing

Se creó un script completo de pruebas en PowerShell que valida toda la funcionalidad.

**Archivo:** `backend/rest_service/test-transaccionales.ps1`

**Flujo de prueba:**

1. ✅ **Autenticación** - Login/Registro de cliente
2. ✅ **Obtener productos** - Lista de productos disponibles
3. ✅ **Crear carrito** - Carrito para el cliente
4. ✅ **Agregar producto al carrito** (ProductCart)
5. ✅ **Obtener carrito con productos** (ProductCart con relaciones)
6. ✅ **Actualizar cantidad** (ProductCart)
7. ✅ **Crear orden** (ProductOrder con transacción)
8. ✅ **Eliminar producto del carrito** (ProductCart)
9. ✅ **Verificar carrito vacío**

**Ejecutar pruebas:**
```powershell
cd backend/rest_service
.\test-transaccionales.ps1
```

---

## 🗂️ Estructura de Archivos

### ProductCart
```
src/
├── models/
│   └── cartModel.ts                        # ProductCartEntity
├── domain/
│   └── entities/
│       └── cart.ts                         # Interfaz ProductCart
├── application/
│   ├── dtos/cart/
│   │   ├── AddProductToCart.dto.ts
│   │   ├── RemoveProductFromCart.dto.ts
│   │   └── UpdateCartItemQuantity.dto.ts
│   └── use_cases/cart/
│       ├── AddProductToCart.ts
│       ├── RemoveProductFromCart.ts
│       ├── UpdateCartItemQuantity.ts
│       └── GetCartWithProducts.ts
└── infrastructure/
    └── http/
        ├── controllers/
        │   └── cartController.ts
        └── routes/
            └── cartRoutes.ts
```

### ProductOrder
```
src/
├── models/
│   └── orderModel.ts                       # ProductOrderEntity
├── domain/
│   └── entities/
│       └── order.ts                        # Interfaz ProductOrder
├── application/
│   ├── dtos/orders/
│   │   └── CreateOrder.dto.ts
│   └── use_cases/orders/
│       └── CreateOrder.ts
└── infrastructure/
    └── http/
        ├── controllers/
        │   └── orderController.ts
        └── routes/
            └── orderRoutes.ts
```

---

## 🔑 Conceptos Clave

### 1. Tablas Transaccionales
Las tablas transaccionales son tablas intermedias que resuelven relaciones **many-to-many** (muchos a muchos). En lugar de tener una relación directa entre dos entidades, se crea una tercera tabla que conecta ambas.

**Ventajas:**
- ✅ Permite relaciones muchos a muchos
- ✅ Almacena información adicional de la relación (cantidad, precio, fecha)
- ✅ Normaliza la base de datos
- ✅ Facilita consultas y reportes

### 2. Transacciones de Base de Datos
Las transacciones garantizan que un conjunto de operaciones se ejecuten completamente o ninguna se ejecute (atomicidad).

**En CreateOrder:**
```typescript
const queryRunner = AppDataSource.createQueryRunner();
await queryRunner.startTransaction();

try {
  // Operaciones múltiples...
  await queryRunner.commitTransaction(); // ✅ Todo bien
} catch (error) {
  await queryRunner.rollbackTransaction(); // ❌ Revertir todo
}
```

### 3. Clean Architecture
Separación de responsabilidades en capas:

- **Domain:** Lógica de negocio pura
- **Application:** Casos de uso y DTOs
- **Infrastructure:** Implementaciones concretas (DB, HTTP)

**Beneficios:**
- ✅ Código desacoplado
- ✅ Fácil de testear
- ✅ Fácil de mantener
- ✅ Independiente de frameworks

---

## 📝 Notas Importantes

### Convención de Nombres
- Campos en base de datos usan prefijos: `client_email`, `seller_email`, `admin_email`
- Entidades TypeORM usan nombres completos: `ProductCartEntity`, `ProductOrderEntity`
- Relaciones usan nombres claros: `productCarts`, `productOrders`

### Seguridad
- Todos los endpoints de modificación requieren autenticación
- Middleware `authMiddleware` valida tokens JWT
- Middleware `roleMiddleware` valida roles específicos
- Contraseñas nunca se almacenan en texto plano (bcrypt)

### Variables de Entorno
```env
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

---

## 🚀 Cómo Funciona el Flujo Completo

### Flujo de Compra Completo:

1. **Cliente se registra/loguea** → Recibe JWT token
2. **Cliente ve productos** → GET /api/products
3. **Cliente crea carrito** → POST /api/carts
4. **Cliente agrega productos al carrito** → POST /api/carts/:id/products
   - Se crea registro en **ProductCart**
5. **Cliente actualiza cantidades** → PUT /api/carts/:id/products/:productId
   - Se actualiza registro en **ProductCart**
6. **Cliente ve su carrito** → GET /api/carts/:id/with-products
   - Devuelve carrito con productos de **ProductCart**
7. **Cliente crea orden** → POST /api/orders
   - Se crea orden en **Order**
   - Se crean productos en **ProductOrder** (transacción)
   - Se actualiza stock de productos
8. **Cliente puede vaciar carrito** → DELETE /api/carts/:id/products/:productId
   - Se eliminan registros de **ProductCart**

---

## 🎯 Conclusión

Este proyecto demuestra una implementación completa de:

✅ Tablas transaccionales (ProductCart, ProductOrder)  
✅ Clean Architecture en Node.js + TypeScript  
✅ TypeORM con PostgreSQL  
✅ Autenticación JWT completa  
✅ Transacciones de base de datos  
✅ API RESTful bien estructurada  
✅ Testing automatizado  

**Todas las operaciones de las tablas transaccionales están probadas y funcionando al 100%.**

---

## 📚 Referencias

- [TypeORM Documentation](https://typeorm.io/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [JWT Authentication](https://jwt.io/)
- [PostgreSQL Many-to-Many](https://www.postgresql.org/docs/current/tutorial-fk.html)

---

**Fecha de creación:** 22 de octubre de 2025  
**Autor:** GitHub Copilot  
**Proyecto:** MarketPlace Espigón Manta
