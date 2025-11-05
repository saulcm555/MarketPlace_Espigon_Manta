# app/common/entities/payment-methods/service.py
import httpx
from typing import List
from app.common.entities.payment_methods.schema import PaymentMethodType
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_payment_methods() -> List[PaymentMethodType]:
    """Obtiene todos los métodos de pago desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/payment_methods")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo métodos de pago: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo métodos de pago: {e}")
        return []

    payment_methods = []
    for payment_method in data:
        try:
            payment_methods.append(PaymentMethodType(
                id_payment_method=payment_method["id_payment_method"],
                method_name=payment_method["method_name"],
                details_payment=payment_method.get("details_payment")
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en método de pago: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando método de pago {payment_method.get('id_payment_method')}: {e}")
    
    return payment_methods
