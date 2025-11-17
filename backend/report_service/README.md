# 📊 Report Service - Servicio de Reportes y Analytics

## 📋 Descripción General

El **Report Service** es un microservicio desarrollado en **Python con FastAPI y Strawberry GraphQL** que proporciona consultas avanzadas, reportes analíticos y estadísticas del negocio. Este servicio está optimizado para operaciones de solo lectura y análisis de datos complejos sin afectar el rendimiento del servicio REST principal.

## 🎯 Propósito y Funcionalidad

Este servicio tiene como objetivo principal:

- ✅ **Generar reportes analíticos** de ventas, productos, clientes y vendedores
- ✅ **Proporcionar dashboards** con estadísticas en tiempo real
- ✅ **Ejecutar consultas complejas** sin impactar el servicio REST
- ✅ **Exponer API GraphQL** flexible para el frontend
- ✅ **Calcular métricas de negocio** (KPIs, promedios, tendencias)
- ✅ **Consultar datos históricos** y generar análisis temporales

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Python** | 3.9+ | Lenguaje principal del servicio |
| **FastAPI** | 0.109.0 | Framework web asíncrono |
| **Strawberry GraphQL** | 0.209.0 | Librería GraphQL para Python |
| **Uvicorn** | 0.27.0 | Servidor ASGI |
| **HTTPX** | 0.27.0 | Cliente HTTP asíncrono |
| **Pydantic** | 2.5.3 | Validación de datos |
| **Python Dotenv** | 1.0.0 | Gestión de variables de entorno |

### Arquitectura GraphQL

El servicio expone un único endpoint GraphQL que permite:
- **Consultas flexibles**: El cliente pide exactamente los datos que necesita
- **Sin over-fetching**: Solo se envían los campos solicitados
- **Queries anidadas**: Relaciones entre entidades en una sola petición
- **Tipado fuerte**: Schema GraphQL autodocumentado

```
report_service/
├── app/
│   ├── common/           # Entidades del dominio (GraphQL Types)
│   │   └── entities/     # 14 entidades con types, resolvers y services
│   ├── reports/          # Reportes analíticos especializados
│   │   ├── resolvers.py  # Queries GraphQL de reportes
│   │   ├── schema.py     # Types de reportes
│   │   └── service.py    # Lógica de análisis de datos
│   ├── config.py         # Configuración de entorno
│   ├── deps.py           # Dependencias compartidas
│   ├── main.py           # Punto de entrada FastAPI
│   └── schema.py         # Schema GraphQL global
├── requirements.txt      # Dependencias Python
└── .env                  # Variables de entorno
```

## 📂 Estructura Detallada

### 📁 `/app`

#### `main.py` - Punto de Entrada

**Función:** Inicializa la aplicación FastAPI y configura el servidor GraphQL.

**Características:**
```python
# Aplicación FastAPI
app = FastAPI(title="Report Service (GraphQL)", version="1.0")

# CORS configurado para frontend
app.add_middleware(CORSMiddleware, allow_origins=[...])

# Router GraphQL
graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")
```

**Endpoints expuestos:**
- `GET /`: Página de bienvenida
- `GET /health`: Health check del servicio
- `GET /graphql`: Interfaz GraphiQL (desarrollo)
- `POST /graphql`: Endpoint principal para queries

#### `schema.py` - Schema Global

**Función:** Combina todos los resolvers de entidades y reportes en un único schema GraphQL.

**Entidades incluidas:**
- AdminQueries
- ClientQueries
- SellerQueries
- CategoryQueries
- SubCategoryQueries
- ProductQueries
- OrderQueries
- CartQueries
- DeliveryQueries
- InventoryQueries
- PaymentMethodQueries
- ProductCartQueries
- ProductOrderQueries
- SubCategoryProductQueries
- **ReportQueries** ⭐ (Queries analíticas)

#### `config.py` - Configuración

**Función:** Gestiona variables de entorno y configuración del servicio.

