
export interface Admin {
	id_admin: number;
	user_id?: string; // Vincula con auth_service.users.id (UUID)
	admin_name: string;
	admin_email: string;
	admin_password: string;
	role: string;
	created_at: Date;
}
