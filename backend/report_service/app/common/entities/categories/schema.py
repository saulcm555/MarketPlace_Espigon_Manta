import strawberry
from typing import Optional, List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class CategoryType:
    id_category: int
    category_name: str
    description: Optional[str]
    photo: Optional[str]
    
    # Relaciones
    @strawberry.field
    async def subcategories(self) -> List[strawberry.LazyType["SubCategoryType", "app.common.entities.subcategories.schema"]]:
        """Obtiene las subcategorías de esta categoría"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/subcategories?id_category={self.id_category}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.subcategories.schema import SubCategoryType
                return [SubCategoryType(
                    id_sub_category=sub["id_sub_category"],
                    id_category=sub["id_category"],
                    sub_category_name=sub["sub_category_name"],
                    description=sub.get("description")
                ) for sub in data]
        except:
            return []
