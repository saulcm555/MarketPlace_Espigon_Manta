# app/common/entities/deliveries/resolvers.py
import strawberry
from typing import List
from app.common.entities.deliveries.schema import DeliveryType
from app.common.entities.deliveries.service import get_all_deliveries

@strawberry.type
class DeliveryQueries:

    @strawberry.field
    async def all_deliveries(self) -> List[DeliveryType]:
        """Devuelve la lista de todos los envíos"""
        deliveries = await get_all_deliveries()
        return deliveries
