# 📊 EJEMPLOS DE QUERIES DE REPORTES

## 🎯 DASHBOARD GENERAL
```graphql
query DashboardStats {
  dashboardStats {
    todaySales
    todayOrders
    totalActiveClients
    totalActiveSellers
    totalProducts
    pendingDeliveries
    lowStockProducts
    monthRevenue
    monthOrders
  }
}
```

## 💰 REPORTE DE VENTAS
```graphql
query SalesReport {
  salesReport(
    dateRange: { 
      startDate: "2025-01-01", 
      endDate: "2025-11-07" 
    }
    period: MONTHLY
  ) {
    startDate
    endDate
    totalRevenue
    totalOrders
    averageOrderValue
    salesByPeriod {
      period
      totalSales
      totalOrders
      averageOrderValue
    }
  }
}
```

## 🏆 TOP VENDEDORES
```graphql
query TopSellers {
  topSellersReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-11-07" 
    }
    limit: 5
  ) {
    periodStart
    periodEnd
    topSellers {
      sellerId
      sellerName
      businessName
      totalSales
      totalOrders
      productsSold
    }
  }
}
```

## 📦 PRODUCTOS MÁS VENDIDOS
```graphql
query BestProducts {
  bestProductsReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-11-07" 
    }
    limit: 10
  ) {
    periodStart
    periodEnd
    bestProducts {
      productId
      productName
      categoryName
      unitsSold
      totalRevenue
      averagePrice
    }
  }
}
```

## 📊 VENTAS POR CATEGORÍA
```graphql
query CategorySales {
  categorySalesReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-11-07" 
    }
  ) {
    periodStart
    periodEnd
    categories {
      categoryId
      categoryName
      totalSales
      totalOrders
      productsCount
    }
  }
}
```

## 👥 REPORTE DE CLIENTES
```graphql
query ClientsReport {
  clientsReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-11-07" 
    }
    topLimit: 10
  ) {
    periodStart
    periodEnd
    totalClients
    newClients
    activeClients
    topClients {
      clientId
      clientName
      clientEmail
      totalOrders
      totalSpent
      lastOrderDate
    }
  }
}
```

## 📦 REPORTE DE INVENTARIO
```graphql
query InventoryReport {
  inventoryReport(minStockThreshold: 10) {
    totalProducts
    outOfStock
    lowStock
    criticalProducts {
      productId
      productName
      sellerName
      currentStock
      minStockThreshold
      status
    }
  }
}
```

## 🚚 REPORTE DE DELIVERIES
```graphql
query DeliveryReport {
  deliveryPerformanceReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-11-07" 
    }
  ) {
    periodStart
    periodEnd
    totalDeliveries
    completed
    pending
    cancelled
    averageDeliveryTimeHours
    statusBreakdown {
      status
      count
      percentage
    }
  }
}
```

## 💵 REPORTE FINANCIERO
```graphql
query FinancialReport {
  financialReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-11-07" 
    }
  ) {
    periodStart
    periodEnd
    totalRevenue
    totalOrders
    averageTransaction
    paymentMethods {
      methodName
      totalTransactions
      totalAmount
      percentage
    }
  }
}
```

## 🔥 QUERY COMPLETA (Dashboard Ejecutivo)
```graphql
query ExecutiveDashboard {
  # Stats generales
  dashboardStats {
    todaySales
    todayOrders
    monthRevenue
    monthOrders
    totalActiveClients
    totalActiveSellers
    totalProducts
    pendingDeliveries
    lowStockProducts
  }
  
  # Top vendedores del mes
  topSellersReport(limit: 5) {
    topSellers {
      sellerName
      businessName
      totalSales
      totalOrders
    }
  }
  
  # Productos más vendidos
  bestProductsReport(limit: 10) {
    bestProducts {
      productName
      categoryName
      unitsSold
      totalRevenue
    }
  }
  
  # Inventario crítico
  inventoryReport(minStockThreshold: 5) {
    outOfStock
    lowStock
    criticalProducts {
      productName
      currentStock
      status
    }
  }
  
  # Ventas por categoría
  categorySalesReport {
    categories {
      categoryName
      totalSales
      productsCount
    }
  }
}
```

## 📈 QUERY PARA GRÁFICOS (Ventas en el tiempo)
```graphql
query SalesChart {
  salesReport(
    dateRange: { 
      startDate: "2025-01-01", 
      endDate: "2025-12-31" 
    }
    period: MONTHLY
  ) {
    salesByPeriod {
      period          # "2025-01", "2025-02", etc.
      totalSales      # Para el eje Y
      totalOrders     # Para mostrar cantidad
    }
  }
}
```

## 🎯 QUERY PARA ANÁLISIS DE RENDIMIENTO
```graphql
query PerformanceAnalysis {
  # Ventas del mes actual
  currentMonth: salesReport(
    dateRange: { 
      startDate: "2025-11-01", 
      endDate: "2025-11-30" 
    }
  ) {
    totalRevenue
    totalOrders
  }
  
  # Ventas del mes anterior
  previousMonth: salesReport(
    dateRange: { 
      startDate: "2025-10-01", 
      endDate: "2025-10-31" 
    }
  ) {
    totalRevenue
    totalOrders
  }
  
  # Clientes nuevos
  clientsReport {
    totalClients
    newClients
    activeClients
  }
  
  # Performance de deliveries
  deliveryPerformanceReport {
    completed
    pending
    averageDeliveryTimeHours
  }
}
```

## 💡 NOTAS DE USO

### Períodos disponibles:
- `DAILY`: Agrupa por día
- `WEEKLY`: Agrupa por semana
- `MONTHLY`: Agrupa por mes
- `YEARLY`: Agrupa por año

### Rangos de fechas:
- Si no especificas `dateRange`, usa los **últimos 30 días** por defecto
- Formato de fecha: `"YYYY-MM-DD"` (ejemplo: `"2025-11-07"`)

### Límites:
- `limit` en `topSellersReport`: default 10
- `limit` en `bestProductsReport`: default 20
- `topLimit` en `clientsReport`: default 10
- `minStockThreshold` en `inventoryReport`: default 10

### Para frontend:
Usa **aliases** de GraphQL para comparar períodos:
```graphql
query CompareMonths {
  thisMonth: salesReport(dateRange: { startDate: "2025-11-01", endDate: "2025-11-30" }) {
    totalRevenue
  }
  lastMonth: salesReport(dateRange: { startDate: "2025-10-01", endDate: "2025-10-31" }) {
    totalRevenue
  }
}
```
