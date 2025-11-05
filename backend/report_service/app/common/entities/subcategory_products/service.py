# app/common/entities/subcategory-products/service.py
import httpx
from typing import List
from app.common.entities.subcategory_products.schema import SubCategoryProductType
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_subcategory_products() -> List[SubCategoryProductType]:
    """Obtiene todas las relaciones subcategoría-producto desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/subcategory-products")
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo subcategoría-productos: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo subcategoría-productos: {e}")
        return []

    subcategory_products = []
    for scp in data:
        try:
            subcategory_products.append(SubCategoryProductType(
                id_sub_category_product=scp["id_sub_category_product"],
                id_sub_category=scp["id_sub_category"],
                id_product=scp["id_product"]
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en subcategoría-producto: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando subcategoría-producto {scp.get('id_sub_category_product')}: {e}")
    
    return subcategory_products
