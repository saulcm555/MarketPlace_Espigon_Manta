# app/common/entities/product-carts/resolvers.py
import strawberry
from typing import List
from app.common.entities.product_carts.schema import ProductCartType
from app.common.entities.product_carts.service import get_all_product_carts

@strawberry.type
class ProductCartQueries:

    @strawberry.field
    async def all_product_carts(self) -> List[ProductCartType]:
        """Devuelve la lista de todos los productos en carritos"""
        product_carts = await get_all_product_carts()
        return product_carts
