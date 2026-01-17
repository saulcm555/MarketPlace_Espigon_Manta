# 🔧 REST Service - Servicio API Principal

## 📋 Descripción General

El **REST Service** es el **microservicio principal del backend**, desarrollado en **Node.js con TypeScript** siguiendo los principios de **Clean Architecture**. Este servicio maneja toda la lógica de negocio central, gestiona la base de datos PostgreSQL con TypeORM, y expone una API REST completa documentada con Swagger.

## 🎯 Propósito y Funcionalidad

Este servicio es el **núcleo del sistema** y tiene como objetivo:

- ✅ **Gestionar toda la lógica de negocio** del marketplace
- ✅ **Exponer API REST completa** para el frontend
- ✅ **Manejar autenticación y autorización** con JWT
- ✅ **Gestionar base de datos** PostgreSQL con TypeORM
- ✅ **Procesar pagos y transferencias** entre vendedores
- ✅ **Sistema de inventario y productos** con validaciones
- ✅ **Gestión de pedidos y entregas**
- ✅ **Carga de archivos** a Supabase Storage
- ✅ **Tareas programadas** (cron jobs)
- ✅ **Sistema de limpieza automática** de datos obsoletos
- ✅ **Notificaciones en tiempo real** vía Realtime Service

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Node.js** | 18+ | Runtime JavaScript |
| **TypeScript** | 5.9.2 | Lenguaje tipado |
| **Express** | 5.1.0 | Framework web |
| **TypeORM** | Latest | ORM para PostgreSQL |
| **PostgreSQL** | 14+ | Base de datos relacional |
| **JWT** | 9.0.2 | Autenticación |
| **Bcrypt** | 6.0.0 | Hash de contraseñas |
| **Multer** | 2.0.2 | Upload de archivos |
| **Supabase** | 2.80.0 | Storage de archivos |
| **Redis** | 5.9.0 | Caché y sesiones |
| **Swagger** | Latest | Documentación API |
| **Node-Cron** | 4.2.1 | Tareas programadas |
| **Class Validator** | 0.14.2 | Validación de DTOs |

### Clean Architecture

El proyecto sigue **Clean Architecture** con separación clara de responsabilidades:

```
rest_service/
├── src/
│   ├── domain/              # Capa de Dominio (Entidades)
│   │   ├── entities/        # 13 entidades TypeORM
│   │   ├── repositories/    # Interfaces de repositorios
│   │   └── services/        # Interfaces de servicios
│   │
│   ├── application/         # Capa de Aplicación (Casos de Uso)
│   │   ├── dtos/           # Data Transfer Objects
│   │   └── use-cases/      # Lógica de negocio
│   │
│   ├── infrastructure/      # Capa de Infraestructura
│   │   ├── database/       # Configuración TypeORM
│   │   ├── repositories/   # Implementaciones de repositorios
│   │   ├── http/          # Controladores Express
│   │   ├── middlewares/   # Middlewares (auth, validation)
│   │   ├── storage/       # Supabase Storage
│   │   ├── jobs/          # Cron jobs
│   │   └── config/        # Configuración
│   │
│   ├── main/               # Punto de entrada
│   │   └── main.ts        # Inicializa servidor
│   │
│   ├── app/               # Seeding y migraciones
│   │   └── app.ts         # Script de seed
│   │
│   └── tests/             # Tests unitarios e integración
│
├── config/                # Archivos de configuración
├── swagger/               # Documentación Swagger
└── readmes/               # Documentación adicional
```

## 📂 Estructura Detallada

### 📁 `/src/domain` - Capa de Dominio

**Propósito:** Contiene las reglas de negocio puras y entidades del dominio.

#### `/entities` - 13 Entidades TypeORM

| Entidad | Descripción | Relaciones |
|---------|-------------|------------|
| `Admin` | Administradores del sistema | - |
| `Client` | Clientes compradores | → Orders, Carts |
| `Seller` | Vendedores | → Products, Inventories |
| `Category` | Categorías principales | → SubCategories |
| `SubCategory` | Subcategorías | → Category, Products |
| `Product` | Productos del catálogo | → Seller, SubCategories, Inventories |
| `Inventory` | Control de stock | → Product |
| `Cart` | Carritos de compra | → Client, ProductCarts |
| `ProductCart` | Productos en carrito | → Cart, Product |
| `Order` | Pedidos realizados | → Client, ProductOrders, Delivery |
| `ProductOrder` | Productos en pedido | → Order, Product |
| `Delivery` | Entregas | → Order |
| `PaymentMethod` | Métodos de pago | → Orders |

