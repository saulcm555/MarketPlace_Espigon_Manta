import type { Inventory } from "./inventory";
import { Order } from "./order";
import type { SubCategoryProduct } from "./sub_category";
import type { Seller } from "./seller";



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
	status: string;
	created_at: Date;
	inventory: Inventory;
	seller?: Seller;
	subCategoryProducts?: SubCategoryProduct[];
	productOrders?: Order[];
	ProductCart?: any[];
}
