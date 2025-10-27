package websockets

// Message define un formato básico para mensajes JSON enviados/recibidos.
type Message struct {
    Type    string                 `json:"type"`
    Payload map[string]interface{} `json:"payload"`
}
