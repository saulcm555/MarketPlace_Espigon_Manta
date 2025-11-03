package websockets

import "sync"

// Hub mantiene clientes conectados y salas activas.
// Es el núcleo central que gestiona todas las conexiones WebSocket.
type Hub struct {
	clients map[string]*Client            // clientID -> Client
	rooms   map[string]map[string]*Client // roomID -> clientID -> Client
	mu      sync.RWMutex
	pub     PubSub // Sistema de pub/sub (ej: Redis)
}

// NewHub crea un Hub nuevo.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[string]*Client),
		rooms:   make(map[string]map[string]*Client),
	}
}

// Run puede contener lógica de background (canales) en producción.
// En esta implementación simple, no requiere lógica activa.
func (h *Hub) Run() {
	// PoC: no loop necesario aquí; en producción usar register/unregister canales
}

// Register añade un cliente al Hub.
func (h *Hub) Register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[c.ID] = c
}

// Unregister elimina un cliente del Hub y de todas sus salas.
func (h *Hub) Unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, c.ID)
	// eliminar de cualquier sala en la que esté
	for room, members := range h.rooms {
		if _, ok := members[c.ID]; ok {
			delete(members, c.ID)
			// si la sala queda vacía, eliminar la entrada
			if len(members) == 0 {
				delete(h.rooms, room)
			}
		}
	}
}

// SendToUser envía un mensaje a todas las conexiones del mismo userID.
func (h *Hub) SendToUser(userID string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, c := range h.clients {
		if c.UserID == userID {
			_ = c.Send(msg)
		}
	}
}

// JoinRoom añade un cliente a una sala.
func (h *Hub) JoinRoom(room string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	members, ok := h.rooms[room]
	if !ok {
		members = make(map[string]*Client)
		h.rooms[room] = members
	}
	members[c.ID] = c
	c.Join(room)
}

// LeaveRoom elimina un cliente de una sala.
func (h *Hub) LeaveRoom(room string, c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if members, ok := h.rooms[room]; ok {
		delete(members, c.ID)
		c.Leave(room)
		if len(members) == 0 {
			delete(h.rooms, room)
		}
	}
}

// BroadcastRoom envía un mensaje a todos los miembros de una sala.
func (h *Hub) BroadcastRoom(room string, msg []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if members, ok := h.rooms[room]; ok {
		for _, c := range members {
			_ = c.Send(msg)
		}
	}
}

// PublishRoom envía el mensaje localmente y lo publica en el PubSub si está configurado.
// Esto permite comunicación entre múltiples instancias del servicio.
func (h *Hub) PublishRoom(room string, msg []byte) {
	// enviar localmente
	h.BroadcastRoom(room, msg)
	// publicar en pubsub para que otras instancias repliquen
	if h.pub != nil {
		_ = h.pub.Publish(room, msg)
	}
}

// SetPubSub configura una implementación de PubSub y la inicia si es necesario.
func (h *Hub) SetPubSub(p PubSub) error {
	h.pub = p
	if p == nil {
		return nil
	}
	// iniciar la suscripción para recibir mensajes de otras instancias
	return h.pub.Start(func(room string, payload []byte) {
		// cuando recibimos desde PubSub, solo difundimos localmente (no re-publicamos)
		h.BroadcastRoom(room, payload)
	})
}

// Snapshot devuelve información resumida del Hub para monitorización.
// Retorna el número total de clientes y un mapa room -> número de miembros.
func (h *Hub) Snapshot() map[string]interface{} {
	h.mu.RLock()
	defer h.mu.RUnlock()
	rooms := make(map[string]int)
	for room, members := range h.rooms {
		rooms[room] = len(members)
	}
	return map[string]interface{}{
		"clients": len(h.clients),
		"rooms":   rooms,
	}
}

// Close limpia recursos asociados al Hub (por ejemplo, cierra PubSub si existe).
func (h *Hub) Close() error {
	if h.pub != nil {
		return h.pub.Close()
	}
	return nil
}
