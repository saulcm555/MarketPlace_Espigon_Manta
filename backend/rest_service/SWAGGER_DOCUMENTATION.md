# 📚 Documentación de API con Swagger/OpenAPI

## Descripción General

Este proyecto incluye documentación completa de API utilizando **Swagger/OpenAPI 3.0.0**. La documentación está implementada usando JSDoc comments en los controladores, siguiendo el estándar OpenAPI.

## 🚀 Acceso a la Documentación

Una vez que el servidor esté corriendo:

```bash
npm run dev
```

Accede a la documentación interactiva en:

- **Swagger UI**: http://localhost:3000/api-docs
- **JSON Spec**: http://localhost:3000/api-docs.json

## 📦 Paquetes Utilizados

```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}
```

## 🏗️ Estructura de la Documentación

### Archivo de Configuración

**Ubicación**: `src/infrastructure/config/swagger.ts`

Este archivo contiene:
- Configuración de OpenAPI 3.0.0
- Información del servidor
- Esquemas de seguridad (JWT Bearer Token)
- Definiciones de esquemas/DTOs reutilizables
- Tags para agrupar endpoints

### Controladores Documentados

Los siguientes controladores tienen documentación completa con JSDoc:

1. **authController.ts** - Autenticación y JWT
   - POST `/api/auth/login/client` - Login de cliente
   - POST `/api/auth/login/seller` - Login de vendedor
   - POST `/api/auth/login/admin` - Login de administrador
   - GET `/api/auth/verify` - Verificar token JWT
   - POST `/api/auth/register/client` - Registro de cliente

2. **cartController.ts** - Gestión de Carritos (incluye tabla transaccional ProductCart)
   - GET `/api/carts` - Listar carritos
   - GET `/api/carts/:id` - Obtener carrito por ID
   - POST `/api/carts` - Crear carrito
   - POST `/api/carts/:id/products` - **Agregar producto al carrito (ProductCart)**
   - DELETE `/api/carts/:id/products/:productId` - **Eliminar producto del carrito (ProductCart)**
   - PUT `/api/carts/:id/products/:productId` - **Actualizar cantidad (ProductCart)**
   - GET `/api/carts/:id/with-products` - Obtener carrito con productos

3. **productController.ts** - Gestión de Productos
   - GET `/api/products` - Listar productos con filtros
   - POST `/api/products` - Crear producto
   - DELETE `/api/products/:id` - Eliminar producto

4. **orderController.ts** - Gestión de Órdenes (incluye tabla transaccional ProductOrder)
   - GET `/api/orders` - Listar todas las órdenes
   - GET `/api/orders/:id` - Obtener orden por ID
   - POST `/api/orders` - **Crear orden desde carrito (ProductOrder con transacción)**
   - PUT `/api/orders/:id` - Actualizar estado de orden
   - DELETE `/api/orders/:id` - Eliminar orden

## 🔐 Autenticación en Swagger UI

Para probar endpoints protegidos:

1. Haz login en uno de los endpoints de autenticación
2. Copia el token JWT de la respuesta
3. Haz clic en el botón **"Authorize"** 🔒 en la parte superior de Swagger UI
4. Ingresa el token en el formato: `Bearer <tu-token>`
5. Haz clic en "Authorize"
6. Ahora puedes probar los endpoints protegidos

## 📝 Ejemplo de JSDoc para Endpoints

### Endpoint Simple

```typescript
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Listar productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
export const getProducts = async (req: Request, res: Response) => {
  // Implementación
};
```

### Endpoint con Autenticación y Request Body

```typescript
/**
 * @swagger
 * /api/carts/{id}/products:
 *   post:
 *     summary: Agregar producto al carrito (ProductCart)
 *     tags: [Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id_product:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Producto agregado exitosamente
 */
export const addProductToCart = async (req: Request, res: Response) => {
  // Implementación
};
```

## 🎯 Tags Disponibles

La documentación está organizada en los siguientes grupos:

