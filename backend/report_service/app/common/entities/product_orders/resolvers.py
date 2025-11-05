# app/common/entities/product-orders/resolvers.py
import strawberry
from typing import List
from app.common.entities.product_orders.schema import ProductOrderType
from app.common.entities.product_orders.service import get_all_product_orders

@strawberry.type
class ProductOrderQueries:

    @strawberry.field
    async def all_product_orders(self) -> List[ProductOrderType]:
        """Devuelve la lista de todos los productos en órdenes"""
        product_orders = await get_all_product_orders()
        return product_orders
