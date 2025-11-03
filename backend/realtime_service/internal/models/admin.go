package models

import "time"

// Admin representa un administrador simplificado para eventos en tiempo real.
// Sincronizado con AdminEntity del rest_service.
type Admin struct {
	IDAdmin    int       `json:"id_admin"`
	AdminName  string    `json:"admin_name"`
	AdminEmail string    `json:"admin_email"`
	Role       string    `json:"role"` // "super_admin", "admin", etc.
	CreatedAt  time.Time `json:"created_at"`
}
