# 🎨 Frontend - MarketPlace Espigón Manta

## 📋 Descripción General

El **frontend** del MarketPlace Espigón Manta es una aplicación web moderna desarrollada con **React 18 y TypeScript**, utilizando **Vite** como bundler y **TailwindCSS** para el diseño. Proporciona una interfaz de usuario intuitiva y responsiva para clientes, vendedores y administradores del marketplace.

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico Principal

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 18.3.1 | Librería UI principal |
| **TypeScript** | 5.x | Tipado estático |
| **Vite** | Latest | Build tool y dev server |
| **TailwindCSS** | 3.x | Framework CSS utility-first |
| **React Router** | 6.30.1 | Enrutamiento SPA |
| **Apollo Client** | 3.10.8 | Cliente GraphQL |
| **Axios** | 1.13.2 | Cliente HTTP REST |
| **React Query** | 5.83.0 | Gestión de estado del servidor |
| **React Hook Form** | 7.61.1 | Gestión de formularios |
| **Zod** | 3.25.76 | Validación de schemas |

### UI Components y Design System

| Librería | Propósito |
|----------|-----------|
| **Shadcn/ui** | Componentes UI base (Radix UI) |
| **Lucide React** | Iconos (462+ iconos) |
| **Recharts** | Gráficos y visualizaciones |
| **Sonner** | Notificaciones toast |
| **Next Themes** | Gestión de temas (light/dark) |
| **Embla Carousel** | Carruseles de imágenes |

### Herramientas de Generación de PDFs

| Librería | Propósito |
|----------|-----------|
| **jsPDF** | 3.0.3 | Generación de PDFs |
| **jsPDF AutoTable** | 5.0.2 | Tablas en PDFs |

## 📂 Estructura del Proyecto

