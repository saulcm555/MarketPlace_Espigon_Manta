import type { Category } from "./category.js";
import type { Product } from "./product.js";

export interface SubCategory {
	id_sub_category: number;
	id_category: number;
	sub_category_name: string;
	description: string;
	category: Category;
	products?: Product[];
}