**Variables requeridas:**
```python
REST_API_URL = "http://localhost:3000"  # URL del servicio REST
DATABASE_URL = "postgresql://..."        # Conexión directa a DB (opcional)
CORS_ORIGINS = ["http://localhost:5173"] # Orígenes permitidos
```

#### `deps.py` - Dependencias

**Función:** Provee dependencias compartidas como clientes HTTP, configuración, etc.

### 📁 `/app/common/entities`

**14 Carpetas de entidades** del dominio, cada una con:

| Entidad | Descripción | Archivos |
|---------|-------------|----------|
| `admins` | Administradores | types.py, resolvers.py, service.py |
| `clients` | Clientes | types.py, resolvers.py, service.py |
| `sellers` | Vendedores | types.py, resolvers.py, service.py |
| `categories` | Categorías | types.py, resolvers.py, service.py |
| `subcategories` | Subcategorías | types.py, resolvers.py, service.py |
| `products` | Productos | types.py, resolvers.py, service.py |
| `orders` | Pedidos | types.py, resolvers.py, service.py |
| `carts` | Carritos | types.py, resolvers.py, service.py |
| `deliveries` | Entregas | types.py, resolvers.py, service.py |
| `inventories` | Inventarios | types.py, resolvers.py, service.py |
| `payment_methods` | Métodos de pago | types.py, resolvers.py, service.py |
| `product_carts` | Productos en carrito | types.py, resolvers.py, service.py |
| `product_orders` | Productos en orden | types.py, resolvers.py, service.py |
| `subcategory_products` | Relación subcategoría-producto | types.py, resolvers.py, service.py |

#### Estructura de cada entidad:

**`types.py`**: Define el tipo GraphQL
```python
@strawberry.type
class Product:
    id: str
    name: str
    price: float
    description: str
    image_url: str
    stock: int
    seller: Seller  # Relación
    category: Category  # Relación
```

**`resolvers.py`**: Define las queries GraphQL
```python
@strawberry.type
class ProductQueries:
    @strawberry.field
    def product(self, id: str) -> Product:
        return get_product_by_id(id)
    
    @strawberry.field
    def products(self) -> List[Product]:
        return get_all_products()
```

**`service.py`**: Lógica de negocio y llamadas al REST Service
```python
def get_product_by_id(id: str) -> Product:
    response = httpx.get(f"{REST_API_URL}/api/products/{id}")
    return Product(**response.json())
```

### 📁 `/app/reports` ⭐

**Núcleo del sistema de reportes** con 3 archivos:

#### `schema.py` - Types de Reportes

Define estructuras de datos para reportes:

```python
@strawberry.type
class DashboardStats:
    sales_today: float
    orders_today: int
    active_clients: int
    active_sellers: int
    total_products: int
    pending_deliveries: int
    low_stock_products: int

@strawberry.type
class SalesReport:
    total_revenue: float
    total_orders: int
    average_order_value: float
    sales_by_period: List[SalesByPeriod]

@strawberry.type
class TopSeller:
    seller_id: str
    seller_name: str
    business_name: str
    total_sales: float
    total_orders: int
    products_sold: int
```

#### `resolvers.py` - Queries de Reportes

Expone queries GraphQL para reportes:

```python
@strawberry.type
class ReportQueries:
    @strawberry.field
    def dashboard_stats(self) -> DashboardStats:
        """Estadísticas del dashboard principal"""
        return get_dashboard_stats()
    
    @strawberry.field
    def sales_report(
        self, 
        start_date: str, 
        end_date: str,
        group_by: str = "day"
    ) -> SalesReport:
        """Reporte de ventas por período"""
        return get_sales_report(start_date, end_date, group_by)
    
    @strawberry.field
    def top_sellers(
        self, 
        limit: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[TopSeller]:
        """Top vendedores por ventas"""
        return get_top_sellers(limit, start_date, end_date)
    
    @strawberry.field
    def best_products(self, limit: int = 10) -> List[BestProduct]:
        """Productos más vendidos"""
        return get_best_products(limit)
    
    @strawberry.field
    def category_sales(self) -> List[CategorySales]:
        """Ventas agrupadas por categoría"""
        return get_category_sales()
    
    @strawberry.field
    def clients_report(self) -> ClientsReport:
        """Análisis de clientes"""
        return get_clients_report()
    
    @strawberry.field
    def inventory_alerts(self) -> List[InventoryAlert]:
        """Alertas de inventario bajo"""
        return get_inventory_alerts()
```

