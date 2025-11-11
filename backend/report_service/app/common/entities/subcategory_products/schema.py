import strawberry
from typing import Optional
from datetime import datetime
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class SubCategoryProductType:
    id_sub_category_product: int
    id_sub_category: int
    id_product: int
    
    # Relaciones
    @strawberry.field
    async def sub_category(self) -> Optional[strawberry.LazyType["SubCategoryType", "app.common.entities.subcategories.schema"]]:
        """Obtiene la subcategoría"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/subcategories/{self.id_sub_category}")
                response.raise_for_status()
                sub = response.json()
                
                from app.common.entities.subcategories.schema import SubCategoryType
                return SubCategoryType(
                    id_sub_category=sub["id_sub_category"],
                    id_category=sub["id_category"],
                    sub_category_name=sub["sub_category_name"],
                    description=sub.get("description")
                )
        except:
            return None
    
    @strawberry.field
    async def product(self) -> Optional[strawberry.LazyType["ProductType", "app.common.entities.products.schema"]]:
        """Obtiene el producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/products/{self.id_product}")
                response.raise_for_status()
                p = response.json()
                
                from app.common.entities.products.schema import ProductType
                return ProductType(
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
                    status=p.get("status", "pending"),
                    created_at=datetime.fromisoformat(p["created_at"].replace("Z", ""))
                )
        except:
            return None
