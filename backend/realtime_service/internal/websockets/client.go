package websockets

import (
	"time"

	"github.com/gorilla/websocket"
)

// Client representa una conexión WebSocket activa.
// Mantiene información del cliente conectado, su conexión y las salas suscritas.
type Client struct {
	ID     string          // Identificador único de la conexión
	UserID string          // ID del usuario autenticado
	Conn   *websocket.Conn // Conexión WebSocket
	Rooms  map[string]bool // Salas a las que está suscrito
}

// Send escribe un mensaje de texto hacia el cliente con timeout.
func (c *Client) Send(msg []byte) error {
	c.Conn.SetWriteDeadline(time.Now().Add(5 * time.Second))
	return c.Conn.WriteMessage(websocket.TextMessage, msg)
}

// Join añade la sala al cliente (memoria local).
func (c *Client) Join(room string) {
	if c.Rooms == nil {
		c.Rooms = make(map[string]bool)
	}
	c.Rooms[room] = true
}

// Leave elimina la sala del cliente (memoria local).
func (c *Client) Leave(room string) {
	if c.Rooms == nil {
		return
	}
	delete(c.Rooms, room)
}
