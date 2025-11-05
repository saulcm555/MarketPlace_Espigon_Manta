# app/common/entities/categories/resolvers.py
import strawberry
from typing import List
from app.common.entities.categories.schema import CategoryType
from app.common.entities.categories.service import get_all_categories

@strawberry.type
class CategoryQueries:

    @strawberry.field
    async def all_categories(self) -> List[CategoryType]:
        """Devuelve la lista de todas las categorías"""
        categories = await get_all_categories()
        return categories
