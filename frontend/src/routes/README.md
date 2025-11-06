# 🗺️ Carpeta `src/routes/`

## ¿Qué va aquí?

Esta carpeta contiene la **configuración de rutas de navegación** de tu aplicación usando React Router. Define qué componente se muestra en cada URL.

## ¿Por qué es necesaria?

Sin esta carpeta:
- Tu app sería de **una sola página** sin navegación
- No podrías tener URLs como `/products`, `/cart`, `/orders`
- **No habría navegación** entre diferentes vistas
- Imposible compartir links a productos específicos
- No podrías proteger rutas (login requerido)
- **Sin historial de navegación** (botón atrás no funcionaría)

## ¿Qué archivos debería tener?

### 1. **`index.tsx`** - Configuración principal de rutas

Este es el archivo principal que define TODAS las rutas de tu marketplace.

**Qué contiene:**
- Importación de `BrowserRouter`, `Routes`, `Route` de react-router-dom
- Configuración de todas las rutas públicas y privadas
- Componente `AppRoutes` que envuelve toda la configuración
- Layout principal que se mantiene en todas las páginas

**Rutas que debe definir:**

**Rutas públicas (sin login requerido):**
- `/` - Página principal (Index)
- `/login` - Formulario de login
- `/register` - Formulario de registro
- `/register/seller` - Registro específico para vendedores
- `/products` - Lista de todos los productos
- `/products/:id` - Detalle de un producto específico
- `/categories` - Lista de categorías
- `/category/:id` - Productos de una categoría
- `/search?q=query` - Búsqueda de productos
- `/seller/:id` - Perfil público de un vendedor

**Rutas privadas (requieren login como Cliente):**
- `/cart` - Carrito de compras
- `/checkout` - Proceso de compra
- `/orders` - Lista de mis órdenes
- `/orders/:id` - Detalle de una orden
- `/profile` - Perfil del usuario
- `/profile/edit` - Editar perfil
- `/notifications` - Lista de notificaciones

**Rutas privadas (requieren login como Vendedor):**
- `/seller/dashboard` - Dashboard del vendedor
- `/seller/products` - Mis productos como vendedor
- `/seller/products/new` - Crear nuevo producto
- `/seller/products/:id/edit` - Editar producto
- `/seller/orders` - Órdenes recibidas
- `/seller/inventory` - Gestión de inventario
- `/seller/analytics` - Estadísticas de ventas

**Rutas privadas (requieren login como Admin):**
- `/admin/dashboard` - Dashboard del administrador
- `/admin/users` - Gestión de usuarios
- `/admin/categories` - Gestión de categorías
- `/admin/products` - Moderación de productos
- `/admin/orders` - Todas las órdenes
- `/admin/reports` - Acceso a reportes

**Ruta 404:**
- `*` - Página no encontrada (cualquier URL no definida)

**Por qué es importante:**
- Es el **mapa de navegación** de toda tu aplicación
- Define qué páginas existen y quién puede acceder
- Maneja la protección de rutas por rol
- Centraliza la estructura de URLs

### 2. **`PrivateRoute.tsx`** - Componente para proteger rutas

Este componente envuelve rutas que requieren autenticación.

**Qué hace:**
- Verifica si el usuario está autenticado (tiene token válido)
- Si SÍ está autenticado: Muestra el componente solicitado
- Si NO está autenticado: Redirige a `/login`
- Guarda la URL original para redirigir después del login

**Por qué es importante:**
- Evita que usuarios no autenticados accedan a páginas protegidas
- Redirige automáticamente al login
- Mejora la seguridad del frontend
- Experiencia de usuario fluida (regresa a donde quería ir)

### 3. **`RoleRoute.tsx`** - Componente para proteger rutas por rol

Este componente verifica el rol del usuario (cliente, vendedor, admin).

**Qué hace:**
- Verifica que el usuario tenga el rol requerido
- Si SÍ tiene el rol: Muestra el componente
- Si NO tiene el rol: Redirige a página de error 403 (No autorizado)

**Casos de uso:**
- Solo vendedores pueden acceder a `/seller/dashboard`
- Solo administradores pueden acceder a `/admin/*`
- Solo clientes pueden hacer checkout

**Por qué es importante:**
- Control de acceso por tipo de usuario
- Previene accesos no autorizados
- Separa funcionalidades por rol
- Seguridad adicional en el frontend

### 4. **`RouteGuard.tsx`** - Validaciones adicionales antes de entrar a una ruta

Este componente hace validaciones más complejas antes de permitir acceso.

**Qué puede validar:**
- Usuario completó su perfil antes de comprar
- Vendedor verificó su negocio antes de vender
- Términos y condiciones aceptados
- Email verificado
- Información de pago configurada (para checkout)

