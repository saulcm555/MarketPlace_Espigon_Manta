# 🎨 Frontend - Marketplace El Espigón

## ✅ Estado Actual de Implementación

### 🔌 **Capa de API Completada**

La capa de comunicación con el backend REST está completamente implementada y lista para usar.

#### Archivos Creados:

```
src/
├── api/
│   ├── client.ts          ✅ Cliente Axios configurado
│   ├── auth.ts            ✅ Login, registro, verificación
│   ├── products.ts        ✅ CRUD de productos
│   ├── categories.ts      ✅ Categorías y subcategorías
│   ├── cart.ts            ✅ Carrito de compras
│   ├── sellers.ts         ✅ Gestión de vendedores
│   └── index.ts           ✅ Exportaciones centralizadas
│
├── config/
│   └── env.ts             ✅ Variables de entorno
│
├── types/
│   └── api.ts             ✅ Tipos TypeScript completos
│
└── .env                   ✅ Configuración del API
```

---

## 🚀 **Características Implementadas**

### 1. **Cliente HTTP (Axios)**
- ✅ Configuración base con interceptores
- ✅ Autenticación automática con JWT
- ✅ Manejo global de errores (401, 403, 404, 500)
- ✅ Redirección automática en caso de token inválido
- ✅ Timeout configurado (30 segundos)

### 2. **API de Autenticación**
```typescript
// Funciones disponibles:
- login(credentials, role)           // Login genérico
- loginClient(credentials)           // Login de cliente
- loginSeller(credentials)           // Login de vendedor
- loginAdmin(credentials)            // Login de admin
- registerClient(data)               // Registro de cliente
- verifyToken()                      // Verificar token JWT
- logout()                           // Cerrar sesión
- isAuthenticated()                  // Verificar si está logueado
```

### 3. **API de Productos**
```typescript
// Funciones disponibles:
- getAllProducts()                   // Todos los productos
- getProductById(id)                 // Producto específico
- searchProducts(query)              // Buscar productos
- getProductsByCategory(id)          // Filtrar por categoría
- getProductsBySubcategory(id)       // Filtrar por subcategoría
- getFeaturedProducts(limit)         // Productos destacados
- createProduct(data)                // Crear (solo sellers)
- updateProduct(id, data)            // Actualizar (solo sellers)
- deleteProduct(id)                  // Eliminar (solo admin)
- formatPrice(price)                 // Helper de formato
```

### 4. **API de Categorías**
```typescript
// Categorías:
- getAllCategories()
- getCategoryById(id)
- createCategory(data)               // Solo admin
- updateCategory(id, data)           // Solo admin
- deleteCategory(id)                 // Solo admin

// Subcategorías:
- getAllSubcategories()
- getSubcategoryById(id)
- getSubcategoriesByCategory(id)
- createSubcategory(data)            // Solo admin
- updateSubcategory(id, data)        // Solo admin
- deleteSubcategory(id)              // Solo admin
```

### 5. **API de Carrito**
```typescript
// Funciones disponibles:
- getMyCart()                        // Carrito del usuario
- getCartById(id)
- getCartWithProducts(id)            // Con productos incluidos
- createCart(clientId)
- addProductToCart(cartId, data)
- updateCartItemQuantity(cartId, productId, qty)
- removeProductFromCart(cartId, productId)
- clearCart(cartId)
- calculateCartTotal(cart)           // Helper
- getCartItemCount(cart)             // Helper
```

### 6. **API de Vendedores**
```typescript
// Funciones disponibles:
- getAllSellers()
- getSellerById(id)
- getSellerProducts(id)
- registerSeller(data)               // Registro público
- updateSeller(id, data)             // Solo seller
- deleteSeller(id)                   // Solo admin
```

---

## 📦 **Componentes Conectados al Backend**

### ✅ Componentes Actualizados:

1. **FeaturedProducts.tsx**
   - Usa React Query para fetch de productos
   - Estados de loading y error
   - Muestra productos reales del backend
   - Formateo de precios con helper
   - Badges dinámicos según stock
   - Diseño responsivo

2. **Categories.tsx**
   - Fetch de categorías desde el backend
   - Iconos dinámicos según nombre
   - Loading state
   - Gradientes rotativos

