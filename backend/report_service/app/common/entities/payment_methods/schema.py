import strawberry
from typing import Optional, List
from datetime import datetime
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class PaymentMethodType:
    id_payment_method: int
    method_name: str
    details_payment: Optional[str]
    
    # Relaciones
    @strawberry.field
    async def orders(self) -> List[strawberry.LazyType["OrderType", "app.common.entities.orders.schema"]]:
        """Obtiene las órdenes que usaron este método de pago"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/orders?id_payment_method={self.id_payment_method}")
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
