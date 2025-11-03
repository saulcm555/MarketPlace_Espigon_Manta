package models

import "time"

// Delivery representa una entrega simplificada para eventos en tiempo real.
// Sincronizado con DeliveryEntity del rest_service.
type Delivery struct {
	IDDelivery      int       `json:"id_delivery"`
	IDProduct       int       `json:"id_product"`
	DeliveryAddress string    `json:"delivery_address"`
	City            string    `json:"city"`
	Status          string    `json:"status"` // "pending", "in_transit", "delivered"
	EstimatedTime   time.Time `json:"estimated_time"`
	DeliveryPerson  string    `json:"delivery_person"`
	DeliveryCost    float64   `json:"delivery_cost"`
	Phone           int64     `json:"phone"`
}