#### `service.py` - Lógica de Análisis

Implementa la lógica de cálculo de reportes:

**Funcionalidades principales:**

1. **Dashboard Stats**: Consulta múltiples endpoints del REST Service y agrega datos
2. **Sales Report**: Agrupa ventas por día/semana/mes/año con cálculos de totales y promedios
3. **Top Sellers**: Ordena vendedores por métricas de ventas
4. **Best Products**: Ranking de productos más vendidos
5. **Category Sales**: Análisis de rendimiento por categoría
6. **Clients Report**: Segmentación de clientes (nuevos, activos, inactivos)
7. **Inventory Alerts**: Detecta productos con stock bajo

**Ejemplo de implementación:**

```python
async def get_dashboard_stats() -> DashboardStats:
    # Consultas paralelas al REST Service
    async with httpx.AsyncClient() as client:
        orders_response = await client.get(f"{REST_API_URL}/api/orders")
        clients_response = await client.get(f"{REST_API_URL}/api/clients")
        products_response = await client.get(f"{REST_API_URL}/api/products")
    
    # Procesar y calcular métricas
    orders = orders_response.json()
    today = datetime.now().date()
    
    sales_today = sum(
        order['total'] for order in orders 
        if order['created_at'].date() == today
    )
    
    orders_today = len([
        order for order in orders 
        if order['created_at'].date() == today
    ])
    
    return DashboardStats(
        sales_today=sales_today,
        orders_today=orders_today,
        ...
    )
```

## 📊 Reportes Implementados

### 1️⃣ Dashboard Stats
**Query:**
```graphql
query {
  dashboard_stats {
    sales_today
    orders_today
    active_clients
    active_sellers
    total_products
    pending_deliveries
    low_stock_products
    sales_month
    orders_month
  }
}
```

### 2️⃣ Sales Report
**Query:**
```graphql
query {
  sales_report(
    start_date: "2024-01-01"
    end_date: "2024-12-31"
    group_by: "month"
  ) {
    total_revenue
    total_orders
    average_order_value
    sales_by_period {
      period
      revenue
      orders
    }
  }
}
```

### 3️⃣ Top Sellers
**Query:**
```graphql
query {
  top_sellers(limit: 10) {
    seller_id
    seller_name
    business_name
    total_sales
    total_orders
    products_sold
    average_rating
  }
}
```

### 4️⃣ Best Products
**Query:**
```graphql
query {
  best_products(limit: 20) {
    product_id
    product_name
    units_sold
    total_revenue
    average_price
    category_name
  }
}
```

### 5️⃣ Category Sales
**Query:**
```graphql
query {
  category_sales {
    category_name
    total_sales
    total_orders
    product_count
    percentage_of_total
  }
}
```

### 6️⃣ Clients Report
**Query:**
```graphql
query {
  clients_report {
    total_clients
    new_clients_this_month
    active_clients
    inactive_clients
    clients_by_segment {
      segment
      count
      percentage
    }
  }
}
```

### 7️⃣ Inventory Alerts
**Query:**
```graphql
query {
  inventory_alerts {
    product_id
    product_name
    current_stock
    minimum_stock
    status
    seller_name
  }
}
```

## 🚀 Despliegue y Configuración

### Variables de Entorno

Crear archivo `.env`:

```env
# REST Service
REST_API_URL=http://localhost:3000

# Server
HOST=127.0.0.1
PORT=4000

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Database (opcional para consultas directas)
DATABASE_URL=postgresql://user:password@localhost:5432/marketplace
```

### Instalación de Dependencias

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### Desarrollo Local

```bash
# Método 1: Directamente
python app/main.py

# Método 2: Con Uvicorn
uvicorn app.main:app --reload --host 127.0.0.1 --port 4000

# Método 3: Con configuración
uvicorn app.main:app --reload --log-level info
```

