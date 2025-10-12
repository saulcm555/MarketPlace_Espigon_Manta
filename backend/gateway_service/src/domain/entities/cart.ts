import type { Product } from "./product";
import type { Client } from "./client";
import { Order } from "./order.js";

export interface Cart {
	id_cart: number;
	id_client: number;
    status: string;
	id_product: number;
	quantity: number;
	product?: Product;
    order?: Order;
    client: Client;

}
