package websockets

// Message define un formato básico para mensajes JSON enviados/recibidos por WebSocket.
type Message struct {
	Type    string                 `json:"type"`    // Tipo de mensaje: "join", "leave", "broadcast"
	Payload map[string]interface{} `json:"payload"` // Datos del mensaje
}

// Envelope es la envoltura estándar que enviamos en los broadcasts.
// Contiene metadatos útiles para los clientes (remitente, sala, timestamp)
// y el body original del mensaje.
type Envelope struct {
	From string      `json:"from"` // ID del cliente que envía
	Room string      `json:"room"` // Sala donde se envía
	Ts   string      `json:"ts"`   // Timestamp en formato RFC3339
	Body interface{} `json:"body"` // Contenido del mensaje
}