**Características de las entidades:**
- Decoradores TypeORM (`@Entity`, `@Column`, `@ManyToOne`, etc.)
- Validaciones con `class-validator`
- Relaciones bidireccionales
- Timestamps automáticos (`created_at`, `updated_at`)
- Soft deletes (`deleted_at`)

**Ejemplo:**
```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsNotEmpty()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Seller)
  @JoinColumn({ name: 'seller_id' })
  seller: Seller;

  @OneToMany(() => Inventory, inventory => inventory.product)
  inventories: Inventory[];
}
```

#### `/repositories` - Interfaces de Repositorios

Define contratos para acceso a datos:

```typescript
export interface IProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product>;
  delete(id: string): Promise<void>;
}
```

#### `/services` - Interfaces de Servicios

Define contratos para lógica de negocio:

```typescript
export interface IOrderService {
  createOrder(dto: CreateOrderDto): Promise<Order>;
  processPayment(orderId: string): Promise<void>;
  updateStatus(orderId: string, status: OrderStatus): Promise<Order>;
}
```

### 📁 `/src/application` - Capa de Aplicación

**Propósito:** Implementa los casos de uso del sistema.

#### `/dtos` - Data Transfer Objects (28 archivos)

**Módulos de DTOs:**

| Módulo | DTOs | Descripción |
|--------|------|-------------|
| `clients` | Login, Register, UpdateProfile, types | Gestión de clientes |
| `admins` | Login, ManageProducts, ManageUsers | Panel administrativo |
| `sellers` | Register, UpdateProfile, SellerStats | Gestión de vendedores |
| `products` | Create, Update, Search, Filter | Gestión de productos |
| `categories` | Create, Update | Gestión de categorías |
| `orders` | Create, Update, Track | Gestión de pedidos |
| `cart` | AddItem, UpdateQuantity, Checkout | Carrito de compras |
| `payments` | ProcessPayment, Transfer | Pagos y transferencias |
| `inventory` | Create, Update, Alert | Control de inventario |

**Características:**
- Validación con `class-validator`
- Transformación con `class-transformer`
- Tipado fuerte TypeScript
- Documentación inline

