import strawberry
from datetime import datetime, date
from typing import Optional, List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class ClientType:
    id_client: int
    client_name: str
    client_email: str
    address: str
    phone: Optional[str]
    document_type: Optional[str]
    document_number: Optional[str]
    birth_date: Optional[date]
    avatar_url: Optional[str]
    additional_addresses: Optional[str]
    created_at: datetime
    
    # Relaciones
    @strawberry.field
    async def carts(self) -> List[strawberry.LazyType["CartType", "app.common.entities.carts.schema"]]:
        """Obtiene los carritos del cliente"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/carts?id_client={self.id_client}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.carts.schema import CartType
                return [CartType(
                    id_cart=cart["id_cart"],
                    id_client=cart["id_client"],
                    status=cart["status"],
                    id_product=cart["id_product"],
                    quantity=cart["quantity"]
                ) for cart in data]
        except:
            return []