---

## 🔧 **Configuración**

### Variables de Entorno (`.env`):
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:8081
VITE_APP_NAME=Marketplace El Espigón
VITE_APP_VERSION=1.0.0
```

### Uso en el Código:
```typescript
import { config } from '@/config/env';

console.log(config.apiUrl);  // http://localhost:3000/api
```

---

## 📖 **Cómo Usar la API**

### Ejemplo 1: Obtener Productos
```typescript
import { getAllProducts } from '@/api/products';

const products = await getAllProducts();
```

### Ejemplo 2: Login con React Query
```typescript
import { useMutation } from '@tanstack/react-query';
import { login, saveAuthData } from '@/api/auth';

const { mutate: loginUser } = useMutation({
  mutationFn: (data) => login(data, 'client'),
  onSuccess: (response) => {
    saveAuthData(response.token, response.user);
    // Redirigir al dashboard
  },
});
```

### Ejemplo 3: Agregar al Carrito
```typescript
import { addProductToCart } from '@/api/cart';

await addProductToCart(cartId, {
  id_product: 123,
  quantity: 2
});
```

---

## 📋 **Siguiente Fase: Páginas y Rutas**

### Prioridad Alta:
1. **Página de Login** (`/login`)
2. **Página de Registro** (`/register`)
3. **Página de Productos** (`/products`)
4. **Página de Detalle de Producto** (`/products/:id`)
5. **Página de Carrito** (`/cart`)

### Contextos Necesarios:
- `AuthContext` - Estado global de autenticación
- `CartContext` - Estado global del carrito

---

## 🎯 **Estado del Proyecto**

| Componente | Estado | Notas |
|------------|--------|-------|
| API Layer | ✅ 100% | Completado y funcional |
| Tipos TypeScript | ✅ 100% | Todos los tipos definidos |
| Componentes UI | ✅ 100% | Shadcn/ui completo |
| FeaturedProducts | ✅ 100% | Conectado al backend |
| Categories | ✅ 100% | Conectado al backend |
| Hero | ✅ 100% | Estático (funcional) |
| Navbar | ⏳ 50% | Falta integrar auth |
| Autenticación | ❌ 0% | Pendiente |
| Rutas | ❌ 0% | Solo / y 404 |
| Carrito | ❌ 0% | Pendiente |
| Panel Vendedor | ❌ 0% | Pendiente |
| Panel Admin | ❌ 0% | Pendiente |
| WebSockets | ❌ 0% | Pendiente |

---

## 🚀 **Cómo Correr el Proyecto**

```bash
# 1. Instalar dependencias (si no lo has hecho)
npm install

# 2. Crear archivo .env (ya creado)
# Verificar que VITE_API_URL apunte a tu backend

# 3. Correr el servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:5173
```

---

## 🐛 **Troubleshooting**

### Error: "Cannot connect to backend"
- ✅ Verificar que el backend REST esté corriendo en puerto 3000
- ✅ Revisar que `.env` tenga `VITE_API_URL=http://localhost:3000/api`
- ✅ Verificar CORS en el backend

### Error: "401 Unauthorized"
- ✅ Verificar que el token JWT esté en localStorage
- ✅ Revisar que el token no haya expirado
- ✅ Login de nuevo

---

## 📚 **Documentación de Referencia**

- [Backend API Endpoints](../../backend/rest_service/API_ENDPOINTS.md)
- [React Query Docs](https://tanstack.com/query/latest)
- [Axios Docs](https://axios-http.com/)
- [Shadcn/ui Components](https://ui.shadcn.com/)

---

## 👨‍💻 **Próximos Pasos**

1. ✅ ~~Implementar capa de API~~
2. ✅ ~~Conectar FeaturedProducts~~
3. ✅ ~~Conectar Categories~~
4. ⏳ Crear páginas de autenticación
5. ⏳ Implementar AuthContext
6. ⏳ Crear páginas de productos
7. ⏳ Implementar carrito de compras
8. ⏳ Crear panel de vendedor
9. ⏳ Crear panel de admin
10. ⏳ Integrar WebSockets

---

**¡La capa de API está lista! Ahora podemos crear las páginas y conectarlas al backend. 🎉**
