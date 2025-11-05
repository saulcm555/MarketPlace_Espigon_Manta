import strawberry
from datetime import datetime
from typing import List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class DeliveryType:
    id_delivery: int
    id_product: int
    delivery_address: str
    city: str
    status: str
    estimated_time: datetime
    delivery_person: str
    delivery_cost: float
    phone: int
    
    # Relaciones
    @strawberry.field
    async def orders(self) -> List[strawberry.LazyType["OrderType", "app.common.entities.orders.schema"]]:
        """Obtiene las órdenes con este delivery"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/orders?id_delivery={self.id_delivery}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.orders.schema import OrderType
                return [OrderType(
                    id_order=order["id_order"],
                    order_date=datetime.fromisoformat(order["order_date"].replace("Z", "")),
                    status=order["status"],
                    total_amount=float(order["total_amount"]),
                    delivery_type=order["delivery_type"],
                    id_client=order["id_client"],
                    id_cart=order["id_cart"],
                    id_payment_method=order["id_payment_method"],
                    id_delivery=order.get("id_delivery")
                ) for order in data]
        except:
            return []
