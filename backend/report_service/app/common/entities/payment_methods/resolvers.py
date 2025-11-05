# app/common/entities/payment-methods/resolvers.py
import strawberry
from typing import List
from app.common.entities.payment_methods.schema import PaymentMethodType
from app.common.entities.payment_methods.service import get_all_payment_methods

@strawberry.type
class PaymentMethodQueries:

    @strawberry.field
    async def all_payment_methods(self) -> List[PaymentMethodType]:
        """Devuelve la lista de todos los métodos de pago"""
        payment_methods = await get_all_payment_methods()
        return payment_methods
