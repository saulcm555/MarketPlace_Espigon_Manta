import strawberry
from typing import Optional, List
from datetime import datetime
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class CartType:
    id_cart: int
    id_client: int
    status: str
    id_product: int
    quantity: int
    
    # Relaciones
    @strawberry.field
    async def client(self) -> Optional[strawberry.LazyType["ClientType", "app.common.entities.clients.schema"]]:
        """Obtiene el cliente del carrito"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/clients/{self.id_client}")
                response.raise_for_status()
                client_data = response.json()
                
                from app.common.entities.clients.schema import ClientType
                from datetime import date
                return ClientType(
                    id_client=client_data["id_client"],
                    client_name=client_data["client_name"],
                    client_email=client_data["client_email"],
                    address=client_data["address"],
                    phone=client_data.get("phone"),
                    document_type=client_data.get("document_type"),
                    document_number=client_data.get("document_number"),
                    birth_date=date.fromisoformat(client_data["birth_date"]) if client_data.get("birth_date") else None,
                    avatar_url=client_data.get("avatar_url"),
                    additional_addresses=client_data.get("additional_addresses"),
                    created_at=datetime.fromisoformat(client_data["created_at"].replace("Z", ""))
                )
        except:
            return None
    
    @strawberry.field
    async def orders(self) -> List[strawberry.LazyType["OrderType", "app.common.entities.orders.schema"]]:
        """Obtiene las órdenes de este carrito"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/orders?id_cart={self.id_cart}")
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
    
    @strawberry.field
    async def product_carts(self) -> List[strawberry.LazyType["ProductCartType", "app.common.entities.product_carts.schema"]]:
        """Obtiene los productos del carrito"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/product-carts?id_cart={self.id_cart}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.product_carts.schema import ProductCartType
                return [ProductCartType(
                    id_product_cart=pc["id_product_cart"],
                    id_product=pc["id_product"],
                    id_cart=pc["id_cart"],
                    quantity=pc["quantity"],
                    added_at=datetime.fromisoformat(pc["added_at"].replace("Z", "")),
                    updated_at=datetime.fromisoformat(pc["updated_at"].replace("Z", ""))
                ) for pc in data]
        except:
            return []
