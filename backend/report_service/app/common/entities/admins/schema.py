import strawberry
from datetime import datetime


@strawberry.type
class AdminType:
    id_admin: int
    admin_name: str
    admin_email: str
    role: str
    created_at: datetime
    
    