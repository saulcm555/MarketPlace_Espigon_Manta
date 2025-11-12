from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal

class DeliveryModel(BaseModel):
    id_delivery: int
    id_product: int
    delivery_address: str = Field(..., min_length=5, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    status: str = Field(..., min_length=2, max_length=50)
    estimated_time: datetime
    delivery_person: str = Field(..., min_length=3, max_length=100)
    delivery_cost: Decimal = Field(..., ge=0)
    phone: str = Field(..., max_length=20)  # Cambiado de int a str
