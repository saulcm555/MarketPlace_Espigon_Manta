# app/common/entities/deliveries/service.py
import httpx
from typing import List
from app.common.entities.deliveries.schema import DeliveryType
from app.common.utils import parse_iso_datetime, safe_float
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_deliveries() -> List[DeliveryType]:
    """Obtiene todas las entregas desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/deliveries")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo entregas: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo entregas: {e}")
        return []

    deliveries = []
    for delivery in data:
        try:
            deliveries.append(DeliveryType(
                id_delivery=delivery["id_delivery"],
                id_product=delivery["id_product"],
                delivery_address=delivery["delivery_address"],
                city=delivery["city"],
                status=delivery["status"],
                estimated_time=parse_iso_datetime(delivery.get("estimated_time")),
                delivery_person=delivery["delivery_person"],
                delivery_cost=safe_float(delivery.get("delivery_cost")),
                phone=str(delivery.get("phone", ""))  # Convertir a string
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en entrega: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando entrega {delivery.get('id_delivery')}: {e}")
    
    return deliveries
