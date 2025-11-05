from pydantic import BaseModel, Field, HttpUrl
from typing import Optional

class CategoryModel(BaseModel):
    id_category: int
    category_name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    photo: Optional[str] = None
