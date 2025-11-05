from pydantic import BaseModel, Field

class CartModel(BaseModel):
    id_cart: int
    id_client: int
    status: str = Field(..., min_length=2, max_length=50)
    id_product: int
    quantity: int = Field(..., ge=1)