import type { SubCategory } from "./sub_category";

export interface Category {
	id_category: number;
	category_name: string;
	description: string;
	photo: string;
	subcategories?: SubCategory[];
}
