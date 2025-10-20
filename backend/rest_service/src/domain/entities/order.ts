import type { Client } from "./client";
import type { PaymentMethod } from "./payment_method";
import type { Product } from "./product";

// Relación transaccional product_order
export interface ProductOrder {
	id_product_order: number;
	id_order: number;
	id_product: number;
	price_unit: number;
	subtotal: number;
	created_at: Date;
	order?: Order;
	product?: Product;
}

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
	// Relación con tabla transaccional
	productOrders?: ProductOrder[];
}
