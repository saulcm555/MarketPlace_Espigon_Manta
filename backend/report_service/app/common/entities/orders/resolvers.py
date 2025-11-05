# app/common/entities/orders/resolvers.py
import strawberry
from typing import List
from app.common.entities.orders.schema import OrderType
from app.common.entities.orders.service import get_all_orders

@strawberry.type
class OrderQueries:

    @strawberry.field
    async def all_orders(self) -> List[OrderType]:
        """Devuelve la lista de todas las órdenes"""
        orders = await get_all_orders()
        return orders