```
frontend/
├── src/
│   ├── main.tsx              # Punto de entrada
│   ├── api/                  # Capa de comunicación con backend
│   │   ├── client.ts         # Cliente Axios configurado
│   │   ├── admins.ts         # API de admins
│   │   ├── auth.ts           # API de autenticación
│   │   ├── cart.ts           # API de carrito
│   │   ├── categories.ts     # API de categorías
│   │   ├── clients.ts        # API de clientes
│   │   ├── deliveries.ts     # API de entregas
│   │   ├── inventories.ts    # API de inventarios
│   │   ├── orders.ts         # API de pedidos
│   │   ├── paymentMethods.ts # API de métodos de pago
│   │   ├── products.ts       # API de productos
│   │   ├── sellers.ts        # API de vendedores
│   │   ├── statistics.ts     # API de estadísticas
│   │   ├── subcategories.ts  # API de subcategorías
│   │   └── upload.ts         # API de carga de archivos
│   │
│   ├── components/           # Componentes reutilizables
│   │   ├── Navbar.tsx        # Barra de navegación
│   │   ├── Hero.tsx          # Banner principal
│   │   ├── FeaturedProducts.tsx # Productos destacados
│   │   ├── Categories.tsx    # Sección de categorías
│   │   ├── Features.tsx      # Características del marketplace
│   │   ├── CallToAction.tsx  # Llamada a la acción
│   │   ├── CartDrawer.tsx    # Drawer del carrito
│   │   ├── ProductRating.tsx # Sistema de ratings
│   │   ├── ReviewDialog.tsx  # Diálogo de reseñas
│   │   ├── ProtectedRoute.tsx # Rutas protegidas
│   │   ├── SellerAnalytics.tsx # Analytics para vendedores
│   │   ├── SellerPaymentVerification.tsx # Verificación de pagos
│   │   └── ui/              # Componentes Shadcn/ui (30+)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── tabs.tsx
│   │       ├── toast.tsx
│   │       └── ... (25+ componentes más)
│   │
│   ├── pages/               # Páginas de la aplicación
│   │   ├── Index.tsx        # Página principal
│   │   ├── Login.tsx        # Login multi-rol
│   │   ├── Register.tsx     # Registro de clientes
│   │   ├── RegisterSeller.tsx # Registro de vendedores
│   │   ├── ForgotPassword.tsx # Recuperar contraseña
│   │   ├── ResetPassword.tsx # Restablecer contraseña
│   │   ├── Profile.tsx      # Perfil de usuario
│   │   ├── Products.tsx     # Listado de productos
│   │   ├── ProductDetail.tsx # Detalle de producto
│   │   ├── ProductForm.tsx  # Formulario de producto (vendedor)
│   │   ├── Orders.tsx       # Pedidos del cliente
│   │   ├── OrderDetail.tsx  # Detalle de pedido
│   │   ├── OrderSuccess.tsx # Confirmación de pedido
│   │   ├── Checkout.tsx     # Proceso de compra
│   │   ├── SellerDashboard.tsx # Dashboard vendedor
│   │   ├── SellerProducts.tsx # Productos del vendedor
│   │   ├── SellerOrderDetail.tsx # Detalle pedido (vendedor)
│   │   ├── Entrepreneurs.tsx # Página de emprendedores
│   │   ├── Settings.tsx     # Configuración
│   │   ├── NotFound.tsx     # 404
│   │   └── admin/          # Páginas de administración
│   │       ├── Dashboard.tsx
│   │       ├── Users.tsx
│   │       ├── ProductsManagement.tsx
│   │       └── Reports.tsx
│   │
│   ├── context/            # Contextos de React
│   │   ├── AuthContext.tsx # Estado de autenticación
│   │   ├── CartContext.tsx # Estado del carrito
│   │   └── ThemeContext.tsx # Tema (light/dark)
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts      # Hook de autenticación
│   │   ├── useCart.ts      # Hook del carrito
│   │   ├── useProducts.ts  # Hook de productos
│   │   ├── useOrders.ts    # Hook de pedidos
│   │   └── useWebSocket.ts # Hook para WebSocket
│   │
│   ├── graphql/            # Queries y mutations GraphQL
│   │   ├── queries/       # Queries de reportes
│   │   │   ├── dashboard.ts
│   │   │   ├── sales.ts
│   │   │   ├── sellers.ts
│   │   │   └── products.ts
│   │   └── client.ts      # Cliente Apollo configurado
│   │
│   ├── layouts/            # Layouts de la aplicación
│   │   ├── MainLayout.tsx  # Layout principal
│   │   ├── AdminLayout.tsx # Layout admin
│   │   └── SellerLayout.tsx # Layout vendedor
│   │
│   ├── lib/               # Utilidades y configuraciones
│   │   └── utils.ts       # Funciones helper (cn, formatters)
│   │
│   ├── routes/            # Configuración de rutas
│   │   └── index.tsx      # Router principal
│   │
│   ├── styles/            # Estilos globales
│   │   └── globals.css    # Tailwind + estilos custom
│   │
│   ├── types/             # Tipos TypeScript
│   │   ├── auth.ts       # Tipos de autenticación
│   │   ├── product.ts    # Tipos de productos
│   │   ├── order.ts      # Tipos de pedidos
│   │   ├── cart.ts       # Tipos de carrito
│   │   └── user.ts       # Tipos de usuarios
│   │
│   ├── utils/             # Funciones utilitarias
│   │   ├── formatters.ts  # Formato de moneda, fechas
│   │   ├── validators.ts  # Validaciones custom
│   │   └── storage.ts     # LocalStorage helpers
│   │
│   └── config/            # Configuración
│       ├── env.ts         # Variables de entorno
│       └── constants.ts   # Constantes globales
│
├── public/                # Archivos estáticos
│   ├── robots.txt
│   └── assets/           # Imágenes, iconos
│
├── components.json        # Configuración Shadcn/ui
├── tailwind.config.ts     # Configuración TailwindCSS
├── vite.config.ts         # Configuración Vite
├── tsconfig.json          # Configuración TypeScript
├── package.json           # Dependencias
└── README.md             # Este archivo
```

