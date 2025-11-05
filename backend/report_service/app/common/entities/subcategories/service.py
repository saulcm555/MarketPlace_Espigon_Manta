# app/common/entities/subcategories/service.py
import httpx
from typing import List
from app.common.entities.subcategories.schema import SubCategoryType
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_subcategories() -> List[SubCategoryType]:
    """Obtiene todas las subcategorías desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/subcategories")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo subcategorías: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo subcategorías: {e}")
        return []

    subcategories = []
    for subcategory in data:
        try:
            subcategories.append(SubCategoryType(
                id_sub_category=subcategory["id_sub_category"],
                id_category=subcategory["id_category"],
                sub_category_name=subcategory["sub_category_name"],
                description=subcategory.get("description")
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en subcategoría: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando subcategoría {subcategory.get('id_sub_category')}: {e}")
    
    return subcategories
