package models

import "time"

// Message representa un mensaje genérico para comunicación en tiempo real.
// Puede ser usado para chat, notificaciones, o comunicación entre usuarios.
type Message struct {
	ID        string      `json:"id,omitempty"`
	From      string      `json:"from"`           // UserID del remitente
	To        string      `json:"to,omitempty"`   // UserID del destinatario (opcional)
	Room      string      `json:"room,omitempty"` // Sala/Canal (opcional)
	Type      string      `json:"type"`           // "text", "notification", "system"
	Content   string      `json:"content"`
	Data      interface{} `json:"data,omitempty"` // Datos adicionales
	Timestamp time.Time   `json:"timestamp"`
}
