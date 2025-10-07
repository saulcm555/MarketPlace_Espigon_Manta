import type { Order } from "./order";

export interface PaymentMethod {
	id_payment_method: number;
	method_name: string;
	details_payment: string;
	orders: Order[];
}
