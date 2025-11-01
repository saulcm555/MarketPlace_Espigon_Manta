package websockets

import (
	"time"

	"github.com/gorilla/websocket"
)

// Client representa una conexión activa.
type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Rooms  map[string]bool // salas a las que está suscrito
}

// Send escribe un mensaje de texto hacia el cliente.
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
