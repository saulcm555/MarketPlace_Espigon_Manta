package models

// Notification representa una notificación en tiempo real que será enviada a través de WebSocket.
// Se utiliza para enviar eventos y datos a clientes específicos o salas.
type Notification struct {
	Event string      `json:"event"` // Tipo de evento: "order_created", "product_updated", etc.
	Data  interface{} `json:"data"`  // Datos del evento (puede ser cualquier tipo de estructura)
	To    string      `json:"to"`    // Destinatario: userID, roomID, o "broadcast"
}
