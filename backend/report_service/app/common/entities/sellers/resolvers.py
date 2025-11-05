# app/common/entities/sellers/resolvers.py
import strawberry
from typing import List
from app.common.entities.sellers.schema import SellerType
from app.common.entities.sellers.service import get_all_sellers

@strawberry.type
class SellerQueries:

    @strawberry.field
    async def all_sellers(self) -> List[SellerType]:
        """Devuelve la lista de todos los vendedores"""
        sellers = await get_all_sellers()
        return sellers
