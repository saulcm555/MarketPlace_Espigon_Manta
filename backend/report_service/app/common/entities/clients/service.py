# app/common/entities/clients/service.py
import httpx
from typing import List
from app.common.entities.clients.schema import ClientType
from app.common.utils import parse_iso_datetime, parse_iso_date
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_clients() -> List[ClientType]:
    """Obtiene todos los clientes desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/clients")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo clientes: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo clientes: {e}")
        return []

    clients = []
    for client_data in data:
        try:
            clients.append(ClientType(
                id_client=client_data["id_client"],
                client_name=client_data["client_name"],
                client_email=client_data["client_email"],
                address=client_data["address"],
                phone=client_data.get("phone"),
                document_type=client_data.get("document_type"),
                document_number=client_data.get("document_number"),
                birth_date=parse_iso_date(client_data.get("birth_date")),
                avatar_url=client_data.get("avatar_url"),
                additional_addresses=client_data.get("additional_addresses"),
                created_at=parse_iso_datetime(client_data.get("created_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en cliente: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando cliente {client_data.get('id_client')}: {e}")
    
    return clients
