package models

import "time"

// Seller representa un vendedor simplificado para eventos en tiempo real.
// Sincronizado con SellerEntity del rest_service.
type Seller struct {
	IDSeller     int       `json:"id_seller"`
	SellerName   string    `json:"seller_name"`
	SellerEmail  string    `json:"seller_email"`
	Phone        int64     `json:"phone"`
	BusinessName string    `json:"bussines_name"` // Mantiene el typo del modelo original
	Location     string    `json:"location"`
	CreatedAt    time.Time `json:"created_at"`
}
