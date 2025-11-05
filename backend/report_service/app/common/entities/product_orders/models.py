from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal

class ProductOrderModel(BaseModel):
    id_product_order: int
    id_order: int
    id_product: int
    price_unit: Decimal = Field(..., ge=0)
    subtotal: Decimal = Field(..., ge=0)
    created_at: datetime
