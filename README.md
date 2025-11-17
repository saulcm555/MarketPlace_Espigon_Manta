# 🛍️ MarketPlace Espigón Manta - Documentación Completa del Sistema

## 📋 Descripción General del Proyecto

**MarketPlace Espigón Manta** es una plataforma de comercio electrónico completa y moderna que conecta vendedores locales con clientes en la región de Manta, Ecuador. El sistema está construido con una **arquitectura de microservicios** en el backend y una **aplicación web SPA** en el frontend, proporcionando una experiencia de usuario fluida, escalable y mantenible.

## 🎯 Propósito del Proyecto

Este marketplace digital tiene como objetivos:

- ✅ **Facilitar el comercio local** conectando vendedores y compradores de Manta
- ✅ **Empoderar a emprendedores** proporcionándoles una plataforma digital profesional
- ✅ **Ofrecer experiencia de usuario moderna** similar a grandes marketplaces
- ✅ **Gestión completa de inventario** para vendedores
- ✅ **Sistema de pagos integrado** y seguro
- ✅ **Notificaciones en tiempo real** para mantener a usuarios informados
- ✅ **Analytics y reportes** para toma de decisiones basada en datos

## 🏗️ Arquitectura General del Sistema

```
┌──────────────────────────────────────────────────────────────────────┐
│                           FRONTEND WEB                                │
│                   React 18 + TypeScript + Vite                        │
│                     Puerto: 8080 (dev) / 80 (prod)                   │
│                                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐        │
│  │  Clients │  │  Sellers │  │  Admins  │  │  Components  │        │
│  │  Pages   │  │  Pages   │  │  Pages   │  │  & Hooks     │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘        │
└────────┬────────────────┬───────────────────┬────────────────────────┘
         │                │                   │
         │ REST API       │ GraphQL          │ WebSocket
         │ (Axios)        │ (Apollo Client)  │ (Native WS)
         ▼                ▼                   ▼
┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐
│  REST SERVICE   │  │ REPORT SERVICE │  │ REALTIME SERVICE │
│  Node.js + TS   │  │ Python + FastAPI│ │    Go Lang       │
│  Puerto: 3000   │  │  Puerto: 4000   │  │  Puerto: 8080    │
│                 │  │                 │  │                  │
│  ✓ Auth (JWT)   │  │  ✓ GraphQL API  │  │  ✓ WebSocket     │
│  ✓ CRUD APIs    │  │  ✓ Analytics    │  │  ✓ Redis Pub/Sub │
│  ✓ TypeORM      │  │  ✓ Reportes     │  │  ✓ Rooms/Salas   │
│  ✓ Payments     │  │  ✓ Dashboards   │  │  ✓ Broadcasting  │
│  ✓ Upload       │  │  ✓ Strawberry   │  │  ✓ JWT Auth      │
│  ✓ Validations  │  │                 │  │  ✓ Multi-instance│
│  ✓ Cron Jobs    │  │                 │  │                  │
└────────┬────────┘  └────────┬───────┘  └────────┬─────────┘
         │                    │                    │
         │ TypeORM            │ HTTP Client        │ Redis
         │                    │                    │ Pub/Sub
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE DATOS                            │
│                                                               │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   PostgreSQL     │  │    Redis     │  │   Supabase   │  │
│  │  (Base de Datos) │  │  (Cache +    │  │   Storage    │  │
│  │                  │  │   Pub/Sub)   │  │  (Archivos)  │  │
│  │  13 Tablas       │  │              │  │              │  │
│  │  Relaciones      │  │  Sessions    │  │  Imágenes    │  │
│  │  TypeORM         │  │  RT Sync     │  │  Documentos  │  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Componentes del Sistema

### 🎨 Frontend - Aplicación Web SPA

**Tecnologías principales:**
- React 18.3.1
- TypeScript 5.x
- Vite (Build tool)
- TailwindCSS + Shadcn/ui
- React Router 6
- Apollo Client (GraphQL)
- Axios (REST)
- React Query

**Características:**
- Interfaz moderna y responsiva
- Modo oscuro/claro
- 30+ páginas implementadas
- Componentes reutilizables (Shadcn/ui)
- Autenticación JWT
- WebSocket para tiempo real
- Generación de PDFs
- Optimizado para performance

**📚 Documentación:** Ver `frontend/README.md`

---

### 🔧 Backend - Arquitectura de Microservicios

#### 1️⃣ REST Service (Servicio Principal)

**Tecnologías:**
- Node.js + TypeScript 5.9.2
- Express 5.1.0
- TypeORM (PostgreSQL)
- JWT + Bcrypt
- Supabase (Storage)
- Redis (Caché)

**Responsabilidades:**
- API REST completa (~50 endpoints)
- Autenticación y autorización
- CRUD de todas las entidades
- Sistema de pagos
- Gestión de inventario
- Procesamiento de pedidos
- Carga de archivos
- Tareas programadas

**Puerto:** 3000

**📚 Documentación:** Ver `backend/rest_service/README.md`

---

#### 2️⃣ Report Service (Servicio de Reportes)

**Tecnologías:**
- Python 3.9+
- FastAPI 0.109.0
- Strawberry GraphQL 0.209.0
- Uvicorn
- HTTPX

**Responsabilidades:**
- API GraphQL flexible
- Reportes analíticos
- Dashboard de estadísticas
- Top vendedores/productos
- Análisis por categorías
- Segmentación de clientes
- Alertas de inventario

**Puerto:** 4000

**📚 Documentación:** Ver `backend/report_service/README.md`

---

#### 3️⃣ Realtime Service (Servicio de Tiempo Real)

**Tecnologías:**
- Go 1.23+
- Gorilla WebSocket 1.5.3
- Redis 9.7.0 (Pub/Sub)
- JWT 4.5.2
- Docker

**Responsabilidades:**
- WebSocket connections
- Notificaciones en tiempo real
- Actualizaciones de pedidos
- Alertas de inventario
- Sistema de salas (rooms)
- Redis Pub/Sub (multi-instancia)
- Autenticación JWT

**Puerto:** 8080

**📚 Documentación:** Ver `backend/realtime_service/README.md`

---

## 🗄️ Capa de Datos

### PostgreSQL - Base de Datos Relacional

**13 Tablas principales:**

| Tabla | Descripción | Relaciones Clave |
|-------|-------------|------------------|
| `admins` | Administradores del sistema | - |
| `clients` | Clientes compradores | → orders, carts |
| `sellers` | Vendedores/Emprendedores | → products, inventories |
| `categories` | Categorías principales | → subcategories |
| `subcategories` | Subcategorías de productos | → products (many-to-many) |
| `products` | Catálogo de productos | → seller, inventories |
| `inventories` | Control de stock | → product |
| `carts` | Carritos de compra | → client, product_carts |
| `product_carts` | Items en carrito | → cart, product |
| `orders` | Pedidos realizados | → client, product_orders, delivery |
| `product_orders` | Items en pedido | → order, product |
| `deliveries` | Información de entregas | → order |
| `payment_methods` | Métodos de pago | → orders |

**Características:**
- Primary keys UUID
- Timestamps (created_at, updated_at)
- Soft deletes (deleted_at)
- Foreign keys con CASCADE
- Índices optimizados
- Validaciones BD

### Redis - Cache y Pub/Sub

**Usos:**
- **Caché** (REST Service): Sesiones, datos frecuentes, rate limiting
- **Pub/Sub** (Realtime Service): Sincronización multi-instancia, eventos en tiempo real

### Supabase Storage - Archivos

**Almacenamiento:**
- Imágenes de productos
- Fotos de perfil de usuarios
- Documentos de vendedores
- Archivos temporales

---

## 🔄 Flujo de Datos del Sistema

### 1. Autenticación de Usuario

```
┌─────────┐
│ Cliente │ 1. Login (email, password)
└────┬────┘
     │
     ▼
