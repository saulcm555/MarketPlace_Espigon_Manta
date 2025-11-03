package models

// Cart representa un carrito de compras simplificado para eventos en tiempo real.
// Sincronizado con CartEntity del rest_service.
type Cart struct {
	IDCart    int    `json:"id_cart"`
	IDClient  int    `json:"id_client"`
	Status    string `json:"status"` // "active", "completed", "abandoned"
	IDProduct int    `json:"id_product"`
	Quantity  int    `json:"quantity"`
}
