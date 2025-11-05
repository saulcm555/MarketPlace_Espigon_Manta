# app/common/entities/admins/service.py
import httpx
from typing import List
from app.common.entities.admins.schema import AdminType
from app.common.utils import parse_iso_datetime
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_admins() -> List[AdminType]:
    """Obtiene todos los administradores desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/admins")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo admins: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo admins: {e}")
        return []

    # Convertir la respuesta REST en objetos AdminType
    admins = []
    for admin in data:
        try:
            admins.append(AdminType(
                id_admin=admin["id_admin"],
                admin_name=admin["admin_name"],
                admin_email=admin["admin_email"],
                role=admin["role"],
                created_at=parse_iso_datetime(admin.get("created_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en admin: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando admin {admin.get('id_admin')}: {e}")
    
    return admins

