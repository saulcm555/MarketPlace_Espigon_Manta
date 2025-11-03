package models

import "time"

// Client representa un cliente simplificado para eventos en tiempo real.
// Sincronizado con ClientEntity del rest_service.
type Client struct {
	IDClient            int        `json:"id_client"`
	ClientName          string     `json:"client_name"`
	ClientEmail         string     `json:"client_email"`
	Address             string     `json:"address"`
	Phone               string     `json:"phone,omitempty"`
	DocumentType        string     `json:"document_type,omitempty"` // 'cedula', 'dni', 'pasaporte', 'ruc'
	DocumentNumber      string     `json:"document_number,omitempty"`
	BirthDate           *time.Time `json:"birth_date,omitempty"`
	AvatarURL           string     `json:"avatar_url,omitempty"`
	AdditionalAddresses string     `json:"additional_addresses,omitempty"` // JSON string
	CreatedAt           time.Time  `json:"created_at"`
}
