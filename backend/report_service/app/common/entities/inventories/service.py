# app/common/entities/inventories/service.py
import httpx
from typing import List
from app.common.entities.inventories.schema import InventoryType
from app.common.utils import parse_iso_datetime
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_inventories() -> List[InventoryType]:
    """Obtiene todos los inventarios desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/inventories")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo inventarios: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo inventarios: {e}")
        return []

    inventories = []
    for inventory in data:
        try:
            inventories.append(InventoryType(
                id_inventory=inventory["id_inventory"],
                id_seller=inventory["id_seller"],
                updated_at=parse_iso_datetime(inventory.get("updated_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en inventario: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando inventario {inventory.get('id_inventory')}: {e}")
    
    return inventories
