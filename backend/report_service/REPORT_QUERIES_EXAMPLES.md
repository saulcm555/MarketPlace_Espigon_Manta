# 📊 EJEMPLOS DE QUERIES DE REPORTES

## 🎯 DASHBOARD GENERAL
```graphql
query DashboardStats {
  dashboard_stats {
    today_sales
    today_orders
    total_active_clients
    total_active_sellers
    total_products
    pending_deliveries
    low_stock_products
    month_revenue
    month_orders
  }
}
```

## 💰 REPORTE DE VENTAS
```graphql
query SalesReport {
  sales_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
    period: MONTHLY
  ) {
    start_date
    end_date
    total_revenue
    total_orders
    average_order_value
    sales_by_period {
      period
      total_sales
      total_orders
    }
  }
}
```

## 🏆 TOP VENDEDORES
```graphql
query TopSellers {
  top_sellers_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
    limit: 5
  ) {
    period_start
    period_end
    top_sellers {
      seller_id
      seller_name
      business_name
      total_sales
      total_orders
      products_sold
    }
  }
}
```

## 📦 PRODUCTOS MÁS VENDIDOS
```graphql
query BestProducts {
  best_products_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
    limit: 10
  ) {
    period_start
    period_end
    best_products {
      product_id
      product_name
      category_name
      units_sold
      total_revenue
      average_price
    }
  }
}
```

## 📊 VENTAS POR CATEGORÍA
```graphql
query CategorySales {
  category_sales_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
  ) {
    period_start
    period_end
    categories {
      category_id
      category_name
      total_sales
      total_orders
      products_count
    }
  }
}
```

## 👥 REPORTE DE CLIENTES
```graphql
query ClientsReport {
  clients_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
    top_limit: 10
  ) {
    period_start
    period_end
    total_clients
    new_clients
    active_clients
    top_clients {
      client_id
      client_name
      client_email
      total_orders
      total_spent
      last_order_date
    }
  }
}
```

## 📦 REPORTE DE INVENTARIO
```graphql
query InventoryReport {
  inventory_report(min_stock_threshold: 10) {
    total_products
    out_of_stock
    low_stock
    critical_products {
      product_id
      product_name
      seller_name
      current_stock
      min_stock_threshold
      status
    }
  }
}
```

## 🚚 REPORTE DE DELIVERIES
```graphql
query DeliveryReport {
  delivery_performance_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
  ) {
    period_start
    period_end
    total_deliveries
    completed
    pending
    cancelled
    average_delivery_time_hours
    status_breakdown {
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
  financial_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-11-07" 
    }
  ) {
    period_start
    period_end
    total_revenue
    total_orders
    average_transaction
    payment_methods {
      method_name
      total_transactions
      total_amount
      percentage
    }
  }
}
```

## 🔥 QUERY COMPLETA (Dashboard Ejecutivo)
```graphql
query ExecutiveDashboard {
  # Stats generales
  dashboard_stats {
    today_sales
    today_orders
    month_revenue
    month_orders
    total_active_clients
    total_active_sellers
    total_products
    pending_deliveries
    low_stock_products
  }
  
  # Top vendedores del mes
  top_sellers_report(limit: 5) {
    top_sellers {
      seller_name
      business_name
      total_sales
      total_orders
    }
  }
  
  # Productos más vendidos
  best_products_report(limit: 10) {
    best_products {
      product_name
      category_name
      units_sold
      total_revenue
    }
  }
  
  # Inventario crítico
  inventory_report(min_stock_threshold: 5) {
    out_of_stock
    low_stock
    critical_products {
      product_name
      current_stock
      status
    }
  }
  
  # Ventas por categoría
  category_sales_report {
    categories {
      category_name
      total_sales
      products_count
    }
  }
}
```

## 📈 QUERY PARA GRÁFICOS (Ventas en el tiempo)
```graphql
query SalesChart {
  sales_report(
    date_range: { 
      start_date: "2025-01-01", 
      end_date: "2025-12-31" 
    }
    period: MONTHLY
  ) {
    sales_by_period {
      period          # "2025-01", "2025-02", etc.
      total_sales     # Para el eje Y
      total_orders    # Para mostrar cantidad
    }
  }
}
```

