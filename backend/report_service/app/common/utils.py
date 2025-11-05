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
