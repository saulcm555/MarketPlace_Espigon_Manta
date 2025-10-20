import type { Inventory } from "./inventory";
import { Order } from "./order";
import type { SubCategoryProduct } from "./sub_category";



export interface Product {
	id_product: number;
	id_seller: number;
	id_inventory: number;
	id_category: number;
	id_sub_category: number;
	product_name: string;
	description: string;
	price: number;
	stock: number;
	image_url: string;
	created_at: Date;
	inventory: Inventory;
	subCategoryProducts?: SubCategoryProduct[];
	productOrders?: Order[];
	ProductCart?: any[];
}
