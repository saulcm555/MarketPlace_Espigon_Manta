# app/reports/schema.py
"""
Tipos de datos para los reportes
"""
import strawberry
from typing import List, Optional
from datetime import datetime, date
from enum import Enum

@strawberry.type
class SalesReportItem:
    """Reporte de ventas individual"""
    period: str  # "2025-11", "2025-11-07", etc.
    total_sales: float
    total_orders: int
    average_order_value: float
    
@strawberry.type
class SalesReport:
    """Reporte completo de ventas"""
    start_date: date
    end_date: date
    total_revenue: float
    total_orders: int
    average_order_value: float
    sales_by_period: List[SalesReportItem]

@strawberry.type
class TopSellerItem:
    """Item de vendedor top"""
    seller_id: int
    seller_name: str
    business_name: str
    total_sales: float
    total_orders: int
    products_sold: int

@strawberry.type
class TopSellersReport:
    """Reporte de mejores vendedores"""
    period_start: date
    period_end: date
    top_sellers: List[TopSellerItem]

@strawberry.type
class ProductSalesItem:
    """Item de producto vendido"""
    product_id: int
    product_name: str
    category_name: str
    units_sold: int
    total_revenue: float
    average_price: float

@strawberry.type
class BestProductsReport:
    """Reporte de productos más vendidos"""
    period_start: date
    period_end: date
    best_products: List[ProductSalesItem]

@strawberry.type
class CategorySalesItem:
    """Ventas por categoría"""
    category_id: int
    category_name: str
    total_sales: float
    total_orders: int
    products_count: int

@strawberry.type
class CategorySalesReport:
    """Reporte de ventas por categoría"""
    period_start: date
    period_end: date
    categories: List[CategorySalesItem]

@strawberry.type
class ClientActivityItem:
    """Actividad de cliente"""
    client_id: int
    client_name: str
    client_email: str
    total_orders: int
    total_spent: float
    last_order_date: Optional[datetime]

@strawberry.type
class ClientsReport:
    """Reporte de clientes"""
    period_start: date
    period_end: date
    total_clients: int
    new_clients: int
    active_clients: int
    top_clients: List[ClientActivityItem]

@strawberry.type
class LowStockItem:
    """Producto con bajo stock"""
    product_id: int
    product_name: str
    seller_name: str
    current_stock: int
    min_stock_threshold: int
    status: str  # "critical", "warning", "ok"

@strawberry.type
class InventoryReport:
    """Reporte de inventario"""
    total_products: int
    out_of_stock: int
    low_stock: int
    critical_products: List[LowStockItem]

@strawberry.type
class DeliveryStatusItem:
    """Estado de deliveries"""
    status: str
    count: int
    percentage: float

@strawberry.type
class DeliveryPerformanceReport:
    """Reporte de performance de deliveries"""
    period_start: date
    period_end: date
    total_deliveries: int
    completed: int
    pending: int
    cancelled: int
    average_delivery_time_hours: float
    status_breakdown: List[DeliveryStatusItem]

@strawberry.type
class PaymentMethodItem:
    """Método de pago"""
    method_name: str
    total_transactions: int
    total_amount: float
    percentage: float

@strawberry.type
class FinancialReport:
    """Reporte financiero"""
    period_start: date
    period_end: date
    total_revenue: float
    total_orders: int
    payment_methods: List[PaymentMethodItem]
    average_transaction: float

@strawberry.type
class DashboardStats:
    """Estadísticas generales del dashboard"""
    today_sales: float
    today_orders: int
    total_active_clients: int
    total_active_sellers: int
    total_products: int
    pending_deliveries: int
    low_stock_products: int
    month_revenue: float
    month_orders: int
    
@strawberry.input
class DateRangeInput:
    """Input para rango de fechas"""
    start_date: date
    end_date: date

@strawberry.enum
class ReportPeriod(Enum):
    """Período para reportes"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"
