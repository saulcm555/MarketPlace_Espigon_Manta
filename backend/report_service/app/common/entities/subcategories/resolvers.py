# app/common/entities/subcategories/resolvers.py
import strawberry
from typing import List
from app.common.entities.subcategories.schema import SubCategoryType
from app.common.entities.subcategories.service import get_all_subcategories

@strawberry.type
class SubCategoryQueries:

    @strawberry.field
    async def all_subcategories(self) -> List[SubCategoryType]:
        """Devuelve la lista de todas las subcategorías"""
        subcategories = await get_all_subcategories()
        return subcategories
