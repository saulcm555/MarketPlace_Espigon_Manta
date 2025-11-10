import type { Client } from "./client";
import type { PaymentMethod } from "./payment_method";
import type { Product } from "./product";
import type { Cart } from "./cart";

// Relación transaccional product_order
export interface ProductOrder {
	id_product_order: number;
	id_order: number;
	id_product: number;
	price_unit: number;
	subtotal: number;
	created_at: Date;
	rating?: number;
	review_comment?: string;
	reviewed_at?: Date;
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
	payment_receipt_url?: string; // URL del comprobante de pago en Supabase Storage
	payment_verified_at?: Date; // Fecha de verificación del pago
	client?: Client;
	cart?: Cart; // Relación con el carrito
	payment_method?: PaymentMethod; // Cambiado de paymentMethod a payment_method para consistencia
	productOrders?: ProductOrder[];
}
