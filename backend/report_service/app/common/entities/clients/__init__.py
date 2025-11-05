# app/common/entities/clients/__init__.py
from .models import ClientModel
from .schema import ClientType
from .service import get_all_clients
from .resolvers import ClientQueries

__all__ = ["ClientModel", "ClientType", "get_all_clients", "ClientQueries"]