## 🎯 Características Implementadas

### 🔐 Autenticación y Autorización

**Páginas:**
- ✅ **Login multi-rol** (Cliente/Vendedor/Admin)
- ✅ **Registro de clientes**
- ✅ **Registro de vendedores**
- ✅ **Recuperación de contraseña**
- ✅ **Restablecimiento de contraseña**
- ✅ **Perfil de usuario** con edición

**Características:**
- JWT almacenado en localStorage
- Refresh token automático
- Rutas protegidas por rol
- Persistencia de sesión
- Logout automático al expirar token

### 🛍️ Catálogo de Productos

**Páginas:**
- ✅ **Listado de productos** con filtros avanzados
- ✅ **Detalle de producto** completo
- ✅ **Búsqueda en tiempo real**
- ✅ **Productos destacados** en home

**Funcionalidades de listado:**
- Búsqueda por nombre/descripción
- Filtro por categoría (dropdown)
- Filtro por rango de precio (slider)
- Ordenamiento (precio, nombre, fecha)
- Vista grid/lista
- Paginación (12 productos por página)
- Loading states

**Detalle de producto:**
- Galería de imágenes
- Información completa
- Selector de cantidad
- Agregar al carrito
- Botones favorito y compartir
- Tabs: Detalles / Vendedor / Reseñas
- Breadcrumb de navegación
- Información del vendedor
- Reviews de clientes

### 🛒 Carrito de Compras

**Componente:** `CartDrawer.tsx`

**Funcionalidades:**
- ✅ Agregar/quitar productos
- ✅ Actualizar cantidades
- ✅ Cálculo automático de totales
- ✅ Persistencia en localStorage
- ✅ Sincronización con backend
- ✅ Validación de stock
- ✅ Animaciones fluidas
- ✅ Badge con cantidad en navbar

### 📦 Gestión de Pedidos

**Cliente:**
- ✅ **Listado de pedidos** con estados
- ✅ **Detalle de pedido** completo
- ✅ **Tracking de pedido**
- ✅ **Confirmación de compra**
- ✅ **Proceso de checkout**

**Vendedor:**
- ✅ **Dashboard de pedidos**
- ✅ **Gestión de estados**
- ✅ **Detalle de pedido vendedor**
- ✅ **Estadísticas de ventas**

### 👤 Perfiles de Usuario

**Todos los roles:**
- ✅ Edición de datos personales
- ✅ Cambio de contraseña
- ✅ Foto de perfil
- ✅ Configuración de cuenta

**Vendedor:**
- ✅ Información del negocio
- ✅ Datos de contacto
- ✅ Ubicación
- ✅ Horarios

### 📊 Panel de Vendedor

**Dashboard:**
- ✅ Estadísticas de ventas
- ✅ Gráficos con Recharts
- ✅ Productos más vendidos
- ✅ Pedidos recientes
- ✅ Ingresos del mes
- ✅ Analytics completo

**Gestión de Productos:**
- ✅ Listado de productos propios
- ✅ Crear nuevo producto
- ✅ Editar producto
- ✅ Eliminar producto
- ✅ Control de inventario
- ✅ Carga de imágenes

### 👑 Panel de Administración

**Dashboard:**
- ✅ Estadísticas generales
- ✅ Reportes de ventas
- ✅ Gráficos de rendimiento
- ✅ KPIs del negocio

**Gestión:**
- ✅ Gestión de usuarios (clientes/vendedores)
- ✅ Aprobación de productos
- ✅ Gestión de categorías
- ✅ Reportes avanzados (GraphQL)

### 📈 Sistema de Reportes (GraphQL)

