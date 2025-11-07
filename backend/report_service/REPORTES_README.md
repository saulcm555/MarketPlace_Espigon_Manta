# 📊 SISTEMA DE REPORTES - MARKETPLACE ESPIGÓN MANTA

## 🎯 ¿Qué son los Reportes?

Los **reportes** son análisis de datos que te ayudan a:
- 📈 Visualizar el rendimiento de tu negocio
- 💡 Tomar decisiones basadas en datos
- 🎯 Identificar tendencias y patrones
- 📊 Medir KPIs (Key Performance Indicators)

---

## 📦 Reportes Implementados

### 1️⃣ **Dashboard Stats** (Estadísticas Generales)
**Propósito:** Vista rápida del estado actual del negocio

**Métricas:**
- Ventas del día
- Órdenes del día
- Clientes activos
- Vendedores activos
- Total de productos
- Deliveries pendientes
- Productos con stock bajo
- Ventas del mes
- Órdenes del mes

**Caso de uso:** Dashboard principal de administración

---

### 2️⃣ **Sales Report** (Reporte de Ventas)
**Propósito:** Analizar ventas en el tiempo

**Métricas:**
- Ingresos totales
- Número de órdenes
- Valor promedio por orden
- Ventas agrupadas por período (día/semana/mes/año)

**Caso de uso:**
- Identificar temporadas altas/bajas
- Proyecciones de ventas
- Análisis de crecimiento

---

### 3️⃣ **Top Sellers Report** (Mejores Vendedores)
**Propósito:** Identificar vendedores más exitosos

**Métricas por vendedor:**
- Ventas totales
- Número de órdenes
- Productos vendidos
- Nombre del negocio

**Caso de uso:**
- Programas de incentivos
- Identificar vendedores estrella
- Detectar vendedores que necesitan apoyo

---

### 4️⃣ **Best Products Report** (Productos Más Vendidos)
**Propósito:** Identificar productos exitosos

**Métricas por producto:**
- Unidades vendidas
- Ingresos totales
- Precio promedio
- Categoría

**Caso de uso:**
- Gestión de inventario
- Estrategias de marketing
- Identificar productos rentables

---

### 5️⃣ **Category Sales Report** (Ventas por Categoría)
**Propósito:** Analizar rendimiento de categorías

**Métricas por categoría:**
- Ventas totales
- Número de órdenes
- Cantidad de productos

**Caso de uso:**
- Identificar categorías rentables
- Decisiones de expansión de catálogo
- Análisis de mercado

---

### 6️⃣ **Clients Report** (Reporte de Clientes)
**Propósito:** Analizar comportamiento de clientes

**Métricas:**
- Total de clientes
- Clientes nuevos
- Clientes activos
- Top clientes (por gasto)

**Por cliente:**
- Órdenes totales
- Gasto total
- Última compra

**Caso de uso:**
- Programas de fidelización
- Identificar clientes VIP
- Análisis de retención

---

### 7️⃣ **Inventory Report** (Reporte de Inventario)
**Propósito:** Gestión de stock

**Métricas:**
- Total de productos
- Productos agotados
- Productos con stock bajo
- Lista crítica con:
  - Stock actual
  - Vendedor responsable
  - Estado (crítico/advertencia)

**Caso de uso:**
- Prevenir quiebres de stock
- Planificación de reabastecimiento
- Alertas automáticas

---

### 8️⃣ **Delivery Performance Report** (Rendimiento de Entregas)
**Propósito:** Analizar eficiencia de entregas

**Métricas:**
- Total de entregas
- Completadas
- Pendientes
- Canceladas
- Tiempo promedio de entrega
- Distribución por estado

**Caso de uso:**
- Mejorar logística
- Identificar problemas de entrega
- SLA de servicio

---

### 9️⃣ **Financial Report** (Reporte Financiero)
**Propósito:** Análisis financiero del negocio

**Métricas:**
- Ingresos totales
- Órdenes totales
- Transacción promedio
- Desglose por método de pago:
  - Cantidad de transacciones
  - Monto total
  - Porcentaje del total

**Caso de uso:**
- Análisis de flujo de caja
- Preferencias de pago
- Comisiones bancarias

---

## 🚀 Cómo Usar los Reportes

### 1. Inicia el servicio GraphQL:
```bash
cd backend/report_service
python app/main.py
```

### 2. Abre GraphiQL:
```
http://127.0.0.1:4000/graphql
```

### 3. Ejecuta queries (ejemplos en `REPORT_QUERIES_EXAMPLES.md`)

---

## 📊 Ejemplos Prácticos

### Ejemplo 1: Dashboard Ejecutivo
```graphql
query ExecutiveDashboard {
  dashboardStats {
    todaySales
    monthRevenue
    totalActiveClients
    pendingDeliveries
  }
}
```

**Respuesta:**
```json
{
  "dashboardStats": {
    "todaySales": 1250.50,
    "monthRevenue": 45678.90,
    "totalActiveClients": 234,
    "pendingDeliveries": 12
  }
}
```

---

### Ejemplo 2: Análisis de Ventas Mensuales
```graphql
query MonthlySales {
  salesReport(
    dateRange: { 
      startDate: "2025-01-01", 
      endDate: "2025-12-31" 
    }
    period: MONTHLY
  ) {
    salesByPeriod {
      period
      totalSales
    }
  }
}
```

**Respuesta:**
```json
{
  "salesByPeriod": [
    { "period": "2025-01", "totalSales": 12500.00 },
    { "period": "2025-02", "totalSales": 15300.50 },
    { "period": "2025-03", "totalSales": 18700.25 }
  ]
}
```

