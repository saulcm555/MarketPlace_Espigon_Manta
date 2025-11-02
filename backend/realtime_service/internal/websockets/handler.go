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
	CheckOrigin: func(r *http.Request) bool { return true }, // ajustar para producción
}

// ServeWS realiza el upgrade y registra el cliente en el Hub.
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

	// id simple a partir del timestamp (PoC)
	clientID := fmt.Sprintf("conn-%d", time.Now().UnixNano())
	client := &Client{ID: clientID, UserID: claims.UserID, Conn: conn}
	h.Register(client)
	log.Printf("client connected: id=%s user=%s", client.ID, client.UserID)

	// loop de lectura: manejar tipos JSON básicos (join/leave/broadcast) y loguear
	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("read error (%s): %v", client.ID, err)
			break
		}

		// intentar parsear JSON
		var m Message
		if err := json.Unmarshal(msg, &m); err != nil {
			// no JSON -> eco y log
			log.Printf("Received raw message from %s: %s", client.UserID, string(msg))
			_ = client.Send(msg)
			continue
		}

		log.Printf("Received message (type=%s) from %s: %v", m.Type, client.UserID, m.Payload)

		switch m.Type {
		case "join":
			if roomRaw, ok := m.Payload["room"].(string); ok {
				h.JoinRoom(roomRaw, client)
				ack := fmt.Sprintf("joined %s", roomRaw)
				_ = client.Send([]byte(ack))
			}
		case "leave":
			if roomRaw, ok := m.Payload["room"].(string); ok {
				h.LeaveRoom(roomRaw, client)
				ack := fmt.Sprintf("left %s", roomRaw)
				_ = client.Send([]byte(ack))
			}
		case "broadcast":
			// construir envelope estándar y enviarlo a la sala
			if roomRaw, ok := m.Payload["room"].(string); ok {
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
					continue
				}
				// publicar localmente y propagar via PubSub si está configurado
				h.PublishRoom(roomRaw, out)
			}
		default:
			// por defecto, eco
			_ = client.Send(msg)
		}
	}

	h.Unregister(client)
	conn.Close()
	log.Printf("client disconnected: id=%s user=%s", client.ID, client.UserID)
}
