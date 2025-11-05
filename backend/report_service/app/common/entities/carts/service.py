# app/common/entities/carts/service.py
import httpx
from typing import List
from app.common.entities.carts.schema import CartType
from app.common.utils import safe_int
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_carts() -> List[CartType]:
    """Obtiene todos los carritos desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/carts")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo carritos: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo carritos: {e}")
        return []

    carts = []
    for cart in data:
        try:
            carts.append(CartType(
                id_cart=cart["id_cart"],
                id_client=cart["id_client"],
                status=cart["status"],
                id_product=cart["id_product"],
                quantity=safe_int(cart.get("quantity"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en carrito: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando carrito {cart.get('id_cart')}: {e}")
    
    return carts
