# app/common/entities/product-carts/service.py
import httpx
from typing import List
from app.common.entities.product_carts.schema import ProductCartType
from app.common.utils import parse_iso_datetime, safe_int
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_product_carts() -> List[ProductCartType]:
    """Obtiene todas las relaciones producto-carrito desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/product-carts")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo producto-carritos: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo producto-carritos: {e}")
        return []

    product_carts = []
    for pc in data:
        try:
            product_carts.append(ProductCartType(
                id_product_cart=pc["id_product_cart"],
                id_product=pc["id_product"],
                id_cart=pc["id_cart"],
                quantity=safe_int(pc.get("quantity")),
                added_at=parse_iso_datetime(pc.get("added_at")),
                updated_at=parse_iso_datetime(pc.get("updated_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en producto-carrito: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando producto-carrito {pc.get('id_product_cart')}: {e}")
    
    return product_carts
