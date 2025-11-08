from datetime import datetime
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional

class ProductOrderModel(BaseModel):
    id_product_order: int
    id_order: int
    id_product: int
    price_unit: Decimal = Field(..., ge=0)
    subtotal: Decimal = Field(..., ge=0)
    created_at: datetime
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_comment: Optional[str] = None
    reviewed_at: Optional[datetime] = None
