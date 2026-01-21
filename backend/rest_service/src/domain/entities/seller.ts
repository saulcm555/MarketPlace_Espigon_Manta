import type { Inventory } from "./inventory";

export interface Seller {
	id_seller: number;
	user_id?: string; // Vincula con auth_service.users.id (UUID)
	seller_name: string;
	seller_email: string;
	seller_password: string;
	phone: number;
	bussines_name: string;
	location: string;
	created_at: Date;
	inventories?: Inventory[];
}
