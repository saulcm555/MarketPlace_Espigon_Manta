import type { Client } from "./client.js";
import type { PaymentMethod } from "./payment_method.js";

// Order interface definition
export interface Order {
	id_order: number;
	order_date: Date;
	status: string;
	total_amount: number;
	delivery_type: string;
	id_client: number;
	id_cart: number;
	id_payment_method: number;
	client?: Client;
	paymentMethod: PaymentMethod;
}
