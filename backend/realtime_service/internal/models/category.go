package models

// Category representa una categoría simplificada para eventos en tiempo real.
// Sincronizado con CategoryEntity del rest_service.
type Category struct {
	IDCategory   int    `json:"id_category"`
	CategoryName string `json:"category_name"`
	Description  string `json:"description,omitempty"`
	Photo        string `json:"photo,omitempty"`
}