**Queries implementadas:**
- ✅ Dashboard stats
- ✅ Sales report
- ✅ Top sellers
- ✅ Best products
- ✅ Category sales
- ✅ Clients report
- ✅ Inventory alerts

**Cliente Apollo configurado:**
- Conexión a Report Service (port 4000)
- Cache optimizado
- Error handling
- Loading states

### 🌐 Tiempo Real (WebSocket)

**Funcionalidades:**
- ✅ Notificaciones en tiempo real
- ✅ Actualizaciones de pedidos
- ✅ Alertas de inventario
- ✅ Reconexión automática
- ✅ Autenticación JWT

**Hook:** `useWebSocket.ts`

## 🎨 Sistema de Diseño

### TailwindCSS + Shadcn/ui

**Configuración:**
- Tema personalizado para Manta
- Modo oscuro/claro
- Colores de marca
- Tipografía optimizada
- Espaciado consistente

**Componentes UI (30+):**

| Componente | Uso |
|------------|-----|
| Button | Botones con variantes |
| Card | Tarjetas de contenido |
| Dialog | Modales y diálogos |
| Dropdown Menu | Menús desplegables |
| Form | Formularios con validación |
| Input | Campos de texto |
| Select | Selectores |
| Tabs | Pestañas |
| Toast | Notificaciones |
| Alert | Alertas |
| Badge | Badges y etiquetas |
| Avatar | Avatares de usuario |
| Carousel | Carruseles |
| Checkbox | Checkboxes |
| Progress | Barras de progreso |
| Radio Group | Grupos de radio buttons |
| Slider | Sliders de rango |
| Switch | Interruptores |
| Table | Tablas de datos |
| Tooltip | Tooltips |
| ... y más |

### Responsive Design

- ✅ Mobile-first approach
- ✅ Breakpoints TailwindCSS
- ✅ Touch-friendly en móviles
- ✅ Navegación adaptativa
- ✅ Imágenes responsive

### Accesibilidad

- ✅ Componentes Radix UI (accesibles por defecto)
- ✅ ARIA labels
- ✅ Navegación por teclado
- ✅ Focus visible
- ✅ Contraste de colores

## 🔌 Integración con Backend

### REST API (Axios)

**Cliente configurado:** `src/api/client.ts`

```typescript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

**Módulos de API:**

Cada módulo expone funciones tipadas:

```typescript
// src/api/products.ts
export const getProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get('/api/products');
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await apiClient.get(`/api/products/${id}`);
  return response.data;
};

export const createProduct = async (data: CreateProductDto): Promise<Product> => {
  const response = await apiClient.post('/api/products', data);
  return response.data;
};
```

### GraphQL API (Apollo Client)

**Cliente configurado:** `src/graphql/client.ts`

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const client = new ApolloClient({
  link: new HttpLink({
    uri: import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql',
  }),
  cache: new InMemoryCache(),
});
```

**Queries de ejemplo:**

```typescript
// src/graphql/queries/dashboard.ts
import { gql } from '@apollo/client';

export const DASHBOARD_STATS = gql`
  query {
    dashboard_stats {
      sales_today
      orders_today
      active_clients
      active_sellers
      total_products
    }
  }
`;

// Uso en componente
const { data, loading, error } = useQuery(DASHBOARD_STATS);
```

### WebSocket (Tiempo Real)

**Hook custom:** `src/hooks/useWebSocket.ts`

```typescript
export const useWebSocket = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const socket = new WebSocket(
      `ws://localhost:8080/ws?token=${token}`
    );

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleRealtimeEvent(message);
    };

    setWs(socket);

    return () => socket.close();
  }, [token]);

  return { ws, isConnected: ws?.readyState === WebSocket.OPEN };
};
```

## 🚀 Despliegue y Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
# Backend URLs
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:8080

# Supabase (si se usa directamente)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App
VITE_APP_NAME=MarketPlace Espigón Manta
VITE_APP_URL=http://localhost:8080
```

