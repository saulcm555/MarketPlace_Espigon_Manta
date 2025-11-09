# 📋 API Endpoints - MarketPlace Espigón Manta

## 🔐 Autenticación
Todas las rutas marcadas con 🔒 requieren el header:
```
Authorization: Bearer <token_jwt>
```

---

## 🛍️ **Products** (`/api/products`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | ❌ No | - | Listar todos los productos |
| GET | `/:id` | ❌ No | - | Obtener producto por ID |
| POST | `/` | 🔒 Sí | `seller` | Crear nuevo producto |
| PUT | `/:id` | 🔒 Sí | `seller` | Actualizar producto |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar producto |

---

## 👨‍💼 **Sellers** (`/api/sellers`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | ❌ No | - | Listar todos los sellers |
| GET | `/:id` | ❌ No | - | Obtener seller por ID |
| POST | `/` | ❌ No | - | Registrar nuevo seller |
| PUT | `/:id` | 🔒 Sí | `seller` | Actualizar seller |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar seller |

---

## 📁 **Categories** (`/api/categories`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | ❌ No | - | Listar todas las categorías |
| GET | `/:id` | ❌ No | - | Obtener categoría por ID |
| POST | `/` | 🔒 Sí | `admin` | Crear nueva categoría |
| PUT | `/:id` | 🔒 Sí | `admin` | Actualizar categoría |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar categoría |

---

## 📂 **SubCategories** (`/api/subcategories`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | ❌ No | - | Listar todas las subcategorías |
| GET | `/:id` | ❌ No | - | Obtener subcategoría por ID |
| POST | `/` | 🔒 Sí | `admin` | Crear nueva subcategoría |
| PUT | `/:id` | 🔒 Sí | `admin` | Actualizar subcategoría |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar subcategoría |

---

## 📦 **Inventories** (`/api/inventories`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | 🔒 Sí | - | Listar todos los inventarios |
| GET | `/:id` | 🔒 Sí | - | Obtener inventario por ID |
| POST | `/` | 🔒 Sí | `seller` | Crear nuevo inventario |
| PUT | `/:id` | 🔒 Sí | `seller` | Actualizar inventario |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar inventario |

---

## 👥 **Clients** (`/api/clients`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | 🔒 Sí | `admin` | Listar todos los clientes |
| GET | `/:id` | 🔒 Sí | - | Obtener cliente por ID |
| POST | `/` | ❌ No | - | Registrar nuevo cliente |
| PUT | `/:id` | 🔒 Sí | `client` | Actualizar cliente |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar cliente |

---

## 📋 **Orders** (`/api/orders`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | 🔒 Sí | `admin` | Listar todas las órdenes |
| GET | `/:id` | 🔒 Sí | - | Obtener orden por ID |
| POST | `/` | 🔒 Sí | `client` | Crear nueva orden |
| PUT | `/:id` | 🔒 Sí | `admin` | Actualizar orden |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar orden |

---

## 🛒 **Carts** (`/api/carts`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | 🔒 Sí | - | Ver carritos |
| GET | `/:id` | 🔒 Sí | - | Obtener carrito por ID |
| POST | `/` | 🔒 Sí | `client` | Agregar al carrito |
| PUT | `/:id` | 🔒 Sí | `client` | Actualizar carrito |
| DELETE | `/:id` | 🔒 Sí | `client` | Eliminar del carrito |

---

## 👨‍💻 **Admins** (`/api/admins`)

| Método | Endpoint | Autenticación | Rol Requerido | Descripción |
|--------|----------|---------------|---------------|-------------|
| GET | `/` | 🔒 Sí | `admin` | Listar todos los admins |
| GET | `/:id` | 🔒 Sí | `admin` | Obtener admin por ID |
| POST | `/` | 🔒 Sí | `admin` | Crear nuevo admin |
| PUT | `/:id` | 🔒 Sí | `admin` | Actualizar admin |
| DELETE | `/:id` | 🔒 Sí | `admin` | Eliminar admin |

---

## 🔑 **Roles Disponibles:**
- `admin` - Administrador del sistema
- `seller` - Vendedor
- `client` - Cliente

---

## 🧪 **Ejemplos de Uso:**

### 1. Crear un Seller (Público):
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/sellers" -Method POST `
  -Body '{"seller_name":"Mi Tienda","seller_email":"[email protected]","seller_password":"123456","phone":593987654321,"bussines_name":"Mi Negocio","location":"Manta"}' `
  -ContentType "application/json"
```

### 2. Crear una Categoría (Solo Admin):
```powershell
$token = "TU_TOKEN_ADMIN"
Invoke-WebRequest -Uri "http://localhost:3000/api/categories" -Method POST `
  -Headers @{"Authorization" = "Bearer $token"} `
  -Body '{"category_name":"Electrónica","description":"Productos electrónicos"}' `
  -ContentType "application/json"
```

### 3. Ver Sellers (Público):
```powershell
curl http://localhost:3000/api/sellers
```

### 4. Crear Producto (Solo Seller):
```powershell
$token = "TU_TOKEN_SELLER"
Invoke-WebRequest -Uri "http://localhost:3000/api/products" -Method POST `
  -Headers @{"Authorization" = "Bearer $token"} `
  -Body '{"product_name":"Laptop","price":1200,"stock":10,"id_seller":1,"id_inventory":1,"id_category":1,"id_sub_category":1}' `
  -ContentType "application/json"
```

---

## 📝 **Notas:**
- Las rutas públicas (❌ No) no requieren autenticación
- Las rutas protegidas (🔒 Sí) requieren token JWT válido
- Algunas rutas requieren rol específico (`admin`, `seller`, `client`)
- El middleware `authMiddleware` valida el token
- El middleware `roleMiddleware` valida el rol del usuario
