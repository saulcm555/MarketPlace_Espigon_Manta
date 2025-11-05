# app/common/entities/categories/service.py
import httpx
from typing import List
from app.common.entities.categories.schema import CategoryType
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_categories() -> List[CategoryType]:
    """Obtiene todas las categorías desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/categories")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo categorías: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo categorías: {e}")
        return []

    categories = []
    for category in data:
        try:
            categories.append(CategoryType(
                id_category=category["id_category"],
                category_name=category["category_name"],
                description=category.get("description"),
                photo=category.get("photo")
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en categoría: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando categoría {category.get('id_category')}: {e}")
    
    return categories
