import strawberry
from datetime import datetime
from typing import Optional, List
import httpx

BASE_URL = "http://127.0.0.1:3000/api"

@strawberry.type
class ProductType:
    id_product: int
    id_seller: int
    id_inventory: int
    id_category: int
    id_sub_category: int
    product_name: str
    description: Optional[str]
    price: float
    stock: int
    image_url: Optional[str]
    created_at: datetime
    
    # Relaciones
    @strawberry.field
    async def seller(self) -> Optional[strawberry.LazyType["SellerType", "app.common.entities.sellers.schema"]]:
        """Obtiene el vendedor del producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/sellers/{self.id_seller}")
                response.raise_for_status()
                seller_data = response.json()
                
                from app.common.entities.sellers.schema import SellerType
                return SellerType(
                    id_seller=seller_data["id_seller"],
                    seller_name=seller_data["seller_name"],
                    seller_email=seller_data["seller_email"],
                    phone=seller_data["phone"],
                    bussines_name=seller_data["bussines_name"],
                    location=seller_data["location"],
                    created_at=datetime.fromisoformat(seller_data["created_at"].replace("Z", ""))
                )
        except:
            return None
    
    @strawberry.field
    async def category(self) -> Optional[strawberry.LazyType["CategoryType", "app.common.entities.categories.schema"]]:
        """Obtiene la categoría del producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/categories/{self.id_category}")
                response.raise_for_status()
                cat_data = response.json()
                
                from app.common.entities.categories.schema import CategoryType
                return CategoryType(
                    id_category=cat_data["id_category"],
                    category_name=cat_data["category_name"],
                    description=cat_data.get("description"),
                    photo=cat_data.get("photo")
                )
        except:
            return None
    
    @strawberry.field
    async def inventory(self) -> Optional[strawberry.LazyType["InventoryType", "app.common.entities.inventories.schema"]]:
        """Obtiene el inventario del producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/inventories/{self.id_inventory}")
                response.raise_for_status()
                inv_data = response.json()
                
                from app.common.entities.inventories.schema import InventoryType
                return InventoryType(
                    id_inventory=inv_data["id_inventory"],
                    id_seller=inv_data["id_seller"],
                    updated_at=datetime.fromisoformat(inv_data["updated_at"].replace("Z", ""))
                )
        except:
            return None
    
    @strawberry.field
    async def subcategory_products(self) -> List[strawberry.LazyType["SubCategoryProductType", "app.common.entities.subcategory_products.schema"]]:
        """Obtiene las relaciones subcategoría-producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/subcategory-products?id_product={self.id_product}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.subcategory_products.schema import SubCategoryProductType
                return [SubCategoryProductType(
                    id_sub_category_product=scp["id_sub_category_product"],
                    id_sub_category=scp["id_sub_category"],
                    id_product=scp["id_product"]
                ) for scp in data]
        except:
            return []
    
    @strawberry.field
    async def product_orders(self) -> List[strawberry.LazyType["ProductOrderType", "app.common.entities.product_orders.schema"]]:
        """Obtiene las órdenes que contienen este producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/product-orders?id_product={self.id_product}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.product_orders.schema import ProductOrderType
                return [ProductOrderType(
                    id_product_order=po["id_product_order"],
                    id_order=po["id_order"],
                    id_product=po["id_product"],
                    price_unit=float(po["price_unit"]),
                    subtotal=float(po["subtotal"]),
                    created_at=datetime.fromisoformat(po["created_at"].replace("Z", ""))
                ) for po in data]
        except:
            return []
    
    @strawberry.field
    async def product_carts(self) -> List[strawberry.LazyType["ProductCartType", "app.common.entities.product_carts.schema"]]:
        """Obtiene los carritos que contienen este producto"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BASE_URL}/product-carts?id_product={self.id_product}")
                response.raise_for_status()
                data = response.json()
                
                from app.common.entities.product_carts.schema import ProductCartType
                return [ProductCartType(
                    id_product_cart=pc["id_product_cart"],
                    id_product=pc["id_product"],
                    id_cart=pc["id_cart"],
                    quantity=pc["quantity"],
                    added_at=datetime.fromisoformat(pc["added_at"].replace("Z", "")),
                    updated_at=datetime.fromisoformat(pc["updated_at"].replace("Z", ""))
                ) for pc in data]
        except:
            return []
