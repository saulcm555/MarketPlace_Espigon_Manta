import type { Seller } from "./seller.js";
import type { Product } from "./product.js";

export interface Inventory {
	id_inventory: number;
	id_seller: number;
	updated_at: Date;
	seller: Seller;
	products?: Product[];
}