┌─────────────────┐
│  REST Service   │ 2. Valida credenciales (bcrypt)
│   (Node.js)     │ 3. Genera JWT token
└────┬────────────┘
     │
     ▼
┌─────────┐
│ Cliente │ 4. Guarda token en localStorage
└────┬────┘ 5. Incluye token en headers de requests
     │
     ├────────────────────────────────────┐
     │                                    │
     ▼                                    ▼
┌──────────────┐                  ┌────────────────┐
│ REST Service │                  │ Realtime Svc   │
│ (Protegido)  │                  │ (WebSocket)    │
└──────────────┘                  └────────────────┘
```

### 2. Búsqueda y Compra de Producto

```
┌─────────┐
│ Cliente │ 1. Busca productos
└────┬────┘
     │
     ▼
┌────────────────┐
│ REST Service   │ 2. GET /api/products?search=...
│                │ 3. Query a PostgreSQL
└────┬───────────┘
     │
     ▼
┌─────────┐
│ Cliente │ 4. Muestra resultados
└────┬────┘ 5. Selecciona producto
     │
     ▼
┌────────────────┐
│ REST Service   │ 6. GET /api/products/:id
│                │ 7. Retorna detalles completos
└────────────────┘
     │
     ▼
┌─────────┐
│ Cliente │ 8. Agrega al carrito (localStorage + API)
└────┬────┘
     │
     ▼
