# app/common/entities/admins/__init__.py
from .models import AdminModel
from .schema import AdminType
from .service import get_all_admins
from .resolvers import AdminQueries

__all__ = ["AdminModel", "AdminType", "get_all_admins", "AdminQueries"]