- **Auth** - Endpoints de autenticación
- **Carts** - Gestión de carritos (incluye ProductCart)
- **Products** - Gestión de productos
- **Orders** - Gestión de órdenes (incluye ProductOrder)
- **Clients** - Gestión de clientes
- **Sellers** - Gestión de vendedores
- **Admins** - Gestión de administradores
- **Categories** - Gestión de categorías
- **SubCategories** - Gestión de subcategorías
- **Payment Methods** - Métodos de pago
- **Deliveries** - Métodos de entrega
- **Inventory** - Gestión de inventario

## 📋 Esquemas Reutilizables

Los siguientes esquemas están definidos en `swagger.ts` y pueden ser referenciados:

### Auth
- `LoginRequest`
- `LoginResponse`

### Cart
- `Cart`
- `AddProductToCartRequest`
- `UpdateCartItemRequest`

### Product
- `Product`
- `CreateProductRequest`

### Order
- `Order`
- `CreateOrderRequest`
- `UpdateOrderStatusRequest`

### Common
- `Error`

## 🔄 Tablas Transaccionales Documentadas

### ProductCart
Tabla transaccional que relaciona productos con carritos:
- **Endpoints documentados**:
  - POST `/api/carts/:id/products` - Agregar producto
  - DELETE `/api/carts/:id/products/:productId` - Eliminar producto
  - PUT `/api/carts/:id/products/:productId` - Actualizar cantidad
  - GET `/api/carts/:id/with-products` - Ver carrito con productos

### ProductOrder
Tabla transaccional que relaciona productos con órdenes (usa transacción de DB):
- **Endpoint documentado**:
  - POST `/api/orders` - Crear orden desde carrito (convierte ProductCart en ProductOrder)

## 🛠️ Agregar Documentación a Nuevos Endpoints

Para documentar un nuevo endpoint:

1. **Agrega el comentario JSDoc** antes de la función del controlador:

```typescript
/**
 * @swagger
 * /api/ruta:
 *   metodo:
 *     summary: Descripción breve
 *     description: Descripción detallada
 *     tags: [NombreTag]
 *     security:
 *       - bearerAuth: []  # Si requiere autenticación
 *     parameters:
 *       - in: path/query
 *         name: nombreParametro
 *         required: true/false
 *         schema:
 *           type: tipo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EsquemaExistente'
 *             # O definir inline
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *       400:
 *         description: Error de validación
 */
export const tuFuncion = async (req: Request, res: Response) => {
  // Tu código
};
```

2. **Reinicia el servidor** para que los cambios se reflejen

3. **Verifica en Swagger UI** que el endpoint aparezca correctamente

## 📖 Referencias

- [OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)

## ⚙️ Configuración Adicional

### Cambiar el Puerto

Si cambias el puerto del servidor, actualiza la URL en `swagger.ts`:

```typescript
servers: [
  {
    url: 'http://localhost:NUEVO_PUERTO',
    description: 'Servidor de desarrollo'
  }
]
```

### Personalizar Swagger UI

Puedes personalizar la apariencia en `swagger.ts`:

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'MarketPlace API Docs',
  customfavIcon: '/path/to/favicon.ico'
}));
```

## 🧪 Testing con Swagger

Swagger UI permite probar todos los endpoints directamente desde el navegador:

1. Selecciona un endpoint
2. Haz clic en "Try it out"
3. Ingresa los parámetros requeridos
4. Haz clic en "Execute"
5. Ve la respuesta en tiempo real

## 🚧 Trabajo Futuro

Para completar la documentación:

- [ ] Documentar controladores de Clients
- [ ] Documentar controladores de Sellers
- [ ] Documentar controladores de Admins
- [ ] Documentar controladores de Categories
- [ ] Documentar controladores de SubCategories
- [ ] Documentar controladores de Payment Methods
- [ ] Documentar controladores de Deliveries
- [ ] Documentar controladores de Inventory
- [ ] Agregar ejemplos de respuesta más detallados
- [ ] Agregar validaciones de esquema más específicas
