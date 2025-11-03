package models

import "time"

// Order representa un pedido simplificado para eventos en tiempo real.
// Sincronizado con OrderEntity del rest_service.
type Order struct {
	IDOrder         int       `json:"id_order"`
	OrderDate       time.Time `json:"order_date"`
	Status          string    `json:"status"` // "pending", "confirmed", "delivered", etc.
	TotalAmount     float64   `json:"total_amount"`
	DeliveryType    string    `json:"delivery_type"` // "pickup", "delivery"
	IDClient        int       `json:"id_client"`
	IDCart          int       `json:"id_cart"`
	IDPaymentMethod int       `json:"id_payment_method"`
	IDDelivery      *int      `json:"id_delivery,omitempty"` // Opcional (nullable)
}
