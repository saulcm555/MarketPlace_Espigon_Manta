from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class OrderModel(BaseModel):
    id_order: int
    order_date: datetime
    status: str = Field(..., min_length=2, max_length=50)
    total_amount: Decimal = Field(..., ge=0)
    delivery_type: str = Field(..., min_length=2, max_length=100)
    id_client: int
    id_cart: int
    id_payment_method: int
    id_delivery: Optional[int] = None
    payment_receipt_url: Optional[str] = None  # URL del comprobante de pago
    payment_verified_at: Optional[datetime] = None  # Fecha de verificación del pago
    
    # Payment Service fields (Pilar 2)
    transaction_id: Optional[str] = None  # ID de transacción del Payment Service
    payment_status: Optional[str] = None  # Estado del pago: pending, paid, failed
    payment_error: Optional[str] = None  # Mensaje de error si el pago falló
