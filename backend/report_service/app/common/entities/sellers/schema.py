import strawberry
from datetime import datetime
from typing import List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class SellerType:
    id_seller: int
    seller_name: str
    seller_email: str
    phone: str  # Cambiado de int a str
    bussines_name: str
    location: str
    created_at: datetime
    
    # Relaciones
    @strawberry.field
    async def inventories(self) -> List[strawberry.LazyType["InventoryType", "app.common.entities.inventories.schema"]]:
        """Obtiene los inventarios del vendedor"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/inventories?id_seller={self.id_seller}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.inventories.schema import InventoryType
                return [InventoryType(
                    id_inventory=inv["id_inventory"],
                    id_seller=inv["id_seller"],
                    updated_at=datetime.fromisoformat(inv["updated_at"].replace("Z", ""))
                ) for inv in data]
        except:
            return []
