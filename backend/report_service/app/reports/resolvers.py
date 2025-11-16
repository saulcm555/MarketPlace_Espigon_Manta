# app/reports/resolvers.py
"""
Resolvers GraphQL para los reportes
"""
import strawberry
from typing import Optional
from datetime import date, timedelta
from app.reports.schema import (
    SalesReport,
    TopSellersReport,
    BestProductsReport,
    TopRatedProductsReport,
    CategorySalesReport,
    ClientsReport,
    InventoryReport,
    DeliveryPerformanceReport,
    FinancialReport,
    DashboardStats,
    SellerDashboardStats,
    DateRangeInput,
    ReportPeriod
)
from app.reports.service import (
    get_sales_report,
    get_top_sellers_report,
    get_best_products_report,
    get_top_rated_products_report,
    get_category_sales_report,
    get_clients_report,
    get_inventory_report,
    get_delivery_performance_report,
    get_financial_report,
    get_dashboard_stats,
    get_seller_dashboard_stats,
    get_seller_best_products
)

@strawberry.type
class ReportQueries:
    """
    Queries para reportes y analytics
    """
    
    @strawberry.field
    async def sales_report(
        self,
        date_range: Optional[DateRangeInput] = None,
        period: ReportPeriod = ReportPeriod.DAILY
    ) -> SalesReport:
        """
        Reporte de ventas por período. Por defecto últimos 30 días.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_sales_report(start_date, end_date, period.value)
    
    @strawberry.field
    async def top_sellers_report(
        self,
        date_range: Optional[DateRangeInput] = None,
        limit: int = 10
    ) -> TopSellersReport:
        """
        Reporte de mejores vendedores por ventas totales.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_top_sellers_report(start_date, end_date, limit)
    
    @strawberry.field
    async def best_products_report(
        self,
        date_range: Optional[DateRangeInput] = None,
        limit: int = 20
    ) -> BestProductsReport:
        """
        Reporte de productos más vendidos ordenados por unidades vendidas.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_best_products_report(start_date, end_date, limit)
    
    @strawberry.field
    async def top_rated_products_report(
        self,
        limit: int = 20
    ) -> TopRatedProductsReport:
        """
        Reporte de productos mejor valorados basado en las reseñas de los clientes.
        Ordena por rating promedio y número de reseñas.
        """
        return await get_top_rated_products_report(limit)
    
    @strawberry.field
    async def category_sales_report(
        self,
        date_range: Optional[DateRangeInput] = None
    ) -> CategorySalesReport:
        """
        Reporte de ventas agrupadas por categoría de productos.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_category_sales_report(start_date, end_date)
    
    @strawberry.field
    async def clients_report(
        self,
        date_range: Optional[DateRangeInput] = None,
        top_limit: int = 10
    ) -> ClientsReport:
        """
        Reporte de actividad y comportamiento de clientes.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_clients_report(start_date, end_date, top_limit)
    
    @strawberry.field
    async def inventory_report(
        self,
        min_stock_threshold: int = 10
    ) -> InventoryReport:
        """
        Reporte de inventario con productos de stock bajo o agotados.
        """
        return await get_inventory_report(min_stock_threshold)
    
    @strawberry.field
    async def delivery_performance_report(
        self,
        date_range: Optional[DateRangeInput] = None
    ) -> DeliveryPerformanceReport:
        """
        Reporte de rendimiento y eficiencia de entregas.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_delivery_performance_report(start_date, end_date)
    
    @strawberry.field
    async def financial_report(
        self,
        date_range: Optional[DateRangeInput] = None
    ) -> FinancialReport:
        """
        Reporte financiero con análisis de métodos de pago.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            end_date = date.today()
            start_date = end_date - timedelta(days=30)
        
        return await get_financial_report(start_date, end_date)
    
    @strawberry.field
    async def dashboard_stats(self) -> DashboardStats:
        """
        Estadísticas generales del dashboard (ventas del día, mes, totales, etc).
        """
        return await get_dashboard_stats()
    
    @strawberry.field
    async def seller_dashboard_stats(self, seller_id: int) -> SellerDashboardStats:
        """
        Estadísticas del dashboard específicas para un vendedor.
        Filtra todas las métricas por los productos que pertenecen al vendedor.
        """
        return await get_seller_dashboard_stats(seller_id)
    
    @strawberry.field
    async def seller_best_products(
        self,
        seller_id: int,
        date_range: Optional[DateRangeInput] = None,
        limit: int = 10
    ) -> BestProductsReport:
        """
        Reporte de productos más vendidos de un vendedor específico.
        """
        if date_range:
            start_date = date_range.start_date
            end_date = date_range.end_date
        else:
            # Sin filtro de fechas: mostrar TODAS las ventas históricas
            end_date = date.today()
            start_date = date.today() - timedelta(days=3650)  # 10 años atrás
        
        return await get_seller_best_products(seller_id, start_date, end_date, limit)
