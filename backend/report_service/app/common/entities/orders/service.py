# app/common/entities/orders/service.py
import httpx
from typing import List
from app.common.entities.orders.schema import OrderType
from app.common.utils import parse_iso_datetime, safe_float
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_orders() -> List[OrderType]:
    """Obtiene todas las órdenes desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/orders")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo órdenes: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo órdenes: {e}")
        return []

    orders = []
    for order in data:
        try:
            orders.append(OrderType(
                id_order=order["id_order"],
                order_date=parse_iso_datetime(order.get("order_date")),
                status=order["status"],
                total_amount=safe_float(order.get("total_amount")),
                delivery_type=order["delivery_type"],
                id_client=order["id_client"],
                id_cart=order["id_cart"],
                id_payment_method=order["id_payment_method"],
                id_delivery=order.get("id_delivery")
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en orden: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando orden {order.get('id_order')}: {e}")
    
    return orders
