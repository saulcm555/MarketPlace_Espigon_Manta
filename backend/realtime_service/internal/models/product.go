package models

// Product representa un producto simplificado para eventos en tiempo real.
// Sincronizado con ProductEntity del rest_service.
type Product struct {
	IDProduct     int     `json:"id_product"`
	IDSeller      int     `json:"id_seller"`
	IDInventory   int     `json:"id_inventory"`
	IDCategory    int     `json:"id_category"`
	IDSubCategory int     `json:"id_sub_category"`
	ProductName   string  `json:"product_name"`
	Description   string  `json:"description,omitempty"`
	Price         float64 `json:"price"`
	Stock         int     `json:"stock"`
	ImageURL      string  `json:"image_url,omitempty"`
}
