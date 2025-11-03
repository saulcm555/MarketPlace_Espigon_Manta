package models

// SubCategory representa una subcategoría simplificada para eventos en tiempo real.
// Sincronizado con SubCategoryEntity del rest_service.
type SubCategory struct {
	IDSubCategory   int    `json:"id_sub_category"`
	IDCategory      int    `json:"id_category"`
	SubCategoryName string `json:"sub_category_name"`
	Description     string `json:"description,omitempty"`
}