**Ejemplo:**
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  description: string;

  @IsUUID()
  sellerId: string;

  @IsUUID()
  categoryId: string;
}
```

#### `/use-cases` - Casos de Uso (27 archivos)

**Módulos de casos de uso:**

| Módulo | Casos de Uso | Descripción |
|--------|--------------|-------------|
| `clients` | LoginClient, RegisterClient, UpdateProfile | Autenticación y perfil |
| `admins` | LoginAdmin, ApproveProduct, ManageUsers | Funciones admin |
| `sellers` | RegisterSeller, UpdateProducts, ViewStats | Funciones vendedor |
| `products` | CreateProduct, UpdateProduct, SearchProducts | CRUD productos |
| `orders` | CreateOrder, UpdateStatus, TrackOrder | Gestión de pedidos |
| `cart` | AddToCart, UpdateCart, Checkout | Carrito de compras |
| `payments` | ProcessPayment, TransferToSeller | Sistema de pagos |
| `inventory` | UpdateStock, CheckAvailability, Alerts | Control de inventario |

**Ejemplo:**
```typescript
export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private cartRepository: ICartRepository,
    private inventoryService: IInventoryService
  ) {}

  async execute(dto: CreateOrderDto): Promise<Order> {
    // 1. Validar carrito
    const cart = await this.cartRepository.findById(dto.cartId);
    if (!cart) throw new Error('Cart not found');

    // 2. Verificar inventario
    await this.inventoryService.checkAvailability(cart.items);

    // 3. Crear orden
    const order = await this.orderRepository.create({
      clientId: dto.clientId,
      items: cart.items,
      total: this.calculateTotal(cart),
    });

    // 4. Reducir inventario
    await this.inventoryService.reduceStock(cart.items);

    // 5. Limpiar carrito
    await this.cartRepository.clear(dto.cartId);

    return order;
  }
}
```

### 📁 `/src/infrastructure` - Capa de Infraestructura

**Propósito:** Implementa detalles técnicos y conexiones externas.

#### `/database` - Configuración TypeORM

- `data-source.ts`: Configuración de conexión PostgreSQL
- `migrations/`: Migraciones de base de datos
- `seeders/`: Datos iniciales

```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/../domain/entities/*.ts'],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false,
  logging: true,
});
```

#### `/repositories` - Implementaciones de Repositorios

Implementa interfaces del dominio usando TypeORM:

```typescript
export class ProductRepository implements IProductRepository {
  constructor(private repository: Repository<Product>) {}

  async findAll(): Promise<Product[]> {
    return this.repository.find({
      relations: ['seller', 'category', 'inventories']
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['seller', 'category']
    });
  }
}
```

#### `/http` - Controladores Express

**Controllers para cada módulo:**

```typescript
export class ProductController {
  constructor(
    private createProductUseCase: CreateProductUseCase,
    private updateProductUseCase: UpdateProductUseCase
  ) {}

  async create(req: Request, res: Response) {
    try {
      const dto = plainToClass(CreateProductDto, req.body);
      await validate(dto);
      
      const product = await this.createProductUseCase.execute(dto);
      
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

#### `/middlewares` - Middlewares

| Middleware | Propósito |
|------------|-----------|
| `auth.middleware.ts` | Validación JWT |
| `role.middleware.ts` | Control de roles |
| `validation.middleware.ts` | Validación de DTOs |
| `error.middleware.ts` | Manejo global de errores |
| `cors.middleware.ts` | CORS configuración |
| `rate-limit.middleware.ts` | Rate limiting |

**Ejemplo - Auth Middleware:**
```typescript
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

#### `/storage` - Supabase Storage

Gestiona subida de archivos (imágenes de productos, perfiles):

```typescript
export class StorageService {
  private supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  async uploadProductImage(file: Express.Multer.File): Promise<string> {
    const fileName = `products/${Date.now()}-${file.originalname}`;
    
    const { data, error } = await this.supabase.storage
      .from('images')
      .upload(fileName, file.buffer);

    if (error) throw error;
    
    return this.getPublicUrl(data.path);
  }
}
```

#### `/jobs` - Cron Jobs

Tareas programadas ejecutadas periódicamente:

| Job | Frecuencia | Descripción |
|-----|------------|-------------|
| `cleanup-carts.job.ts` | Diario (00:00) | Elimina carritos abandonados >30 días |
| `cleanup-notifications.job.ts` | Diario (01:00) | Elimina notificaciones antiguas |
| `inventory-alerts.job.ts` | Cada hora | Alerta de stock bajo |
| `payment-reminders.job.ts` | Diario (10:00) | Recordatorios de pago pendientes |

```typescript
import cron from 'node-cron';

// Ejecutar diariamente a las 00:00
cron.schedule('0 0 * * *', async () => {
  await cleanupAbandonedCarts();
});
```

#### `/config` - Configuración

- `env.ts`: Variables de entorno
- `swagger.ts`: Configuración Swagger
- `cors.ts`: Orígenes permitidos
- `logger.ts`: Configuración de logs

### 📁 `/src/main` - Punto de Entrada

**`main.ts`**: Inicializa y arranca el servidor

```typescript
async function bootstrap() {
  // 1. Conectar base de datos
  await AppDataSource.initialize();

  // 2. Crear app Express
  const app = express();

  // 3. Middlewares globales
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 4. Rutas
  app.use('/api/products', productRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/clients', clientRoutes);
  // ... más rutas

  // 5. Swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 6. Error handling
  app.use(errorMiddleware);

  // 7. Iniciar servidor
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });
}

bootstrap();
```

## 🔐 Sistema de Autenticación y Autorización

### JWT Authentication

**Flujo:**
1. Cliente envía credenciales (email/password)
2. Servidor valida credenciales con bcrypt
3. Genera token JWT con información del usuario
4. Cliente guarda token y lo envía en cada petición

**Estructura del Token:**
```typescript
{
  userId: 'uuid',
  email: 'user@example.com',
  role: 'client' | 'seller' | 'admin',
  iat: 1234567890,
  exp: 1234599890
}
```

### Control de Roles

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso total, aprobar productos, gestionar usuarios |
| **seller** | Crear/editar productos, ver estadísticas, gestionar inventario |
| **client** | Comprar productos, gestionar perfil, ver pedidos |

### Endpoints Protegidos

```typescript
// Solo admin
router.delete('/products/:id', authMiddleware, roleMiddleware('admin'), deleteProduct);

// Admin o seller
router.put('/products/:id', authMiddleware, roleMiddleware('admin', 'seller'), updateProduct);

// Cualquier usuario autenticado
router.get('/profile', authMiddleware, getProfile);
```

## 📡 API REST Completa

### Endpoints Principales

**Ver documentación completa:** `readmes/API_ENDPOINTS.md`

**Resumen por módulo:**

| Módulo | Endpoints | Métodos |
|--------|-----------|---------|
| Products | 5 | GET, POST, PUT, DELETE |
| Sellers | 5 | GET, POST, PUT, DELETE |
| Clients | 5 | GET, POST, PUT, DELETE |
| Orders | 5 | GET, POST, PUT, DELETE |
| Categories | 5 | GET, POST, PUT, DELETE |
| SubCategories | 5 | GET, POST, PUT, DELETE |
| Inventories | 5 | GET, POST, PUT, DELETE |
| Carts | 5 | GET, POST, PUT, DELETE |
| PaymentMethods | 5 | GET, POST, PUT, DELETE |
| Deliveries | 5 | GET, POST, PUT, DELETE |

**Total:** ~50 endpoints

### Swagger Documentation

Acceder a: `http://localhost:3000/api-docs`

**Características:**
- Documentación interactiva
- Prueba de endpoints en vivo
- Schemas de requests/responses
- Autenticación JWT integrada

## 💳 Sistema de Pagos y Transferencias

**Ver documentación completa:** `readmes/PAYMENT_TRANSFER_DOCUMENTATION.md`

### Flujo de Pago

1. Cliente completa checkout
2. Se crea orden con estado `pending_payment`
3. Cliente procesa pago (integración externa)
4. Orden cambia a `paid`
5. Sistema distribuye fondos a vendedores
6. Se envía notificación a vendedor

### Transferencias a Vendedores

**Lógica implementada:**
- Transferencia automática al confirmar pedido
- Comisión de plataforma (configurable)
- Registro de transacciones
- Validación de cuentas bancarias

## 🗄️ Sistema de Gestión de Datos

### Cleanup System

**Ver documentación:** `readmes/CLEANUP_SYSTEM_DOCUMENTATION.md`

**Tareas de limpieza:**
- Carritos abandonados (>30 días)
- Notificaciones antiguas (>90 días)
- Sesiones expiradas
- Archivos temporales
- Logs antiguos

### Migraciones

```bash
# Crear migración
npm run typeorm migration:create -- -n CreateProductTable

# Ejecutar migraciones
npm run typeorm migration:run

# Revertir migración
npm run typeorm migration:revert
```

### Seeders

```bash
# Ejecutar seed (datos iniciales)
npm run seed
```

**Datos sembrados:**
- 1 Admin de prueba
- 10 Categorías
- 50 Subcategorías
- 5 Vendedores
- 100 Productos
- 20 Clientes

## 🚀 Despliegue y Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=marketplace

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development

# External Services
REALTIME_SERVICE_URL=http://localhost:8080
REPORT_SERVICE_URL=http://localhost:4000

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar migraciones
npm run typeorm migration:run

# Seed de datos
npm run seed

# Modo desarrollo (hot reload)
npm run dev

# Build para producción
npm run build

# Ejecutar producción
npm start
```

### Docker

```bash
# Build imagen
docker build -t rest-service .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env rest-service
```

## 🧪 Testing

**Ver documentación:** `readmes/GUIA_COMPLETA_PRUEBAS.md`

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:coverage

# Tests de integración
npm run test:integration

# Tests E2E
npm run test:e2e
```

## 🔗 Integración con Otros Servicios

### Realtime Service (Go)

Envía notificaciones en tiempo real:

```typescript
await axios.post(`${REALTIME_SERVICE_URL}/api/notifications/send`, {
  userId: seller.id,
  type: 'new_order',
  payload: { orderId: order.id }
});
```

### Report Service (Python/GraphQL)

El Report Service consume datos de este servicio vía HTTP para generar reportes.

### Frontend (React)

El frontend consume esta API REST:

```typescript
// Obtener productos
const products = await api.get('/api/products');

// Crear orden
const order = await api.post('/api/orders', orderData, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 📊 Manejo de Errores

**Ver documentación:** `readmes/ERROR_HANDLING.md`

### Estructura de Errores

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid product data",
    "details": [
      {
        "field": "price",
        "message": "Price must be greater than 0"
      }
    ],
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Códigos de Error

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Error de validación |
| `UNAUTHORIZED` | 401 | No autenticado |
| `FORBIDDEN` | 403 | Sin permisos |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `CONFLICT` | 409 | Conflicto (ej: email duplicado) |
| `INTERNAL_ERROR` | 500 | Error del servidor |

