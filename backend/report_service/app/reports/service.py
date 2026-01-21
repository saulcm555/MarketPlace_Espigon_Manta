# app/reports/service.py
"""
Lógica de negocio para generar reportes
"""
import httpx
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from collections import defaultdict

BASE_URL = "http://127.0.0.1:3000/api"
REST_API_URL = "http://127.0.0.1:3000/api"  # URL del REST service
# Token de servicio interno para comunicación entre microservicios
SERVICE_TOKEN = "internal-service-graphql-reports-2024"

async def resolve_seller_id(seller_identifier: str) -> int:
    """
    Resuelve un seller_identifier (UUID o int) a id_seller numérico.
    Si ya es un número, lo devuelve directamente.
    Si es UUID, consulta el nuevo endpoint /sellers/by-user/:userId.
    """
    # Intentar convertir directamente a int
    try:
        seller_id = int(seller_identifier)
        print(f"✅ [resolve_seller_id] Already numeric: {seller_id}")
        return seller_id
    except (ValueError, TypeError):
        pass
    
    # Es un UUID, hacer lookup usando el nuevo endpoint
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "X-Service-Token": SERVICE_TOKEN,
                "X-Internal-Service": "report-service"
            }
            
            # Usar el nuevo endpoint by-user
            url = f"{BASE_URL}/sellers/by-user/{seller_identifier}"
            print(f"🔍 [resolve_seller_id] Calling: {url}")
            
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            print(f"✅ [resolve_seller_id] Response: {data}")
            
            # Extraer id_seller
            if isinstance(data, dict) and "id_seller" in data:
                seller_id = int(data["id_seller"])
                print(f"✅ [resolve_seller_id] Resolved UUID {seller_identifier} to id_seller={seller_id}")
                return seller_id
            else:
                print(f"❌ [resolve_seller_id] Invalid response format: {data}")
                raise ValueError(f"Invalid response format from /sellers/by-user")
                
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            print(f"❌ [resolve_seller_id] Seller not found for user_id={seller_identifier}")
            raise ValueError(f"No seller found with user_id={seller_identifier}")
        print(f"❌ [resolve_seller_id] HTTP error {e.response.status_code}: {e}")
        raise ValueError(f"HTTP error resolving seller: {e}")
    except Exception as e:
        print(f"❌ [resolve_seller_id] Unexpected error: {str(e)}")
        raise ValueError(f"Could not resolve seller_id from identifier: {seller_identifier}")

