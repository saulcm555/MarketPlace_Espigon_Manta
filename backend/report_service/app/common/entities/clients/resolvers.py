# app/common/entities/clients/resolvers.py
import strawberry
from typing import List
from app.common.entities.clients.schema import ClientType
from app.common.entities.clients.service import get_all_clients

@strawberry.type
class ClientQueries:

    @strawberry.field
    async def all_clients(self) -> List[ClientType]:
        """Devuelve la lista de todos los clientes"""
        clients = await get_all_clients()
        return clients
