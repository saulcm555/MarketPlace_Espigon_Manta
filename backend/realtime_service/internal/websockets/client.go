package websockets

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	// writeWait es el tiempo máximo permitido para escribir un mensaje al cliente.
	writeWait = 10 * time.Second

	// sendChannelSize es el tamaño del buffer del canal de envío.
	// Si el buffer se llena, el cliente se considera lento y se desconecta.
	sendChannelSize = 256
)

// Client representa una conexión WebSocket activa.
// Mantiene información del cliente conectado, su conexión y las salas suscritas.
type Client struct {
	ID     string          // Identificador único de la conexión
	UserID string          // ID del usuario autenticado
	Conn   *websocket.Conn // Conexión WebSocket
	Rooms  map[string]bool // Salas a las que está suscrito

	// Canal para enviar mensajes al cliente de forma asíncrona
	send chan []byte

	// closeOnce asegura que el canal send se cierre solo una vez
	closeOnce sync.Once
}

// NewClient crea un nuevo cliente e inicia su write pump.
func NewClient(id, userID string, conn *websocket.Conn) *Client {
	c := &Client{
		ID:     id,
		UserID: userID,
		Conn:   conn,
		Rooms:  make(map[string]bool),
		send:   make(chan []byte, sendChannelSize),
	}

	// Iniciar la goroutine de escritura
	go c.writePump()

	return c
}

// Send envía un mensaje al cliente de forma no bloqueante.
// Si el buffer está lleno (cliente lento), retorna false para indicar
// que el cliente debe ser desconectado.
func (c *Client) Send(msg []byte) bool {
	select {
	case c.send <- msg:
		return true
	default:
		// Buffer lleno, cliente demasiado lento
		log.Printf("Client %s (user %s) is too slow, dropping message", c.ID, c.UserID)
		return false
	}
}

// writePump es la única goroutine que escribe a la conexión WebSocket.
// Lee mensajes del canal send y los escribe a la conexión.
// Se ejecuta hasta que el canal send se cierra.
func (c *Client) writePump() {
	defer func() {
		c.Conn.Close()
		log.Printf("writePump finished for client %s", c.ID)
	}()

	for msg := range c.send {
		c.Conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("Write error for client %s: %v", c.ID, err)
			return
		}
	}
}

// Close cierra el canal de envío, lo que terminará el writePump.
func (c *Client) Close() {
	c.closeOnce.Do(func() {
		close(c.send)
	})
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