## 🎯 QUERY PARA ANÁLISIS DE RENDIMIENTO
```graphql
query PerformanceAnalysis {
  # Ventas del mes actual
  current_month: sales_report(
    date_range: { 
      start_date: "2025-11-01", 
      end_date: "2025-11-30" 
    }
  ) {
    total_revenue
    total_orders
  }
  
  # Ventas del mes anterior
  previous_month: sales_report(
    date_range: { 
      start_date: "2025-10-01", 
      end_date: "2025-10-31" 
    }
  ) {
    total_revenue
    total_orders
  }
  
  # Clientes nuevos
  clients_report {
    total_clients
    new_clients
    active_clients
  }
  
  # Performance de deliveries
  delivery_performance_report {
    completed
    pending
    average_delivery_time_hours
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
- Si no especificas `date_range`, usa los **últimos 30 días** por defecto
- Formato de fecha: `"YYYY-MM-DD"` (ejemplo: `"2025-11-07"`)

### Límites:
- `limit` en `top_sellers_report`: default 10
- `limit` en `best_products_report`: default 20
- `top_limit` en `clients_report`: default 10
- `min_stock_threshold` en `inventory_report`: default 10

### Para frontend:
Usa **aliases** de GraphQL para comparar períodos:
```graphql
query CompareMonths {
  this_month: sales_report(date_range: { start_date: "2025-11-01", end_date: "2025-11-30" }) {
    total_revenue
  }
  last_month: sales_report(date_range: { start_date: "2025-10-01", end_date: "2025-10-31" }) {
    total_revenue
  }
}
```

## 🆕 QUERIES DE ENTIDADES BÁSICAS (Agregadas)

### Todas las Entidades Disponibles:
```graphql
# Productos
query AllProducts {
  all_products {
    id_product
    product_name
    price
    stock
    status
    image_url
    created_at
  }
}

# Órdenes
query AllOrders {
  all_orders {
    id_order
    order_date
    status
    total_amount
    delivery_type
    payment_receipt_url
    payment_verified_at
  }
}

# Clientes
query AllClients {
  all_clients {
    id_client
    client_name
    client_email
    phone
    address
    document_type
    document_number
    birth_date
    created_at
  }
}

# Vendedores
query AllSellers {
  all_sellers {
    id_seller
    seller_name
    seller_email
    phone
    bussines_name
    location
    created_at
  }
}

# Categorías
query AllCategories {
  all_categories {
    id_category
    category_name
    description
    photo
  }
}

# Subcategorías
query AllSubCategories {
  all_subcategories {
    id_sub_category
    id_category
    sub_category_name
    description
  }
}

# Carritos
query AllCarts {
  all_carts {
    id_cart
    id_client
    id_product
    status
    quantity
  }
}

# Productos en Carritos (tabla intermedia)
query AllProductCarts {
  all_product_carts {
    id_product_cart
    id_product
    id_cart
    quantity
    added_at
    updated_at
  }
}

# Productos en Órdenes (tabla intermedia con reviews)
query AllProductOrders {
  all_product_orders {
    id_product_order
    id_order
    id_product
    price_unit
    subtotal
    rating
    review_comment
    reviewed_at
    created_at
  }
}

# Métodos de Pago
query AllPaymentMethods {
  all_payment_methods {
    id_payment_method
    method_name
    details_payment
  }
}

# Deliveries
query AllDeliveries {
  all_deliveries {
    id_delivery
    id_product
    delivery_address
    city
    status
    estimated_time
    delivery_person
    delivery_cost
    phone
  }
}

# Inventarios
query AllInventories {
  all_inventories {
    id_inventory
    id_seller
    updated_at
  }
}

# Productos en Subcategorías (tabla intermedia)
query AllSubcategoryProducts {
  all_subcategory_products {
    id_sub_category_product
    id_sub_category
    id_product
  }
}

# Admins
query AllAdmins {
  all_admins {
    id_admin
    admin_name
    admin_email
    role
    created_at
  }
}
```

### Con Relaciones (Queries Anidadas):
```graphql
# Productos con Vendedor y Categoría
query ProductsWithRelations {
  all_products {
    id_product
    product_name
    price
    status
    seller {
      seller_name
      bussines_name
    }
    category {
      category_name
    }
  }
}

# Órdenes con Cliente y Productos
query OrdersWithDetails {
  all_orders {
    id_order
    status
    total_amount
    payment_receipt_url
    client {
      client_name
      client_email
    }
    product_orders {
      price_unit
      subtotal
      rating
      review_comment
      product {
        product_name
        status
      }
    }
  }
}

# Carritos con Productos (usando tabla intermedia)
query CartsWithProducts {
  all_carts {
    id_cart
    status
    client {
      client_name
    }
    product_carts {
      quantity
      added_at
      product {
        product_name
        price
        status
      }
    }
  }
}

# Categorías con Subcategorías
query CategoriesWithSubs {
  all_categories {
    category_name
    subcategories {
      sub_category_name
      description
    }
  }
}

# Vendedores con Inventarios y Productos
query SellersWithInventory {
  all_sellers {
    seller_name
    bussines_name
    inventories {
      updated_at
      products {
        product_name
        stock
        status
      }
    }
  }
}
```
