# app/common/entities/subcategory-products/resolvers.py
import strawberry
from typing import List
from app.common.entities.subcategory_products.schema import SubCategoryProductType
from app.common.entities.subcategory_products.service import get_all_subcategory_products

@strawberry.type
class SubCategoryProductQueries:

    @strawberry.field
    async def all_subcategory_products(self) -> List[SubCategoryProductType]:
        """Devuelve la lista de todas las relaciones subcategoría-producto"""
        subcategory_products = await get_all_subcategory_products()
        return subcategory_products
