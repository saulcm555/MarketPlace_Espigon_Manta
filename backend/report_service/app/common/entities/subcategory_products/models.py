from pydantic import BaseModel

class SubCategoryProductModel(BaseModel):
    id_sub_category_product: int
    id_sub_category: int
    id_product: int
