# app/common/entities/admins/resolvers.py
import strawberry
from typing import List
from app.common.entities.admins.schema import AdminType
from app.common.entities.admins.service import get_all_admins

@strawberry.type
class AdminQueries:

    @strawberry.field
    async def all_admins(self) -> List[AdminType]:
        """Devuelve la lista de todos los administradores"""
        admins = await get_all_admins()
        return admins
