from datetime import datetime
from pydantic import BaseModel, Field, EmailStr as email

class SellerModel(BaseModel):
    id_seller: int
    seller_name: str = Field(..., min_length=3, max_length=100)
    seller_email: email
    seller_password: str = Field(..., min_length=6, max_length=255)
    phone: str = Field(..., max_length=20)  # Cambiado de int a str para manejar números largos
    bussines_name: str = Field(..., min_length=2, max_length=150)
    location: str = Field(..., min_length=2, max_length=150)
    created_at: datetime