async def fetch_data(endpoint: str, params: Dict[str, Any] = None) -> Any:
    """Función auxiliar para obtener datos del REST API"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Headers con token de servicio interno
            headers = {
                "X-Service-Token": SERVICE_TOKEN,
                "X-Internal-Service": "report-service"
            }
            
            # Para productos, necesitamos obtener todos sin paginación
            # Límite máximo permitido por la validación del REST API es 100
            if endpoint == "/products" and params is None:
                params = {"limit": 100}
            
            response = await client.get(
                f"{BASE_URL}{endpoint}", 
                params=params,
                headers=headers
            )
            response.raise_for_status()
            data = response.json()
            
            # DEBUG: Ver qué devuelve el endpoint
            print(f"DEBUG fetch_data - Endpoint: {endpoint}")
            print(f"DEBUG fetch_data - Response type: {type(data)}")
            print(f"DEBUG fetch_data - Response keys: {data.keys() if isinstance(data, dict) else 'not a dict'}")
            
            # Si el endpoint es /products y devuelve un objeto con paginación,
            # extraer solo el array de productos
            if endpoint == "/products" and isinstance(data, dict) and "products" in data:
                products_array = data["products"]
                print(f"DEBUG fetch_data - Extracted products count: {len(products_array)}")
                return products_array
            
            return data
    except httpx.HTTPError as e:
        print(f"Error fetching {endpoint}: {e}")
        return [] if endpoint.startswith("/") else {}

# ======================= REPORTES DE VENTAS =======================

async def get_sales_report(start_date: date, end_date: date, period: str = "daily"):
    """
    Genera reporte de ventas por período
    """
    from app.reports.schema import SalesReport, SalesReportItem
    
    # Obtener todas las órdenes
    orders = await fetch_data("/orders")
    
    # Validar que sea lista
    if not isinstance(orders, list):
        orders = []
    
    # Filtrar por rango de fechas y estado (solo completadas/entregadas)
    filtered_orders = []
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_orders.append(order)
        except (KeyError, ValueError, TypeError):
            continue
    
    # Calcular totales
    total_revenue = sum(float(order["total_amount"]) for order in filtered_orders)
    total_orders = len(filtered_orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0.0
    
    # Agrupar por período
    sales_by_period = defaultdict(lambda: {"total": 0.0, "count": 0})
    
    for order in filtered_orders:
        order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
        
        if period == "daily":
            key = order_date.isoformat()
        elif period == "weekly":
            key = f"{order_date.year}-W{order_date.isocalendar()[1]}"
        elif period == "monthly":
            key = f"{order_date.year}-{order_date.month:02d}"
        else:  # yearly
            key = str(order_date.year)
        
        sales_by_period[key]["total"] += float(order["total_amount"])
        sales_by_period[key]["count"] += 1
    
    # Convertir a lista de items
    sales_items = [
        SalesReportItem(
            period=period_key,
            total_sales=data["total"],
            total_orders=data["count"],
            average_order_value=data["total"] / data["count"] if data["count"] > 0 else 0.0
        )
        for period_key, data in sorted(sales_by_period.items())
    ]
    
    return SalesReport(
        start_date=start_date,
        end_date=end_date,
        total_revenue=total_revenue,
        total_orders=total_orders,
        average_order_value=avg_order_value,
        sales_by_period=sales_items
    )

async def get_top_sellers_report(start_date: date, end_date: date, limit: int = 10):
    """
    Reporte de mejores vendedores
    """
    from app.reports.schema import TopSellersReport, TopSellerItem
    
    # Obtener órdenes y productos
    orders = await fetch_data("/orders")
    product_orders = await fetch_data("/product-orders")
    products = await fetch_data("/products")
    sellers = await fetch_data("/sellers")
    
    # Validar que sean listas
    if not isinstance(orders, list):
        orders = []
    if not isinstance(product_orders, list):
        product_orders = []
    if not isinstance(products, list):
        products = []
    if not isinstance(sellers, list):
        sellers = []
    
    # Filtrar órdenes por fecha y estado (solo completadas/entregadas)
    filtered_orders = []
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_orders.append(order)
        except (KeyError, ValueError, TypeError):
            continue
    
    order_ids = set()
    for o in filtered_orders:
        try:
            order_ids.add(o["id_order"])
        except (KeyError, TypeError):
            continue
    
    # Agrupar por vendedor
    seller_stats = defaultdict(lambda: {"sales": 0.0, "orders": set(), "products_sold": 0})
    
    # Mapear productos a vendedores
    product_to_seller = {}
    for p in products:
        try:
            product_to_seller[p["id_product"]] = p["id_seller"]
        except (KeyError, TypeError):
            continue
    
    seller_info = {}
    for s in sellers:
        try:
            seller_info[s["id_seller"]] = s
        except (KeyError, TypeError):
            continue
    
    for po in product_orders:
        try:
            if po["id_order"] in order_ids:
                seller_id = product_to_seller.get(po["id_product"])
                if seller_id:
                    seller_stats[seller_id]["sales"] += float(po.get("subtotal", 0))
                    seller_stats[seller_id]["orders"].add(po["id_order"])
                    seller_stats[seller_id]["products_sold"] += 1
        except (KeyError, TypeError, ValueError):
            continue
    
    # Convertir a lista y ordenar
    top_sellers = []
    for seller_id, stats in seller_stats.items():
        if seller_id in seller_info:
            seller = seller_info[seller_id]
            try:
                top_sellers.append(TopSellerItem(
                    seller_id=seller_id,
                    seller_name=seller.get("seller_name", "Unknown"),
                    business_name=seller.get("bussines_name", "N/A"),
                    total_sales=stats["sales"],
                    total_orders=len(stats["orders"]),
                    products_sold=stats["products_sold"]
                ))
            except (KeyError, TypeError):
                continue
    
    # Ordenar por ventas totales
    top_sellers.sort(key=lambda x: x.total_sales, reverse=True)
    
    return TopSellersReport(
        period_start=start_date,
        period_end=end_date,
        top_sellers=top_sellers[:limit]
    )

async def get_best_products_report(start_date: date, end_date: date, limit: int = 20):
    """
    Reporte de productos más vendidos
    """
    from app.reports.schema import BestProductsReport, ProductSalesItem
    
    # Obtener datos necesarios
    orders = await fetch_data("/orders")
    product_orders = await fetch_data("/product-orders")
    products = await fetch_data("/products")
    categories = await fetch_data("/categories")
    
    # Validar que sean listas
    if not isinstance(orders, list):
        orders = []
    if not isinstance(product_orders, list):
        product_orders = []
    if not isinstance(products, list):
        products = []
    if not isinstance(categories, list):
        categories = []
    
    # Filtrar órdenes por fecha y estado (solo completadas/entregadas)
    filtered_orders = []
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_orders.append(order)
        except (KeyError, TypeError, ValueError):
            continue
    
    # Crear set de order_ids de forma segura
    order_ids = set()
    for o in filtered_orders:
        try:
            order_ids.add(o["id_order"])
        except (KeyError, TypeError):
            continue
    
    # Agrupar por producto
    product_stats = defaultdict(lambda: {"units": 0, "revenue": 0.0, "prices": []})
    
    for po in product_orders:
        try:
            if po["id_order"] in order_ids:
                product_stats[po["id_product"]]["units"] += 1
                product_stats[po["id_product"]]["revenue"] += float(po["subtotal"])
                product_stats[po["id_product"]]["prices"].append(float(po["price_unit"]))
        except (KeyError, TypeError, ValueError):
            continue
    
    # Mapear productos y categorías de forma segura
    product_info = {}
    for p in products:
        try:
            product_info[p["id_product"]] = p
        except (KeyError, TypeError):
            continue
    
    category_info = {}
    for c in categories:
        try:
            category_info[c["id_category"]] = c["category_name"]
        except (KeyError, TypeError):
            continue
    
    # Crear lista de productos
    best_products = []
    for product_id, stats in product_stats.items():
        try:
            if product_id in product_info:
                product = product_info[product_id]
                best_products.append(ProductSalesItem(
                    product_id=product_id,
                    product_name=product.get("product_name", "Desconocido"),
                    category_name=category_info.get(product.get("id_category"), "Sin categoría"),
                    units_sold=stats["units"],
                    total_revenue=stats["revenue"],
                    average_price=sum(stats["prices"]) / len(stats["prices"]) if stats["prices"] else 0.0
                ))
        except (KeyError, TypeError, ZeroDivisionError):
            continue
    
    # Ordenar por unidades vendidas
    best_products.sort(key=lambda x: x.units_sold, reverse=True)
    
    return BestProductsReport(
        period_start=start_date,
        period_end=end_date,
        best_products=best_products[:limit]
    )

async def get_category_sales_report(start_date: date, end_date: date):
    """
    Reporte de ventas por categoría
    """
    from app.reports.schema import CategorySalesReport, CategorySalesItem
    
    orders = await fetch_data("/orders")
    product_orders = await fetch_data("/product-orders")
    products = await fetch_data("/products")
    categories = await fetch_data("/categories")
    
    # DEBUG: Imprimir órdenes recibidas
    print(f"\n=== DEBUG CATEGORY SALES ===")
    print(f"Total órdenes recibidas: {len(orders) if isinstance(orders, list) else 0}")
    print(f"Rango de fechas solicitado: {start_date} a {end_date}")
    
    # Validar que sean listas
    if not isinstance(orders, list):
        orders = []
    if not isinstance(product_orders, list):
        product_orders = []
    if not isinstance(products, list):
        products = []
    if not isinstance(categories, list):
        categories = []
    
    # Filtrar órdenes por fecha y estado (solo completadas/entregadas)
    filtered_orders = []
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            
            # DEBUG: Imprimir cada orden
            print(f"Orden #{order.get('id_order')}: fecha={order_date}, estado='{order_status}', monto={order.get('total_amount')}")
            
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_orders.append(order)
                print(f"  ✓ INCLUIDA en reporte")
            else:
                if not (start_date <= order_date <= end_date):
                    print(f"  ✗ Fuera de rango de fechas")
                elif order_status not in ["completed", "delivered"]:
                    print(f"  ✗ Estado no válido: '{order_status}'")
        except (KeyError, TypeError, ValueError) as e:
            print(f"  ✗ Error procesando orden: {e}")
            continue
    
    print(f"Total órdenes filtradas: {len(filtered_orders)}")
    print(f"=========================\n")
    
    # Crear set de order_ids de forma segura
    order_ids = set()
    for o in filtered_orders:
        try:
            order_ids.add(o["id_order"])
        except (KeyError, TypeError):
            continue
    
    # Mapear productos a categorías de forma segura
    product_to_category = {}
    for p in products:
        try:
            product_to_category[p["id_product"]] = p["id_category"]
        except (KeyError, TypeError):
            continue
    
    category_info = {}
    for c in categories:
        try:
            category_info[c["id_category"]] = c
        except (KeyError, TypeError):
            continue
    
    # Agrupar por categoría
    category_stats = defaultdict(lambda: {"sales": 0.0, "orders": set(), "products": set()})
    
    for po in product_orders:
        try:
            if po["id_order"] in order_ids:
                category_id = product_to_category.get(po["id_product"])
                if category_id:
                    category_stats[category_id]["sales"] += float(po["subtotal"])
                    category_stats[category_id]["orders"].add(po["id_order"])
                    category_stats[category_id]["products"].add(po["id_product"])
        except (KeyError, TypeError, ValueError):
            continue
    
    # Crear lista
    category_items = []
    for cat_id, stats in category_stats.items():
        try:
            if cat_id in category_info:
                category_items.append(CategorySalesItem(
                    category_id=cat_id,
                    category_name=category_info[cat_id].get("category_name", "Sin nombre"),
                    total_sales=stats["sales"],
                    total_orders=len(stats["orders"]),
                    products_count=len(stats["products"])
                ))
        except (KeyError, TypeError):
            continue
    
    # Ordenar por ventas
    category_items.sort(key=lambda x: x.total_sales, reverse=True)
    
    return CategorySalesReport(
        period_start=start_date,
        period_end=end_date,
        categories=category_items
    )

# REPORTE DE CLIENTES

async def get_clients_report(start_date: date, end_date: date, top_limit: int = 10):
    """
    Reporte de actividad de clientes
    """
    from app.reports.schema import ClientsReport, ClientActivityItem
    
    clients = await fetch_data("/clients")
    orders = await fetch_data("/orders")
    
    # Validar que sean listas
    if not isinstance(clients, list):
        clients = []
    if not isinstance(orders, list):
        orders = []
    
    # Filtrar órdenes por fecha y estado (solo completadas/entregadas)
    filtered_orders = []
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_orders.append(order)
        except (KeyError, TypeError, ValueError):
            continue
    
    # Clientes nuevos en el período
    new_clients = 0
    for client in clients:
        try:
            created_at = datetime.fromisoformat(client["created_at"].replace("Z", "")).date()
            if start_date <= created_at <= end_date:
                new_clients += 1
        except (KeyError, TypeError, ValueError):
            continue
    
    # Agrupar actividad por cliente
    client_activity = defaultdict(lambda: {"orders": 0, "spent": 0.0, "last_order": None})
    
    for order in filtered_orders:
        try:
            client_id = order["id_client"]
            client_activity[client_id]["orders"] += 1
            client_activity[client_id]["spent"] += float(order["total_amount"])
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", ""))
            if not client_activity[client_id]["last_order"] or order_date > client_activity[client_id]["last_order"]:
                client_activity[client_id]["last_order"] = order_date
        except (KeyError, TypeError, ValueError):
            continue
    
    # Mapear info de clientes de forma segura
    client_info = {}
    for c in clients:
        try:
            client_info[c["id_client"]] = c
        except (KeyError, TypeError):
            continue
    
    # Crear lista de top clientes
    top_clients = []
    for client_id, activity in client_activity.items():
        try:
            if client_id in client_info:
                client = client_info[client_id]
                top_clients.append(ClientActivityItem(
                    client_id=client_id,
                    client_name=client.get("client_name", "Desconocido"),
                    client_email=client.get("client_email", ""),
                    total_orders=activity["orders"],
                    total_spent=activity["spent"],
                    last_order_date=activity["last_order"]
                ))
        except (KeyError, TypeError):
            continue
    
    # Ordenar por gasto total
    top_clients.sort(key=lambda x: x.total_spent, reverse=True)
    
    return ClientsReport(
        period_start=start_date,
        period_end=end_date,
        total_clients=len(clients),
        new_clients=new_clients,
        active_clients=len(client_activity),
        top_clients=top_clients[:top_limit]
    )

# ======================= REPORTES DE INVENTARIO =======================

async def get_inventory_report(min_stock_threshold: int = 10):
    """
    Reporte de inventario y productos con bajo stock
    """
    from app.reports.schema import InventoryReport, LowStockItem
    
    products = await fetch_data("/products")
    sellers = await fetch_data("/sellers")
    
    # Validar que sean listas
    if not isinstance(products, list):
        products = []
    if not isinstance(sellers, list):
        sellers = []
    
    # Mapear sellers de forma segura
    seller_info = {}
    for s in sellers:
        try:
            seller_info[s["id_seller"]] = s["seller_name"]
        except (KeyError, TypeError):
            continue
    
    out_of_stock = 0
    low_stock = 0
    critical_items = []
    
    for product in products:
        try:
            stock = product["stock"]
            
            if stock == 0:
                out_of_stock += 1
                status = "critical"
            elif stock <= min_stock_threshold:
                low_stock += 1
                status = "warning"
            else:
                status = "ok"
            
            if status in ["critical", "warning"]:
                critical_items.append(LowStockItem(
                    product_id=product.get("id_product", 0),
                    product_name=product.get("product_name", "Desconocido"),
                    seller_name=seller_info.get(product.get("id_seller"), "Desconocido"),
                    current_stock=stock,
                    min_stock_threshold=min_stock_threshold,
                    status=status
                ))
        except (KeyError, TypeError):
            continue
    
    # Ordenar por stock (críticos primero)
    critical_items.sort(key=lambda x: (0 if x.status == "critical" else 1, x.current_stock))
    
    return InventoryReport(
        total_products=len(products),
        out_of_stock=out_of_stock,
        low_stock=low_stock,
        critical_products=critical_items
    )

# ======================= REPORTES DE DELIVERY =======================

async def get_delivery_performance_report(start_date: date, end_date: date):
    """
    Reporte de performance de entregas
    """
    from app.reports.schema import DeliveryPerformanceReport, DeliveryStatusItem
    
    deliveries = await fetch_data("/deliveries")
    orders = await fetch_data("/orders")
    
    # Validar que sean listas
    if not isinstance(deliveries, list):
        deliveries = []
    if not isinstance(orders, list):
        orders = []
    
    # Filtrar órdenes por fecha y estado (solo completadas/entregadas)
    filtered_order_ids = set()
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_order_ids.add(order["id_order"])
        except (KeyError, TypeError, ValueError):
            continue
    
    # Filtrar deliveries relacionados
    filtered_deliveries = []
    for delivery in deliveries:
        try:
            # Buscar orden asociada
            for order in orders:
                try:
                    if order.get("id_delivery") == delivery["id_delivery"] and order["id_order"] in filtered_order_ids:
                        filtered_deliveries.append(delivery)
                        break
                except (KeyError, TypeError):
                    continue
        except (KeyError, TypeError):
            continue
    
    # Contar por estado
    status_count = defaultdict(int)
    completed = 0
    pending = 0
    cancelled = 0
    total_delivery_time = 0
    completed_count = 0
    
    for delivery in filtered_deliveries:
        try:
            status = delivery["status"]
            status_count[status] += 1
            
            if status == "Entregado":
                completed += 1
                # Calcular tiempo de entrega (estimado - actual)
                # Simplificado: asumimos que el tiempo está en horas
                completed_count += 1
            elif status == "Cancelado":
                cancelled += 1
            else:
                pending += 1
        except (KeyError, TypeError):
            continue
    
    total = len(filtered_deliveries)
    
    # Crear breakdown de estados
    status_items = [
        DeliveryStatusItem(
            status=status,
            count=count,
            percentage=(count / total * 100) if total > 0 else 0.0
        )
        for status, count in status_count.items()
    ]
    
    return DeliveryPerformanceReport(
        period_start=start_date,
        period_end=end_date,
        total_deliveries=total,
        completed=completed,
        pending=pending,
        cancelled=cancelled,
        average_delivery_time_hours=24.0,  # Valor placeholder (necesitas calcular real)
        status_breakdown=status_items
    )

# REPORTE FINANCIERO

async def get_financial_report(start_date: date, end_date: date):
    """
    Reporte financiero con métodos de pago
    """
    from app.reports.schema import FinancialReport, PaymentMethodItem
    
    orders = await fetch_data("/orders")
    payment_methods = await fetch_data("/payment-methods")
    
    # Validar que sean listas
    if not isinstance(orders, list):
        orders = []
    if not isinstance(payment_methods, list):
        payment_methods = []
    
    # Filtrar órdenes por fecha y estado (solo completadas/entregadas)
    filtered_orders = []
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            order_status = order.get("status", "").lower()
            # Solo contar órdenes completadas o entregadas
            if start_date <= order_date <= end_date and order_status in ["completed", "delivered"]:
                filtered_orders.append(order)
        except (KeyError, TypeError, ValueError):
            continue
    
    # Calcular totales de forma segura
    total_revenue = 0.0
    for o in filtered_orders:
        try:
            total_revenue += float(o["total_amount"])
        except (KeyError, TypeError, ValueError):
            continue
    
    total_orders = len(filtered_orders)
    avg_transaction = total_revenue / total_orders if total_orders > 0 else 0.0
    
    # Agrupar por método de pago
    payment_stats = defaultdict(lambda: {"count": 0, "amount": 0.0})
    
    # Mapear payment methods de forma segura
    payment_info = {}
    for pm in payment_methods:
        try:
            payment_info[pm["id_payment_method"]] = pm["method_name"]
        except (KeyError, TypeError):
            continue
    
    for order in filtered_orders:
        try:
            pm_id = order["id_payment_method"]
            pm_name = payment_info.get(pm_id, "Desconocido")
            payment_stats[pm_name]["count"] += 1
            payment_stats[pm_name]["amount"] += float(order["total_amount"])
        except (KeyError, TypeError, ValueError):
            continue
    
    # Crear items
    payment_items = [
        PaymentMethodItem(
            method_name=method,
            total_transactions=stats["count"],
            total_amount=stats["amount"],
            percentage=(stats["amount"] / total_revenue * 100) if total_revenue > 0 else 0.0
        )
        for method, stats in payment_stats.items()
    ]
    
    # Ordenar por monto
    payment_items.sort(key=lambda x: x.total_amount, reverse=True)
    
    return FinancialReport(
        period_start=start_date,
        period_end=end_date,
        total_revenue=total_revenue,
        total_orders=total_orders,
        payment_methods=payment_items,
        average_transaction=avg_transaction
    )

# DASHBOARD STATS

async def get_dashboard_stats():
    """
    Estadísticas generales para el dashboard
    """
    from app.reports.schema import DashboardStats
    
    today = date.today()
    month_start = date(today.year, today.month, 1)
    
    # Obtener datos
    orders = await fetch_data("/orders")
    clients = await fetch_data("/clients")
    sellers = await fetch_data("/sellers")
    products = await fetch_data("/products")
    deliveries = await fetch_data("/deliveries")
    
    # DEBUG: Imprimir lo que viene de productos
    print(f"DEBUG - Productos recibidos: {products}")
    print(f"DEBUG - Tipo de productos: {type(products)}")
    if isinstance(products, list):
        print(f"DEBUG - Cantidad de productos: {len(products)}")
        if len(products) > 0:
            print(f"DEBUG - Primer producto: {products[0]}")
    
    # Validar que los datos sean listas
    if not isinstance(orders, list):
        orders = []
    if not isinstance(clients, list):
        clients = []
    if not isinstance(sellers, list):
        sellers = []
    if not isinstance(products, list):
        products = []
    if not isinstance(deliveries, list):
        deliveries = []
    
    # Calcular stats de hoy (TODAS las órdenes, sin importar status)
    today_orders = []
    for o in orders:
        try:
            order_date = datetime.fromisoformat(o["order_date"].replace("Z", "")).date()
            # Contar todas las órdenes del día, excepto las canceladas
            order_status = o.get("status", "").lower()
            if order_date == today and order_status not in ["cancelled", "expired"]:
                today_orders.append(o)
        except (KeyError, ValueError, TypeError):
            continue
    
    today_sales = sum(float(o.get("total_amount", 0)) for o in today_orders)
    
    # Calcular stats del mes (TODAS las órdenes, sin importar status)
    month_orders = []
    for o in orders:
        try:
            order_date = datetime.fromisoformat(o["order_date"].replace("Z", "")).date()
            # Contar todas las órdenes del mes, excepto las canceladas
            order_status = o.get("status", "").lower()
            if order_date >= month_start and order_status not in ["cancelled", "expired"]:
                month_orders.append(o)
        except (KeyError, ValueError, TypeError):
            continue
    
    month_revenue = sum(float(o.get("total_amount", 0)) for o in month_orders)
    
    # Deliveries pendientes
    pending_deliveries = 0
    for d in deliveries:
        try:
            if d.get("status") not in ["Entregado", "Cancelado"]:
                pending_deliveries += 1
        except (KeyError, TypeError):
            continue
    
    # Productos con bajo stock
    low_stock = 0
    for p in products:
        try:
            if p.get("stock", 0) <= 10:
                low_stock += 1
        except (KeyError, TypeError):
            continue
    
    return DashboardStats(
        today_sales=today_sales,
        today_orders=len(today_orders),
        total_active_clients=len(clients),
        total_active_sellers=len(sellers),
        total_products=len(products),
        pending_deliveries=pending_deliveries,
        low_stock_products=low_stock,
        month_revenue=month_revenue,
        month_orders=len(month_orders)
    )

# ======================= PRODUCTOS MEJOR VALORADOS =======================

async def get_top_rated_products_report(limit: int = 20):
    """
    Genera reporte de productos mejor valorados basado en reseñas
    """
    from app.reports.schema import TopRatedProductsReport, TopRatedProductItem
    
    # Obtener todos los productos
    products = await fetch_data("/products")
    if not isinstance(products, list):
        products = []
    
    # Obtener categorías para nombres
    categories = await fetch_data("/categories")
    if not isinstance(categories, list):
        categories = []
    category_map = {c["id_category"]: c["category_name"] for c in categories}
    
    # Para cada producto, obtener sus reseñas
    product_ratings = []
    for product in products:
        try:
            product_id = product["id_product"]
            # Obtener reseñas del producto
            reviews = await fetch_data(f"/orders/products/{product_id}/reviews")
            
            if not isinstance(reviews, list) or len(reviews) == 0:
                continue
            
            # Calcular promedio de rating
            ratings = [r.get("rating", 0) for r in reviews if r.get("rating")]
            if not ratings:
                continue
                
            avg_rating = sum(ratings) / len(ratings)
            
            product_ratings.append(TopRatedProductItem(
                product_id=product_id,
                product_name=product.get("product_name", "Sin nombre"),
                category_name=category_map.get(product.get("id_category"), "Sin categoría"),
                average_rating=round(avg_rating, 2),
                total_reviews=len(reviews),
                units_sold=0  # Podríamos calcularlo desde product_order si es necesario
            ))
        except (KeyError, TypeError, ValueError) as e:
            continue
    
    # Ordenar por rating promedio (descendente) y luego por número de reseñas
    product_ratings.sort(key=lambda x: (x.average_rating, x.total_reviews), reverse=True)
    
    # Limitar resultados
    top_products = product_ratings[:limit]
    
    return TopRatedProductsReport(
        top_products=top_products
    )

# ======================= ESTADÍSTICAS DEL VENDEDOR =======================

async def get_seller_dashboard_stats(seller_identifier: str):
    """
    Genera estadísticas del dashboard específicas para un vendedor
    OPTIMIZADO: Usa endpoint directo del REST API en lugar de procesar todos los datos
    Acepta tanto UUID (user_id) como id_seller numérico
    """
    import time
    from app.reports.schema import SellerDashboardStats
    
    request_start = time.time()
    print(f"🔍 [REPORT_SERVICE] Fetching seller dashboard stats for seller_identifier={seller_identifier}")
    
    # Resolver el seller_identifier a id_seller numérico
    seller_id = await resolve_seller_id(seller_identifier)
    print(f"✅ [REPORT_SERVICE] Resolved seller_id={seller_id}")
    
    # Usar endpoint optimizado que hace la query SQL directamente
    try:
        http_start = time.time()
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "X-Service-Token": SERVICE_TOKEN,
                "X-Internal-Service": "report-service"
            }
            
            url = f"{BASE_URL}/statistics/seller/{seller_id}/dashboard"
            print(f"📡 [REPORT_SERVICE] Calling: {url}")
            
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            http_time = (time.time() - http_start) * 1000
            print(f"⏱️ [REPORT_SERVICE] HTTP call took: {http_time:.2f}ms")
            print(f"✅ [REPORT_SERVICE] Received data: {data}")
            
            stats = SellerDashboardStats(
                seller_id=seller_id,
                today_sales=float(data.get("today_sales", 0)),
                today_orders=int(data.get("today_orders", 0)),
                month_revenue=float(data.get("month_revenue", 0)),
                month_orders=int(data.get("month_orders", 0)),
                total_products=int(data.get("total_products", 0)),
                low_stock_products=int(data.get("low_stock_products", 0)),
                total_revenue=float(data.get("total_revenue", 0)),
                total_orders=int(data.get("total_orders", 0)),
                pending_orders=int(data.get("pending_orders", 0))
            )
            
            total_time = (time.time() - request_start) * 1000
            print(f"⏱️ [REPORT_SERVICE] TOTAL TIME for seller {seller_id}: {total_time:.2f}ms (HTTP: {http_time:.2f}ms)")
            return stats
    except httpx.HTTPError as e:
        print(f"❌ [REPORT_SERVICE] Error fetching seller dashboard stats: {e}")
        # Fallback: retornar valores en cero
        return SellerDashboardStats(
            seller_id=seller_id,
            today_sales=0.0,
            today_orders=0,
            month_revenue=0.0,
            month_orders=0,
            total_products=0,
            low_stock_products=0,
            total_revenue=0.0,
            total_orders=0,
            pending_orders=0
        )

async def get_seller_best_products(seller_identifier: str, start_date: date, end_date: date, limit: int = 10):
    """
    Obtiene los productos más vendidos de un vendedor específico.
    OPTIMIZADO: Usa endpoint optimizado con SQL en REST service.
    Acepta tanto UUID (user_id) como id_seller numérico
    """
    from app.reports.schema import BestProductsReport, ProductSalesItem
    
    print(f"🔍 [get_seller_best_products] Called with seller_identifier={seller_identifier}, start_date={start_date}, end_date={end_date}, limit={limit}")
    
    # Resolver el seller_identifier a id_seller numérico
    seller_id = await resolve_seller_id(seller_identifier)
    print(f"✅ [get_seller_best_products] Resolved seller_id={seller_id}")
    
    try:
        # Llamar al endpoint optimizado del REST service
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "X-Service-Token": "internal-service-graphql-reports-2024",
                "X-Internal-Service": "report-service"
            }
            
            params = {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "limit": limit
            }
            
            url = f"{REST_API_URL}/statistics/seller/{seller_id}/best-products"
            print(f"📡 [get_seller_best_products] Calling URL: {url}")
            print(f"📡 [get_seller_best_products] Params: {params}")
            
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            print(f"✅ [get_seller_best_products] Response received: {data}")
            
            if not data or not isinstance(data, dict):
                print(f"❌ [get_seller_best_products] Invalid response type")
                return BestProductsReport(
                    period_start=start_date,
                    period_end=end_date,
                    best_products=[]
                )
            
            # Convertir respuesta a objetos ProductSalesItem
            best_products_data = data.get("best_products", [])
            print(f"📦 [get_seller_best_products] best_products_data: {best_products_data}")
            
            best_products = [
                ProductSalesItem(
                    product_id=item["product_id"],
                    product_name=item["product_name"],
                    category_name=item["category_name"],
                    units_sold=item["units_sold"],
                    total_revenue=item["total_revenue"],
                    average_price=item["average_price"]
                )
                for item in best_products_data
            ]
            
            print(f"✅ [get_seller_best_products] Returning {len(best_products)} products")
            
            return BestProductsReport(
                period_start=start_date,
                period_end=end_date,
                best_products=best_products
            )
        
    except Exception as e:
        print(f"❌ [get_seller_best_products] Error: {e}")
        import traceback
        traceback.print_exc()
        # Fallback a respuesta vacía
        return BestProductsReport(
            period_start=start_date,
            period_end=end_date,
            best_products=[]
        )


# CÓDIGO VIEJO COMENTADO PARA REFERENCIA
"""
async def get_seller_best_products_OLD(seller_id: int, start_date: date, end_date: date, limit: int = 10):
    # Obtener productos del vendedor
    products = await fetch_data("/products")
    if not isinstance(products, list):
        products = []
    
    seller_products = {p["id_product"]: p for p in products if p.get("id_seller") == seller_id}
    
    if not seller_products:
        return BestProductsReport(
            period_start=start_date,
            period_end=end_date,
            best_products=[]
        )
    
    # Obtener categorías
    categories = await fetch_data("/categories")
    if not isinstance(categories, list):
        categories = []
    category_map = {c["id_category"]: c["category_name"] for c in categories}
    
    # Obtener órdenes
    orders = await fetch_data("/orders")
    if not isinstance(orders, list):
        orders = []
    
    # Estadísticas por producto
    product_stats = defaultdict(lambda: {"units": 0, "revenue": 0.0, "prices": []})
    
    for order in orders:
        try:
            order_date = datetime.fromisoformat(order["order_date"].replace("Z", "")).date()
            
            if not (start_date <= order_date <= end_date):
                continue
            
            product_orders = order.get("productOrders", [])
            
            for po in product_orders:
                product_id = po.get("id_product")
                
                # Solo contar productos de este vendedor
                if product_id in seller_products:
                    quantity = po.get("quantity", 0)
                    price = float(po.get("price_unit", 0))
                    subtotal = float(po.get("subtotal", price * quantity))
                    
                    product_stats[product_id]["units"] += quantity
                    product_stats[product_id]["revenue"] += subtotal
                    product_stats[product_id]["prices"].append(price)
        
        except (KeyError, ValueError, TypeError):
            continue
    
    # Crear lista de productos vendidos
    best_products = []
    for product_id, stats in product_stats.items():
        if stats["units"] > 0:
            product = seller_products[product_id]
            avg_price = sum(stats["prices"]) / len(stats["prices"]) if stats["prices"] else 0.0
            
            best_products.append(ProductSalesItem(
                product_id=product_id,
                product_name=product.get("product_name", "Sin nombre"),
                category_name=category_map.get(product.get("id_category"), "Sin categoría"),
                units_sold=stats["units"],
                total_revenue=round(stats["revenue"], 2),
                average_price=round(avg_price, 2)
            ))
    
    # Ordenar por unidades vendidas
    best_products.sort(key=lambda x: x.units_sold, reverse=True)
    
    return BestProductsReport(
        period_start=start_date,
        period_end=end_date,
        best_products=best_products[:limit]
    )
"""
