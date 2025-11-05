# app/common/entities/sellers/service.py
import httpx
from typing import List
from app.common.entities.sellers.schema import SellerType
from app.common.utils import parse_iso_datetime, safe_int
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_sellers() -> List[SellerType]:
    """Obtiene todos los vendedores desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/sellers")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo vendedores: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo vendedores: {e}")
        return []

    sellers = []
    for seller in data:
        try:
            sellers.append(SellerType(
                id_seller=seller["id_seller"],
                seller_name=seller["seller_name"],
                seller_email=seller["seller_email"],
                phone=safe_int(seller.get("phone")),
                bussines_name=seller["bussines_name"],
                location=seller["location"],
                created_at=parse_iso_datetime(seller.get("created_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en vendedor: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando vendedor {seller.get('id_seller')}: {e}")
    
    return sellers
