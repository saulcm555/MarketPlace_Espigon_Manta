# app/common/entities/products/service.py
import httpx
from typing import List
from app.common.entities.products.schema import ProductType
from app.common.utils import parse_iso_datetime, safe_float, safe_int, extract_data_from_response
import logging

logger = logging.getLogger(__name__)
BASE_URL = "http://127.0.0.1:3000/api"

async def get_all_products() -> List[ProductType]:
    """Obtiene todos los productos desde el REST API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/products?limit=1000")
            response.raise_for_status()
            response_data = response.json()
            
            # Extraer datos (maneja paginación o array directo)
            data = extract_data_from_response(response_data, ['products', 'data'])
                
    except httpx.HTTPError as e:
        logger.error(f"❌ Error HTTP obteniendo productos: {e}")
        return []
    except Exception as e:
        logger.error(f"❌ Error inesperado obteniendo productos: {e}")
        return []

    products = []
    for product in data:
        try:
            products.append(ProductType(
                id_product=product["id_product"],
                id_seller=product["id_seller"],
                id_inventory=product["id_inventory"],
                id_category=product["id_category"],
                id_sub_category=product["id_sub_category"],
                product_name=product["product_name"],
                description=product.get("description"),
                price=safe_float(product.get("price")),
                stock=safe_int(product.get("stock")),
                image_url=product.get("image_url"),
                status=product.get("status", "pending"),  # pending, active, rejected, inactive
                created_at=parse_iso_datetime(product.get("created_at"))
            ))
        except KeyError as e:
            logger.warning(f"⚠️ Campo faltante en producto: {e}")
        except Exception as e:
            logger.error(f"❌ Error procesando producto {product.get('id_product')}: {e}")
    
    return products
