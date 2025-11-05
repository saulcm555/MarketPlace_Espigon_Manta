# app/common/entities/carts/resolvers.py
import strawberry
from typing import List
from app.common.entities.carts.schema import CartType
from app.common.entities.carts.service import get_all_carts

@strawberry.type
class CartQueries:

    @strawberry.field
    async def all_carts(self) -> List[CartType]:
        """Devuelve la lista de todos los carritos"""
        carts = await get_all_carts()
        return carts
