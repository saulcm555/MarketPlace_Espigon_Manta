from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal

class ProductModel(BaseModel):
    id_product: int
    id_seller: int
    id_inventory: int
    id_category: int
    id_sub_category: int
    product_name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0)
    stock: int = Field(..., ge=0)
    image_url: Optional[str] = None
    created_at: datetime
