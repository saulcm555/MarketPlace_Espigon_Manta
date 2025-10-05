import { Order } from "./order.js";

export {}

export interface Delivery {
	id_delivery: number;
	id_product: number;
	delivery_address: string;
	city: string;
	status: string;
	estimated_time: Date;
	delivery_person: string;
	delivery_cost: number;
	phone: number;
	order: Order;
}
