from datetime import datetime
from pydantic import BaseModel, Field, EmailStr as email

class AdminModel(BaseModel):
    
    id_admin: int
    admin_name: str = Field(..., min_length=2, max_length=100)
    admin_email: email
    admin_password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., min_length=2, max_length=50)
    created_at: datetime