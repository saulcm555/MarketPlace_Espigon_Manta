from datetime import datetime
from pydantic import BaseModel, Field

class ProductCartModel(BaseModel):
    id_product_cart: int
    id_product: int
    id_cart: int
    quantity: int = Field(..., ge=1)
    added_at: datetime
    updated_at: datetime
