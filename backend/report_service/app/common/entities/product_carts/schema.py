import strawberry
from datetime import datetime
from typing import Optional
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class ProductCartType:
    id_product_cart: int
    id_product: int
    id_cart: int
    quantity: int
    added_at: datetime
    updated_at: datetime
    
    # Relaciones
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
    
    @strawberry.field
    async def cart(self) -> Optional[strawberry.LazyType["CartType", "app.common.entities.carts.schema"]]:
        """Obtiene el carrito"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/carts/{self.id_cart}")
                response.raise_for_status()
                cart = response.json()
                
                from app.common.entities.carts.schema import CartType
                return CartType(
                    id_cart=cart["id_cart"],
                    id_client=cart["id_client"],
                    status=cart["status"],
                    id_product=cart["id_product"],
                    quantity=cart["quantity"]
                )
        except:
            return None
