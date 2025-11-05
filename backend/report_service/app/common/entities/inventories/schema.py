import strawberry
from datetime import datetime
from typing import Optional, List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class InventoryType:
    id_inventory: int
    id_seller: int
    updated_at: datetime
    
    # Relaciones
    @strawberry.field
    async def seller(self) -> Optional[strawberry.LazyType["SellerType", "app.common.entities.sellers.schema"]]:
        """Obtiene el vendedor del inventario"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/sellers/{self.id_seller}")
                response.raise_for_status()
                seller_data = response.json()
                
                from app.common.entities.sellers.schema import SellerType
                return SellerType(
                    id_seller=seller_data["id_seller"],
                    seller_name=seller_data["seller_name"],
                    seller_email=seller_data["seller_email"],
                    phone=seller_data["phone"],
                    bussines_name=seller_data["bussines_name"],
                    location=seller_data["location"],
                    created_at=datetime.fromisoformat(seller_data["created_at"].replace("Z", ""))
                )
        except:
            return None
    
    @strawberry.field
    async def products(self) -> List[strawberry.LazyType["ProductType", "app.common.entities.products.schema"]]:
        """Obtiene los productos del inventario"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/products?id_inventory={self.id_inventory}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.products.schema import ProductType
                return [ProductType(
                    id_product=p["id_product"],
                    id_seller=p["id_seller"],
                    id_inventory=p["id_inventory"],
                    id_category=p["id_category"],
                    id_sub_category=p["id_sub_category"],
                    product_name=p["product_name"],
                    description=p.get("description"),
                    price=float(p["price"]),
                    stock=p["stock"],
                    image_url=p.get("image_url"),
                    created_at=datetime.fromisoformat(p["created_at"].replace("Z", ""))
                ) for p in data]
        except:
            return []
