# app/common/utils.py
"""
🛠️ UTILIDADES COMUNES PARA EL REPORT SERVICE
Funciones helper para parseo de datos y manejo de errores
"""
from datetime import datetime, date
from typing import Optional
import logging

# Configurar logger
logger = logging.getLogger(__name__)

def parse_iso_datetime(value: Optional[str]) -> Optional[datetime]:
    """
    Parsea una fecha en formato ISO 8601 de forma segura
    Args:
        value: String con fecha en formato ISO (puede incluir 'Z')
    Returns:
        datetime object o None si falla
    """
    if not value:
        return None
    try:
        # Remover la 'Z' de UTC y parsear
        clean_value = value.replace("Z", "+00:00") if "Z" in value else value
        return datetime.fromisoformat(clean_value.replace("Z", ""))
    except (ValueError, AttributeError) as e:
        logger.warning(f"⚠️ Error parseando datetime '{value}': {e}")
        return None

def parse_iso_date(value: Optional[str]) -> Optional[date]:
    """
    Parsea una fecha (sin hora) en formato ISO de forma segura
    Args:
        value: String con fecha en formato YYYY-MM-DD
    Returns:
        date object o None si falla
    """
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, AttributeError) as e:
        logger.warning(f"⚠️ Error parseando date '{value}': {e}")
        return None

def safe_float(value, default: float = 0.0) -> float:
    """
    Convierte un valor a float de forma segura
    Args:
        value: Valor a convertir
        default: Valor por defecto si falla
    Returns:
        float value o default
    """
    try:
        return float(value) if value is not None else default
    except (ValueError, TypeError):
        return default

def safe_int(value, default: int = 0) -> int:
    """
    Convierte un valor a int de forma segura
    Args:
        value: Valor a convertir
        default: Valor por defecto si falla
    Returns:
        int value o default
    """
    try:
        return int(value) if value is not None else default
    except (ValueError, TypeError):
        return default

def extract_data_from_response(response_data, possible_keys: list = None):
    """
    Extrae datos de una respuesta que puede ser array directo o paginada
    Args:
        response_data: Respuesta del API (dict o list)
        possible_keys: Lista de posibles claves donde están los datos (ej: ['products', 'data', 'orders'])
    Returns:
        Lista de datos
    """
    # Si ya es una lista, devolverla directamente
    if isinstance(response_data, list):
        return response_data
    
    # Si es un dict, buscar las claves posibles
    if isinstance(response_data, dict):
        # Usar las claves proporcionadas o una lista por defecto
        keys_to_try = possible_keys or ['data', 'products', 'orders', 'clients', 'sellers', 'categories']
        
        for key in keys_to_try:
            if key in response_data and isinstance(response_data[key], list):
                return response_data[key]
        
        # Si no encontró ninguna clave conocida, intentar devolver cualquier array
        for value in response_data.values():
            if isinstance(value, list):
                return value
    
    # Si nada funciona, devolver lista vacía
    logger.warning(f"⚠️ No se pudo extraer datos de la respuesta: {type(response_data)}")
    return []
