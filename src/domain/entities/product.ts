import type { Inventory } from "./inventory.js";
import { Order } from "./order.js";
import type { Cart } from "./cart.js";
import type { SubCategory } from "./sub_category.js";

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
	subcategory?: SubCategory;
	order?: Order[];
	cart?: Cart[];
}
