import type { Seller } from "./seller";
import type { Product } from "./product";

export interface Inventory {
	id_inventory: number;
	id_seller: number;
	updated_at: Date;
	seller: Seller;
	products?: Product[];
}
