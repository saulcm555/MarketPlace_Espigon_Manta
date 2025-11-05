# app/common/entities/inventories/resolvers.py
import strawberry
from typing import List
from app.common.entities.inventories.schema import InventoryType
from app.common.entities.inventories.service import get_all_inventories

@strawberry.type
class InventoryQueries:

    @strawberry.field
    async def all_inventories(self) -> List[InventoryType]:
        """Devuelve la lista de todos los inventarios"""
        inventories = await get_all_inventories()
        return inventories
