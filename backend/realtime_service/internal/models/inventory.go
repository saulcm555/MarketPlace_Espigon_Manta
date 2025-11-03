package models

import "time"

// Inventory representa un inventario simplificado para eventos en tiempo real.
// Sincronizado con InventoryEntity del rest_service.
type Inventory struct {
	IDInventory int       `json:"id_inventory"`
	IDSeller    int       `json:"id_seller"`
	UpdatedAt   time.Time `json:"updated_at"`
}