┌────────────────┐
│ REST Service   │ 9. POST /api/carts/items
│                │ 10. Valida stock disponible
│                │ 11. Actualiza carrito en BD
└────────────────┘
```

### 3. Proceso de Checkout y Notificaciones

```
┌─────────┐
│ Cliente │ 1. Inicia checkout
└────┬────┘
     │
     ▼
┌────────────────┐
│ REST Service   │ 2. Valida carrito y stock
│                │ 3. Calcula totales
│                │ 4. Procesa pago
│                │ 5. Crea orden (PostgreSQL)
│                │ 6. Reduce stock
└────┬───────────┘
     │
     ├──────────────────────────────────┐
     │                                  │
     ▼                                  ▼
┌─────────────┐                  ┌────────────────┐
│ Cliente     │ 7. Retorna       │ REST Service   │
│             │    confirmación  │                │
└─────────────┘                  └────┬───────────┘
                                      │
                                      │ 8. Envía notificación
                                      ▼
                              ┌───────────────────┐
                              │ Realtime Service  │
                              │                   │
                              │ POST /api/        │
                              │ notifications/    │
                              │ send              │
                              └────┬──────────────┘
                                   │
                                   │ 9. Broadcast vía Redis
                                   ▼
                              ┌────────────────┐
                              │ WebSocket      │
                              │ Connections    │
                              └────┬───────────┘
                                   │
                                   ▼
                              ┌──────────┐
                              │ Vendedor │ 10. Recibe notificación
                              │          │     en tiempo real
                              └──────────┘
```

### 4. Generación de Reportes

```
┌──────────┐
│ Admin    │ 1. Solicita reporte de ventas
└────┬─────┘
     │
     ▼
┌────────────────┐
│ Frontend       │ 2. GraphQL Query
│                │
│ query {        │
│   sales_report │
│   {...}        │
│ }              │
└────┬───────────┘
     │
     ▼
┌─────────────────┐
│ Report Service  │ 3. Recibe query GraphQL
│ (Python)        │
└────┬────────────┘
     │
     │ 4. Consulta datos
     ▼
┌────────────────┐
│ REST Service   │ 5. GET /api/orders
│                │ 6. GET /api/products
└────┬───────────┘
     │
     ▼
┌─────────────────┐
│ Report Service  │ 7. Procesa y agrega datos
│                 │ 8. Calcula métricas
│                 │ 9. Genera gráficos
└────┬────────────┘
     │
     ▼
┌──────────┐
│ Admin    │ 10. Muestra dashboard con
│          │     gráficos (Recharts)
└──────────┘
```

---

## 🔐 Seguridad del Sistema

### Autenticación y Autorización

**JWT (JSON Web Tokens):**
- Generado por REST Service al login
- Incluye: userId, email, role, exp
- Validado en cada petición protegida
- Expiración: 7 días
- Refresh token (futuro)

**Roles del sistema:**

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **client** | Comprar, ver perfil, gestionar pedidos | Frontend cliente, API REST |
| **seller** | Vender, gestionar inventario, ver estadísticas | Panel vendedor, API REST |
| **admin** | Acceso total, gestión de usuarios, reportes | Panel admin, todas las APIs |

### Medidas de Seguridad Implementadas

#### Backend
- ✅ **Passwords hasheados** con bcrypt (10 rounds)
- ✅ **JWT con expiración** automática
- ✅ **Validación de inputs** (class-validator, Zod)
- ✅ **SQL injection prevention** (TypeORM prepared statements)
- ✅ **XSS protection** (sanitización de datos)
- ✅ **CORS configurado** (orígenes específicos)
- ✅ **Rate limiting** (prevención de ataques)
- ✅ **Helmet.js** (headers de seguridad)

#### Frontend
- ✅ **Sanitización de inputs** (React automático)
- ✅ **Validación con Zod** antes de enviar
- ✅ **HTTPS obligatorio** (producción)
- ✅ **CSP headers** (Content Security Policy)
- ✅ **Tokens en headers** (no en URLs)

---

## 🚀 Instalación y Despliegue Completo

### Pre-requisitos

- **Node.js** 18+
- **Python** 3.9+
- **Go** 1.23+
- **PostgreSQL** 14+
- **Redis** 7+
- **Docker** (opcional pero recomendado)

### Opción 1: Instalación Manual

#### 1. Clonar repositorio

```bash
git clone https://github.com/saulcm555/MarketPlace_Espigon_Manta.git
cd MarketPlace_Espigon_Manta
```

#### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb marketplace

# O con Docker
docker run -d \
  --name postgres \
  -e POSTGRES_DB=marketplace \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  postgres:14
```

#### 3. Configurar Redis

```bash
# Con Docker
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 4. REST Service

```bash
cd backend/rest_service

# Instalar dependencias
npm install

# Configurar .env
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=marketplace
JWT_SECRET=your_super_secret_key_here
REDIS_URL=redis://localhost:6379
PORT=3000
EOF