**Por qué podría ser útil:**
- Prevenir errores en flujos incompletos
- Guiar al usuario a completar pasos necesarios
- Mejor experiencia de usuario

### 5. **`layouts/`** - Subcarpeta con layouts compartidos (opcional)

Podrías mover tus layouts aquí si quieres organizar mejor:

**Layouts que podrías tener:**
- `PublicLayout.tsx` - Layout para páginas públicas (con Navbar público)
- `ClientLayout.tsx` - Layout para clientes (con Navbar de cliente)
- `SellerLayout.tsx` - Layout para vendedores (con Sidebar de vendedor)
- `AdminLayout.tsx` - Layout para admin (con Sidebar de admin)

**Por qué es útil:**
- Cada tipo de usuario tiene su propia navegación
- Evita repetir Navbar/Footer en cada página
- Cambiar layout según el rol del usuario

## Conceptos importantes de React Router

### 1. **Rutas dinámicas**
- `/products/:id` - El `:id` es un parámetro dinámico
- Se accede con `useParams()` hook: `const { id } = useParams()`
- Permite URLs como `/products/123`, `/products/456`

### 2. **Query parameters**
- `/search?q=laptop&category=electronics`
- Se accede con `useSearchParams()` hook
- Útil para filtros, búsquedas, paginación

### 3. **Navegación programática**
- `const navigate = useNavigate()`
- `navigate('/cart')` - Navega a otra ruta desde código
- `navigate(-1)` - Vuelve a la página anterior
- Útil después de acciones (login exitoso, producto agregado)

### 4. **Nested routes (rutas anidadas)**
- Rutas dentro de rutas
- Ejemplo: `/admin` tiene subrutas `/admin/users`, `/admin/products`
- Se renderizan con `<Outlet />` en el componente padre

### 5. **Redirects**
- `<Navigate to="/login" />` - Redirige a otra ruta
- Útil para rutas protegidas o URLs antiguas

## Ejemplo de flujo de navegación

```
Usuario visita: /products/123
      ↓
React Router detecta ruta: /products/:id
      ↓
Extrae parámetro: id = 123
      ↓
Renderiza componente: <ProductDetail />
      ↓
ProductDetail usa useParams() para obtener id
      ↓
Llama a api/products.ts → getProductById(123)
      ↓
Muestra el producto en la UI
```

## Protección de rutas - Ejemplo de flujo

```
Usuario sin login intenta acceder: /cart
      ↓
<PrivateRoute> verifica token
      ↓
No hay token → Redirige a /login?redirect=/cart
      ↓
Usuario hace login exitoso
      ↓
AuthContext guarda token
      ↓
Redirige automáticamente a /cart
```

## Cómo se usará desde otros archivos

### Desde componentes:
```
import { Link, useNavigate } from 'react-router-dom';

// Con Link (para navegación declarativa)
<Link to="/products">Ver productos</Link>
<Link to={`/products/${product.id}`}>Ver detalle</Link>

// Con navigate (para navegación programática)
const navigate = useNavigate();
onClick={() => navigate('/cart')}
```

### Desde `main.tsx`:
```
import AppRoutes from './routes';

ReactDOM.render(
  <AppRoutes />
)
```

## Beneficios de tener esta carpeta

✅ **Navegación SPA**: Cambia de página sin recargar todo  
✅ **URLs amigables**: Productos con IDs, categorías, búsquedas  
✅ **Protección**: Rutas privadas por autenticación y rol  
✅ **Compartible**: Links directos a productos/órdenes  
✅ **Historial**: Botón atrás funciona correctamente  
✅ **SEO**: URLs semánticas y limpias  
✅ **Organización**: Toda la navegación en un lugar  

## Relación con otras carpetas

- **Importa de**: `src/pages/` (los componentes de cada página)
- **Importa de**: `src/layouts/` (layouts compartidos)
- **Usa**: `src/context/AuthContext` (verificar autenticación)
- **Usa**: `src/config/routes.ts` (constantes de rutas)
- **Usada por**: `src/main.tsx` (punto de entrada)

## Dependencia requerida

Para que esta carpeta funcione, necesitas instalar React Router:

```bash
npm install react-router-dom
```

Versión recomendada: 6.x (la más reciente)

## Notas importantes

- **Siempre usar** `<Link>` en lugar de `<a>` para navegación interna (evita recarga completa)
- **Proteger rutas sensibles** con PrivateRoute y RoleRoute
- **Definir rutas de más específica a más general** (orden importa)
- **Usar lazy loading** para páginas grandes (mejora performance)
- **Guardar redirect** para regresar después del login
- **Rutas 404** siempre al final con `path="*"`
- **Validar tokens** antes de mostrar rutas protegidas
- **Layouts compartidos** para no repetir Navbar/Footer
