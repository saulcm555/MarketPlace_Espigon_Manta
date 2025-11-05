from pydantic import BaseModel, Field
from typing import Optional

class PaymentMethodModel(BaseModel):
    id_payment_method: int
    method_name: str = Field(..., min_length=3, max_length=100)
    details_payment: Optional[str] = None
