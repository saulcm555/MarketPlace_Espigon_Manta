# app/common/entities/products/resolvers.py
import strawberry
from typing import List
from app.common.entities.products.schema import ProductType
from app.common.entities.products.service import get_all_products

@strawberry.type
class ProductQueries:

    @strawberry.field
    async def all_products(self) -> List[ProductType]:
        """Devuelve la lista de todos los productos"""
        products = await get_all_products()
        return products
