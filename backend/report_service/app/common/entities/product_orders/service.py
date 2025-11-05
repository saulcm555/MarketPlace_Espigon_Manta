# app/common/entities/product-orders/service.py
import httpx
from typing import List
from app.common.entities.product_orders.schema import ProductOrderType
from app.common.utils import parse_iso_datetime, safe_float
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_product_orders() -> List[ProductOrderType]:
    """Obtiene todas las relaciones producto-orden desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/product-orders")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo producto-órdenes: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo producto-órdenes: {e}")
        return []

    product_orders = []
    for po in data:
        try:
            product_orders.append(ProductOrderType(
                id_product_order=po["id_product_order"],
                id_order=po["id_order"],
                id_product=po["id_product"],
                price_unit=safe_float(po.get("price_unit")),
                subtotal=safe_float(po.get("subtotal")),
                created_at=parse_iso_datetime(po.get("created_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en producto-orden: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando producto-orden {po.get('id_product_order')}: {e}")
    
    return product_orders
