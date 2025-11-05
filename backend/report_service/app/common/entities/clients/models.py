from datetime import datetime, date
from pydantic import BaseModel, Field, EmailStr as email
from typing import Optional

class ClientModel(BaseModel):
    id_client: int
    client_name: str = Field(..., min_length=3, max_length=100)
    client_email: email
    client_password: str = Field(..., min_length=6, max_length=255)
    address: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    document_type: Optional[str] = Field(None, max_length=20)
    document_number: Optional[str] = Field(None, max_length=50)
    birth_date: Optional[date] = None
    avatar_url: Optional[str] = Field(None, max_length=500)
    additional_addresses: Optional[str] = None
    created_at: datetime
