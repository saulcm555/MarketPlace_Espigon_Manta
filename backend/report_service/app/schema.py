# app/schema.py
import strawberry
from app.common.entities.admins.resolvers import AdminQueries
from app.common.entities.clients.resolvers import ClientQueries
from app.common.entities.sellers.resolvers import SellerQueries
from app.common.entities.categories.resolvers import CategoryQueries
from app.common.entities.subcategories.resolvers import SubCategoryQueries
from app.common.entities.products.resolvers import ProductQueries
from app.common.entities.orders.resolvers import OrderQueries
from app.common.entities.carts.resolvers import CartQueries
from app.common.entities.deliveries.resolvers import DeliveryQueries
from app.common.entities.inventories.resolvers import InventoryQueries
from app.reports.resolvers import ReportQueries  

# Combinar todas las queries (por herencia múltiple)
@strawberry.type
class Query(
    AdminQueries,
    ClientQueries,
    SellerQueries,
    CategoryQueries,
    SubCategoryQueries,
    ProductQueries,
    OrderQueries,
    CartQueries,
    DeliveryQueries,
    InventoryQueries,
    ReportQueries,  # 🆕 REPORTES
):
    pass

schema = strawberry.Schema(query=Query)