**Uso en Frontend:** Crear un gráfico de líneas con Chart.js/Recharts

---

### Ejemplo 3: Alertas de Stock Bajo
```graphql
query LowStockAlert {
  inventoryReport(minStockThreshold: 5) {
    criticalProducts {
      productName
      currentStock
      status
    }
  }
}
```

**Respuesta:**
```json
{
  "criticalProducts": [
    { "productName": "Laptop HP", "currentStock": 0, "status": "critical" },
    { "productName": "Mouse Logitech", "currentStock": 3, "status": "warning" }
  ]
}
```

**Uso:** Sistema de notificaciones automáticas

---

## 🎨 Integración con Frontend

### React Example:
```javascript
import { useQuery, gql } from '@apollo/client';

const DASHBOARD_QUERY = gql`
  query Dashboard {
    dashboardStats {
      todaySales
      monthRevenue
      totalActiveClients
    }
  }
`;

function Dashboard() {
  const { data, loading } = useQuery(DASHBOARD_QUERY);
  
  if (loading) return <Spinner />;
  
  return (
    <div>
      <MetricCard 
        title="Ventas Hoy" 
        value={data.dashboardStats.todaySales} 
      />
      <MetricCard 
        title="Ventas Mes" 
        value={data.dashboardStats.monthRevenue} 
      />
    </div>
  );
}
```

---

## 📈 Visualizaciones Recomendadas

### 1. Gráfico de Líneas - Ventas en el tiempo
**Query:** `salesReport` con `period: MONTHLY`
**Librería:** Chart.js, Recharts, ApexCharts

### 2. Gráfico de Barras - Top Vendedores
**Query:** `topSellersReport`
**Datos:** `sellerName` (X), `totalSales` (Y)

### 3. Gráfico de Pie - Ventas por Categoría
**Query:** `categorySalesReport`
**Datos:** `categoryName`, `totalSales`

### 4. Gráfico de Donut - Métodos de Pago
**Query:** `financialReport`
**Datos:** `paymentMethods.percentage`

### 5. Tabla - Top Clientes
**Query:** `clientsReport`
**Datos:** Lista de `topClients`

### 6. Indicadores KPI - Dashboard Stats
**Query:** `dashboardStats`
**Componente:** Cards con números grandes

---

## 🔧 Personalización

### Cambiar rangos de fechas por defecto:
Edita `app/reports/resolvers.py`, línea ~30:
```python
# Cambiar de 30 a 90 días
start_date = end_date - timedelta(days=90)
```

### Cambiar límites por defecto:
```python
# En cada query
limit: int = 20  # Cambiar a tu preferencia
```

### Agregar nuevos reportes:

1. **Definir schema** en `app/reports/schema.py`
2. **Crear lógica** en `app/reports/service.py`
3. **Agregar resolver** en `app/reports/resolvers.py`

---

## 🎯 KPIs Importantes

### Para Admins:
- Ingresos totales
- Crecimiento mes a mes
- Tasa de conversión
- Ticket promedio

### Para Vendedores:
- Ventas propias
- Productos más vendidos
- Stock bajo
- Calificaciones

### Para Logística:
- Entregas a tiempo
- Tiempo promedio de entrega
- Entregas pendientes
- Costos de envío

---

## 💡 Casos de Uso Avanzados

### 1. Sistema de Alertas
```javascript
// Verificar stock bajo cada hora
setInterval(async () => {
  const { criticalProducts } = await fetchInventoryReport();
  if (criticalProducts.length > 0) {
    sendEmailAlert(criticalProducts);
  }
}, 3600000);
```

### 2. Comparación de Períodos
```graphql
query CompareMonths {
  thisMonth: salesReport(
    dateRange: { startDate: "2025-11-01", endDate: "2025-11-30" }
  ) { totalRevenue }
  
  lastMonth: salesReport(
    dateRange: { startDate: "2025-10-01", endDate: "2025-10-31" }
  ) { totalRevenue }
}
```

### 3. Exportar a Excel/PDF
```javascript
// Obtener datos
const report = await fetchSalesReport();

// Usar librería para exportar
import XLSX from 'xlsx';
const worksheet = XLSX.utils.json_to_sheet(report.salesByPeriod);
XLSX.writeFile({ Sheets: { data: worksheet } }, 'reporte.xlsx');
```

---

## 🐛 Troubleshooting

### Error: "No data available"
- Verifica que el REST service esté corriendo en puerto 3000
- Revisa que haya datos en la base de datos

### Error: Timeout
- Aumenta el timeout en `app/reports/service.py`:
```python
async with httpx.AsyncClient(timeout=60.0) as client:
```

### Datos incorrectos
- Verifica los filtros de fecha
- Revisa la zona horaria (UTC vs local)

---

## 📚 Recursos Adicionales

- **GraphQL Docs:** https://graphql.org/learn/
- **Strawberry Docs:** https://strawberry.rocks/
- **Chart.js:** https://www.chartjs.org/
- **React Query:** https://tanstack.com/query/latest

---

## 🎉 ¡Listo!

Ahora tienes un sistema completo de reportes y analytics para tu marketplace. Puedes:

✅ Ver estadísticas en tiempo real  
✅ Analizar tendencias de ventas  
✅ Identificar mejores vendedores y productos  
✅ Gestionar inventario  
✅ Monitorear entregas  
✅ Análisis financiero  

**¡Perfecto para tomar decisiones basadas en datos!** 📊🚀
