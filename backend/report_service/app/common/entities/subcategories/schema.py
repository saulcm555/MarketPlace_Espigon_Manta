import strawberry
from typing import Optional, List
from datetime import datetime
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class SubCategoryType:
    id_sub_category: int
    id_category: int
    sub_category_name: str
    description: Optional[str]
    
    # Relaciones
    @strawberry.field
    async def category(self) -> Optional[strawberry.LazyType["CategoryType", "app.common.entities.categories.schema"]]:
        """Obtiene la categoría padre"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/categories/{self.id_category}")
                response.raise_for_status()
                cat_data = response.json()
                
                from app.common.entities.categories.schema import CategoryType
                return CategoryType(
                    id_category=cat_data["id_category"],
                    category_name=cat_data["category_name"],
                    description=cat_data.get("description"),
                    photo=cat_data.get("photo")
                )
        except:
            return None
    
    @strawberry.field
    async def subcategory_products(self) -> List[strawberry.LazyType["SubCategoryProductType", "app.common.entities.subcategory_products.schema"]]:
        """Obtiene las relaciones producto-subcategoría"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/subcategory-products?id_sub_category={self.id_sub_category}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.subcategory_products.schema import SubCategoryProductType
                return [SubCategoryProductType(
                    id_sub_category_product=scp["id_sub_category_product"],
                    id_sub_category=scp["id_sub_category"],
                    id_product=scp["id_product"]
                ) for scp in data]
        except:
            return []
