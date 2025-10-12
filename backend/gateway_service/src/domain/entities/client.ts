import { Cart } from "./cart";

export interface Client {
	id_client: number;
	client_name: string;
	client_email: string;
	client_password: string;
	address: string;
	phone?: string;
	document_type?: string; // 'cedula', 'dni', 'pasaporte', etc.
	document_number?: string;
	birth_date?: Date;
	avatar_url?: string;
	additional_addresses?: string; // JSON string con múltiples direcciones
	created_at: Date;
	cart?: Cart[];
}
