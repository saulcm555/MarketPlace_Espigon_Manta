import strawberry
from datetime import datetime
from typing import Optional, List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class OrderType:
    id_order: int
    order_date: datetime
    status: str
    total_amount: float
    delivery_type: str
    id_client: int
    id_cart: int
    id_payment_method: int
    id_delivery: Optional[int]
    payment_receipt_url: Optional[str]  # URL del comprobante de pago
    payment_verified_at: Optional[datetime]  # Fecha de verificación del pago
    
    # Payment Service fields (Pilar 2)
    transaction_id: Optional[str]  # ID de transacción del Payment Service
    payment_status: Optional[str]  # Estado del pago: pending, paid, failed
    payment_error: Optional[str]  # Mensaje de error si el pago falló
    
    # Relaciones
    @strawberry.field
    async def client(self) -> Optional[strawberry.LazyType["ClientType", "app.common.entities.clients.schema"]]:
        """Obtiene el cliente de la orden"""
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
    async def payment_method(self) -> Optional[strawberry.LazyType["PaymentMethodType", "app.common.entities.payment_methods.schema"]]:
        """Obtiene el método de pago de la orden"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/payment-methods/{self.id_payment_method}")
                response.raise_for_status()
                pm_data = response.json()
                
                from app.common.entities.payment_methods.schema import PaymentMethodType
                return PaymentMethodType(
                    id_payment_method=pm_data["id_payment_method"],
                    method_name=pm_data["method_name"],
                    details_payment=pm_data.get("details_payment")
                )
        except:
            return None
    
    @strawberry.field
    async def cart(self) -> Optional[strawberry.LazyType["CartType", "app.common.entities.carts.schema"]]:
        """Obtiene el carrito de la orden"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/carts/{self.id_cart}")
                response.raise_for_status()
                cart_data = response.json()
                
                from app.common.entities.carts.schema import CartType
                return CartType(
                    id_cart=cart_data["id_cart"],
                    id_client=cart_data["id_client"],
                    status=cart_data["status"],
                    id_product=cart_data["id_product"],
                    quantity=cart_data["quantity"]
                )
        except:
            return None
    
    @strawberry.field
    async def delivery(self) -> Optional[strawberry.LazyType["DeliveryType", "app.common.entities.deliveries.schema"]]:
        """Obtiene el delivery de la orden"""
        if not self.id_delivery:
            return None
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/deliveries/{self.id_delivery}")
                response.raise_for_status()
                del_data = response.json()
                
                from app.common.entities.deliveries.schema import DeliveryType
                return DeliveryType(
                    id_delivery=del_data["id_delivery"],
                    id_product=del_data["id_product"],
                    delivery_address=del_data["delivery_address"],
                    city=del_data["city"],
                    status=del_data["status"],
                    estimated_time=datetime.fromisoformat(del_data["estimated_time"].replace("Z", "")),
                    delivery_person=del_data["delivery_person"],
                    delivery_cost=float(del_data["delivery_cost"]),
                    phone=del_data["phone"]
                )
        except:
            return None
    
    @strawberry.field
    async def product_orders(self) -> List[strawberry.LazyType["ProductOrderType", "app.common.entities.product_orders.schema"]]:
        """Obtiene los productos de la orden"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/product-orders?id_order={self.id_order}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.product_orders.schema import ProductOrderType
                return [ProductOrderType(
                    id_product_order=po["id_product_order"],
                    id_order=po["id_order"],
                    id_product=po["id_product"],
                    price_unit=float(po["price_unit"]),
                    subtotal=float(po["subtotal"]),
                    created_at=datetime.fromisoformat(po["created_at"].replace("Z", ""))
                ) for po in data]
        except:
            return []
