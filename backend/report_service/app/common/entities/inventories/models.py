from datetime import datetime
from pydantic import BaseModel

class InventoryModel(BaseModel):
    id_inventory: int
    id_seller: int
    updated_at: datetime