### Acceder a GraphiQL

Abrir en navegador: `http://127.0.0.1:4000/graphql`

Interfaz interactiva con:
- Autocompletado de queries
- Documentación del schema
- Explorador de tipos
- Historial de queries

### Build para Producción

```bash
# Con Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:4000

# Con Docker
docker build -t report-service .
docker run -p 4000:4000 report-service
```

## 🔗 Integración con Otros Servicios

### REST Service (Node.js/TypeScript)

El Report Service consume datos del REST Service vía HTTP:

**Endpoints consumidos:**
- `GET /api/orders`: Lista de pedidos
- `GET /api/products`: Lista de productos
- `GET /api/clients`: Lista de clientes
- `GET /api/sellers`: Lista de vendedores
- `GET /api/categories`: Lista de categorías

**Flujo de datos:**
```
REST Service (Source of Truth)
       ↓ HTTP Requests
Report Service (Analytics)
       ↓ GraphQL
Frontend (Dashboards)
```

### Frontend (React)

El frontend consulta reportes vía GraphQL con Apollo Client:

```typescript
import { gql, useQuery } from '@apollo/client';

const DASHBOARD_STATS = gql`
  query {
    dashboard_stats {
      sales_today
      orders_today
      active_clients
    }
  }
`;

function Dashboard() {
  const { data, loading, error } = useQuery(DASHBOARD_STATS);
  
  if (loading) return <Spinner />;
  if (error) return <Error />;
  
  return <DashboardView stats={data.dashboard_stats} />;
}
```

## 🎯 Ventajas de GraphQL para Reportes

### 1. Consultas Flexibles
El frontend puede pedir exactamente los campos que necesita:

```graphql
# Solo nombre y ventas
query {
  top_sellers(limit: 5) {
    seller_name
    total_sales
  }
}

# Datos completos
query {
  top_sellers(limit: 5) {
    seller_name
    business_name
    total_sales
    total_orders
    products_sold
    average_rating
  }
}
```

### 2. Consultas Anidadas
Obtener relaciones en una sola petición:

```graphql
query {
  product(id: "123") {
    name
    price
    seller {
      name
      business_name
    }
    category {
      name
    }
    subcategories {
      name
    }
  }
}
```

### 3. Sin Over-fetching
Solo se envían los datos solicitados, reduciendo uso de ancho de banda.

### 4. Autodocumentación
El schema GraphQL es autodocumentado y explorable en GraphiQL.

### 5. Tipado Fuerte
TypeScript puede generar tipos automáticamente desde el schema.

## 🧪 Pruebas y Testing

### Queries de Ejemplo

Ver archivo `REPORT_QUERIES_EXAMPLES.md` para ejemplos completos de queries.

### Testing Manual

1. Abrir GraphiQL: `http://127.0.0.1:4000/graphql`
2. Ejecutar query de prueba:
```graphql
query {
  dashboard_stats {
    sales_today
    orders_today
  }
}
```
3. Verificar respuesta

### Testing con HTTPX

```python
import httpx

query = """
query {
  top_sellers(limit: 5) {
    seller_name
    total_sales
  }
}
"""

response = httpx.post(
    "http://127.0.0.1:4000/graphql",
    json={"query": query}
)

print(response.json())
```

## 📈 Optimización y Performance

### Estrategias Implementadas

1. **Consultas Asíncronas**: Uso de `httpx.AsyncClient` para consultas paralelas
2. **Caché**: Caché de resultados frecuentes (pendiente)
3. **Paginación**: Queries con límites para grandes datasets
4. **Índices**: Uso de índices en consultas a base de datos
5. **Agregaciones**: Cálculos agregados en queries SQL

### Recomendaciones

- **Caché Redis**: Implementar caché de reportes estáticos
- **Batch Queries**: Agrupar múltiples consultas
- **DataLoader**: Evitar N+1 queries en relaciones
- **Conexión Directa a DB**: Para reportes complejos, consultar directamente PostgreSQL

