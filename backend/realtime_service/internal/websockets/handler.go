package websockets

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true }, // Ajustar para producción
}

// MaxMessageSize es el tamaño máximo (bytes) aceptado por mensaje. Evita DoS por payloads grandes.
const MaxMessageSize = 8 * 1024 // 8 KB

// sendProtocolError envía un mensaje de error estructurado al cliente.
// Si el envío falla (cliente lento), el cliente será desconectado por el Hub.
func sendProtocolError(c *Client, msg string) {
	resp := map[string]interface{}{
		"type": "error",
		"payload": map[string]string{
			"error": msg,
		},
	}
	b, _ := json.Marshal(resp)
	c.Send(b)
}

// ServeWS realiza el upgrade de la conexión HTTP a WebSocket y registra el cliente en el Hub.
// Maneja la autenticación JWT y el loop de lectura de mensajes.
func ServeWS(h *Hub, w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	// soporte opcional: si no hay header, mirar query param ?token=
	if token == "" {
		if t := r.URL.Query().Get("token"); t != "" {
			token = "Bearer " + t
		}
	}

	claims, err := ValidateToken(token)
	if err != nil {
		// registrar el error para depuración antes de responder 401
		log.Printf("token validation failed: %v", err)
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("upgrade:", err)
		return
	}

	// limitar tamaño de lectura por mensaje
	conn.SetReadLimit(MaxMessageSize)

	// id simple a partir del timestamp (PoC)
	clientID := fmt.Sprintf("conn-%d", time.Now().UnixNano())

	// Crear cliente con NewClient que inicia el writePump automáticamente
	client := NewClient(clientID, claims.UserID, conn)
	h.Register(client)
	log.Printf("client connected: id=%s user=%s", client.ID, client.UserID)

	// Asegurar limpieza al salir
	defer func() {
		h.Unregister(client)
		client.Close() // Cierra el canal send, lo que termina writePump
		log.Printf("client disconnected: id=%s user=%s", client.ID, client.UserID)
	}()

	// loop de lectura: manejar tipos JSON básicos (join/leave/broadcast)
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("read error (%s): %v", client.ID, err)
			break
		}

		// si el mensaje excede el límite, conn.ReadMessage ya lo rechazará, pero
		// por seguridad comprobamos el tamaño aquí también.
		if len(msg) > MaxMessageSize {
			sendProtocolError(client, "message too large")
			break
		}

		// intentar parsear JSON
		var m Message
		if err := json.Unmarshal(msg, &m); err != nil {
			// intentamos parsear pero falló: enviar error estructurado
			log.Printf("invalid JSON from %s: %v", client.UserID, err)
			sendProtocolError(client, "invalid json")
			continue
		}

		// validar tipo y estructura mínima
		if m.Type != "join" && m.Type != "leave" && m.Type != "broadcast" {
			sendProtocolError(client, "unsupported message type")
			continue
		}

		log.Printf("Received message (type=%s) from %s: %v", m.Type, client.UserID, m.Payload)

		switch m.Type {
		case "join":
			roomRaw, ok := m.Payload["room"].(string)
			if !ok || roomRaw == "" {
				sendProtocolError(client, "missing or invalid room for join")
				continue
			}
			// autorización: comprobar que el usuario puede unirse a la room
			allowed, err := CanJoinRoom(r.Context(), claims.UserID, claims, roomRaw)
			if err != nil {
				log.Printf("authorization check error for user=%s room=%s: %v", client.UserID, roomRaw, err)
				sendProtocolError(client, "server error")
				continue
			}
			if !allowed {
				sendProtocolError(client, "not authorized")
				continue
			}
			h.JoinRoom(roomRaw, client)
			ack := fmt.Sprintf("joined %s", roomRaw)
			client.Send([]byte(ack))

		case "leave":
			roomRaw, ok := m.Payload["room"].(string)
			if !ok || roomRaw == "" {
				sendProtocolError(client, "missing or invalid room for leave")
				continue
			}
			h.LeaveRoom(roomRaw, client)
			ack := fmt.Sprintf("left %s", roomRaw)
			client.Send([]byte(ack))

		case "broadcast":
			// construir envelope estándar y enviarlo a la sala
			roomRaw, ok := m.Payload["room"].(string)
			if !ok || roomRaw == "" {
				sendProtocolError(client, "missing or invalid room for broadcast")
				continue
			}
			body := m.Payload["body"]
			env := Envelope{
				From: client.ID,
				Room: roomRaw,
				Ts:   time.Now().UTC().Format(time.RFC3339),
				Body: body,
			}
			out, err := json.Marshal(env)
			if err != nil {
				log.Printf("broadcast marshal error (%s): %v", client.ID, err)
				sendProtocolError(client, "server error")
				continue
			}
			// publicar localmente y propagar via PubSub si está configurado
			h.PublishRoom(roomRaw, out)

		default:
			// por defecto, eco
			client.Send(msg)
		}
	}
	// La limpieza se hace en el defer al inicio de la función
}