### Instalación

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

### Build Optimizado

```bash
# Build con optimizaciones
npm run build

# Output en /dist
# - Minificación
# - Tree shaking
# - Code splitting
# - Asset optimization
```

### Despliegue

**Vite genera build estático, deployable en:**

- **Vercel** (recomendado)
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**
- **S3 + CloudFront**
- Servidor web estático (Nginx, Apache)

**Configuración Nginx:**

```nginx
server {
    listen 80;
    server_name marketplace.manta.com;
    root /var/www/marketplace/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
    }

    location /graphql {
        proxy_pass http://localhost:4000;
    }

    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```



## 🎯 Rutas de la Aplicación

### Públicas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | Index | Página principal |
| `/login` | Login | Login multi-rol |
| `/register` | Register | Registro clientes |
| `/register-seller` | RegisterSeller | Registro vendedores |
| `/forgot-password` | ForgotPassword | Recuperar contraseña |
| `/reset-password` | ResetPassword | Restablecer contraseña |
| `/products` | Products | Listado de productos |
| `/products/:id` | ProductDetail | Detalle de producto |
| `/entrepreneurs` | Entrepreneurs | Emprendedores |

### Protegidas - Cliente

| Ruta | Componente | Rol | Descripción |
|------|------------|-----|-------------|
| `/profile` | Profile | client | Perfil |
| `/orders` | Orders | client | Mis pedidos |
| `/orders/:id` | OrderDetail | client | Detalle pedido |
| `/checkout` | Checkout | client | Checkout |
| `/order-success` | OrderSuccess | client | Confirmación |
| `/settings` | Settings | client | Configuración |

### Protegidas - Vendedor

| Ruta | Componente | Rol | Descripción |
|------|------------|-----|-------------|
| `/seller/dashboard` | SellerDashboard | seller | Dashboard |
| `/seller/products` | SellerProducts | seller | Mis productos |
| `/seller/products/new` | ProductForm | seller | Nuevo producto |
| `/seller/products/:id/edit` | ProductForm | seller | Editar producto |
| `/seller/orders/:id` | SellerOrderDetail | seller | Detalle pedido |
| `/seller/analytics` | SellerAnalytics | seller | Analytics |

### Protegidas - Admin

| Ruta | Componente | Rol | Descripción |
|------|------------|-----|-------------|
| `/admin/dashboard` | Dashboard | admin | Dashboard admin |
| `/admin/users` | Users | admin | Gestión usuarios |
| `/admin/products` | ProductsManagement | admin | Gestión productos |
| `/admin/reports` | Reports | admin | Reportes |

## 📱 Características UX/UI

### Feedback Visual

- ✅ **Loading states** en todas las peticiones
- ✅ **Skeleton loaders** para contenido
- ✅ **Toasts** para notificaciones
- ✅ **Confirmaciones** en acciones críticas
- ✅ **Validación en tiempo real** en formularios
- ✅ **Animaciones fluidas** (Tailwind + Framer Motion)

### Optimizaciones

- ✅ **Lazy loading** de rutas
- ✅ **Code splitting** automático (Vite)
- ✅ **Imágenes optimizadas** (lazy, webp)
- ✅ **Caché de queries** (React Query + Apollo)
- ✅ **Debounce** en búsquedas
- ✅ **Paginación** en listados grandes

### Persistencia

- ✅ **LocalStorage** para carrito y sesión
- ✅ **SessionStorage** para datos temporales
- ✅ **Cache API** para assets (futuro)

## 🐛 Manejo de Errores

### Estrategias Implementadas

1. **Interceptores de Axios**
```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

2. **Error Boundaries de React**
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

3. **Try/Catch en operaciones async**
```typescript
try {
  await createOrder(orderData);
  toast.success('Pedido creado exitosamente');
} catch (error) {
  toast.error('Error al crear pedido');
  console.error(error);
}
```
