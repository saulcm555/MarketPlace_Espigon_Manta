import type { Product } from "./product";
import type { Client } from "./client";
import { Order } from "./order.js";

// Relación transaccional product_cart
export interface ProductCart {
	id_product_cart: number;
	id_product: number;
	id_cart: number;
	quantity: number;
	added_at: Date;
	updated_at: Date;
	product?: Product;
	cart?: Cart;
}

export interface Cart {
	id_cart: number;
	id_client: number;
    status: string;
	id_product: number;
	quantity: number;
	product?: Product;
    order?: Order;
    client: Client;
	// Relación con tabla transaccional
	productCarts?: ProductCart[];
}
