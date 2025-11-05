from pydantic import BaseModel, Field
from typing import Optional

class SubCategoryModel(BaseModel):
    id_sub_category: int
    id_category: int
    sub_category_name: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
