package websockets

// Message define un formato básico para mensajes JSON enviados/recibidos.
type Message struct {
	Type    string                 `json:"type"`
	Payload map[string]interface{} `json:"payload"`
}

// Envelope es la envoltura estándar que enviamos en los broadcasts.
// Contiene metadatos útiles para los clientes (remitente, sala, timestamp)
// y el body original del mensaje.
type Envelope struct {
	From string      `json:"from"`
	Room string      `json:"room"`
	Ts   string      `json:"ts"`
	Body interface{} `json:"body"`
}