# Ejecutar migraciones
npm run typeorm migration:run

# Seed de datos iniciales
npm run seed

# Iniciar servicio
npm run dev
```

#### 5. Report Service

```bash
cd backend/report_service

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar .env
cat > .env << EOF
REST_API_URL=http://localhost:3000
HOST=127.0.0.1
PORT=4000
EOF

# Iniciar servicio
python app/main.py
```

#### 6. Realtime Service

```bash
cd backend/realtime_service

# Instalar dependencias
go mod download

# Configurar .env
cat > .env << EOF
JWT_SECRET=your_super_secret_key_here
REDIS_URL=redis://localhost:6379
PORT=8080
EOF

# Iniciar servicio
go run cmd/api/main.go
```

#### 7. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar .env
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:4000/graphql
VITE_WS_URL=ws://localhost:8080
EOF

# Iniciar aplicación
npm run dev
```

### Opción 2: Docker Compose (Recomendado)

```bash
# En la raíz del proyecto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Acceder a servicios:
# Frontend: http://localhost:8080
# REST API: http://localhost:3000
# GraphQL: http://localhost:4000/graphql
# WebSocket: ws://localhost:8080
```

### Verificación de Servicios

```bash
# REST Service
curl http://localhost:3000/health
# Response: {"status":"healthy"}

# Report Service
curl http://localhost:4000/health
# Response: {"status":"healthy"}

# Realtime Service
curl http://localhost:8080/health
# Response: {"status":"healthy"}

# Frontend
curl http://localhost:8080
# Response: HTML de la aplicación
```

---

## 📊 Funcionalidades Principales

### Para Clientes 👥

- ✅ Registro e inicio de sesión
- ✅ Búsqueda y filtrado de productos
- ✅ Carrito de compras
- ✅ Proceso de checkout
- ✅ Gestión de pedidos
- ✅ Tracking de entregas
- ✅ Perfil y configuración
- ✅ Notificaciones en tiempo real

### Para Vendedores 🏪

- ✅ Panel de control (dashboard)
- ✅ Gestión de productos (CRUD)
- ✅ Control de inventario
- ✅ Gestión de pedidos
- ✅ Estadísticas de ventas
- ✅ Analytics con gráficos
- ✅ Notificaciones de pedidos
- ✅ Generación de reportes PDF

### Para Administradores 👑

- ✅ Dashboard global
- ✅ Gestión de usuarios (clientes/vendedores)
- ✅ Aprobación de productos
- ✅ Gestión de categorías
- ✅ Reportes avanzados (GraphQL)
- ✅ Estadísticas globales
- ✅ Monitoreo del sistema
- ✅ Configuración de la plataforma

---

## 🧪 Testing

### Backend

```bash
# REST Service
cd backend/rest_service
npm test
npm run test:coverage

# Report Service
cd backend/report_service
pytest
pytest --cov=app

# Realtime Service
cd backend/realtime_service
go test ./...
go test -cover ./...
```

### Frontend

```bash
cd frontend
npm run test
npm run test:coverage
npm run test:e2e  # Tests E2E con Playwright
```

---

## 📈 Monitoreo y Performance

### Métricas del Sistema

**Backend:**
- Tiempo de respuesta de APIs
- Throughput (requests/segundo)
- Tasa de errores
- Uso de CPU/Memoria
- Conexiones a BD activas

**Frontend:**
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive
- Bundle size
- Errores JavaScript
- Tasa de conversión

### Herramientas de Monitoreo

- **PM2**: Gestión de procesos Node.js
- **Prometheus**: Recolección de métricas
- **Grafana**: Visualización de dashboards
- **Sentry**: Tracking de errores
- **Google Analytics**: Analítica web

---

## 🐛 Troubleshooting Común

### Problema: Servicios no inician

**Solución:**
1. Verificar que PostgreSQL y Redis estén corriendo
2. Revisar variables de entorno (.env)
3. Verificar puertos no estén ocupados
4. Revisar logs de cada servicio

### Problema: Frontend no conecta al backend

**Solución:**
1. Verificar URLs en frontend/.env
2. Confirmar CORS configurado en backend
3. Verificar que todos los servicios backend estén corriendo
4. Revisar consola del navegador para errores

### Problema: WebSocket no conecta

**Solución:**
1. Verificar token JWT válido
2. Confirmar Redis esté corriendo
3. Revisar configuración de CORS en Realtime Service
4. Verificar WebSocket URL correcta

### Problema: Queries GraphQL fallan

**Solución:**
1. Verificar Report Service esté corriendo (puerto 4000)
2. Probar query en GraphiQL (http://localhost:4000/graphql)
3. Verificar sintaxis de query
4. Confirmar REST Service responde correctamente

---
