import type { Inventory } from "./inventory.js";

export interface Seller {
	id_seller: number;
	seller_name: string;
	seller_email: string;
	seller_password: string;
	phone: number;
	bussines_name: string;
	location: string;
	created_at: Date;
	inventories?: Inventory[];
}
