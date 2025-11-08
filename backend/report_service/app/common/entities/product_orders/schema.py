import strawberry
from datetime import datetime
from typing import Optional, TYPE_CHECKING
import httpx

if TYPE_CHECKING:
    from app.common.entities.products.schema import ProductType
    from app.common.entities.orders.schema import OrderType

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class ProductOrderType:
    id_product_order: int
    id_order: int
    id_product: int
    price_unit: float
    subtotal: float
    created_at: datetime
    rating: Optional[int] = None
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    
    # Relaciones
    @strawberry.field
    async def product(self) -> Optional["ProductType"]:
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
                    created_at=datetime.fromisoformat(p["created_at"].replace("Z", ""))
                )
        except:
            return None
    
    @strawberry.field
    async def order(self) -> Optional["OrderType"]:
        """Obtiene la orden"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/orders/{self.id_order}")
                response.raise_for_status()
                order = response.json()
                
                from app.common.entities.orders.schema import OrderType
                return OrderType(
                    id_order=order["id_order"],
                    order_date=datetime.fromisoformat(order["order_date"].replace("Z", "")),
                    status=order["status"],
                    total_amount=float(order["total_amount"]),
                    delivery_type=order["delivery_type"],
                    id_client=order["id_client"],
                    id_cart=order["id_cart"],
                    id_payment_method=order["id_payment_method"],
                    id_delivery=order.get("id_delivery")
                )
        except:
            return None
