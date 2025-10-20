import type { Category } from "./category";
import type { Product } from "./product";

// Relación transaccional sub_category_product
export interface SubCategoryProduct {
	id_sub_category_product: number;
	id_sub_category: number;
	id_product: number;
	subCategory?: SubCategory;
	product?: Product;
}

export interface SubCategory {
	id_sub_category: number;
	id_category: number;
	sub_category_name: string;
	description: string;
	category: Category;
	// Relación con tabla transaccional
	subCategoryProducts?: SubCategoryProduct[];
}
