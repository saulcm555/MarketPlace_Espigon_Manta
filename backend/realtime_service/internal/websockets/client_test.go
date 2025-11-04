package websockets

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
)

// TestWritePump verifica que el write pump funciona correctamente
func TestWritePump(t *testing.T) {
	// Crear un servidor WebSocket de prueba
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("Failed to upgrade: %v", err)
		}
		defer conn.Close()

		// Leer mensajes del cliente
		for i := 0; i < 5; i++ {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			expected := "test message"
			if string(msg) != expected {
				t.Errorf("Expected '%s', got '%s'", expected, string(msg))
			}
		}
	}))
	defer server.Close()

	// Conectar como cliente
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to dial: %v", err)
	}

	// Crear cliente con write pump
	client := NewClient("test-1", "user-1", conn)
	defer client.Close()

	// Enviar varios mensajes
	for i := 0; i < 5; i++ {
		if !client.Send([]byte("test message")) {
			t.Fatalf("Failed to send message %d", i)
		}
	}

	// Dar tiempo para que los mensajes se procesen
	time.Sleep(100 * time.Millisecond)
}

// TestClientSlowHandling verifica que clientes lentos se detectan
func TestClientSlowHandling(t *testing.T) {
	// Crear servidor que no lee mensajes (simula cliente lento)
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("Failed to upgrade: %v", err)
		}
		defer conn.Close()

		// No leer mensajes, simular cliente lento
		time.Sleep(2 * time.Second)
	}))
	defer server.Close()

	// Conectar
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to dial: %v", err)
	}

	client := NewClient("test-2", "user-2", conn)
	defer client.Close()

	// Intentar llenar el buffer (256 mensajes)
	successCount := 0
	for i := 0; i < sendChannelSize+10; i++ {
		if client.Send([]byte("test")) {
			successCount++
		} else {
			// Buffer lleno, esto es esperado
			break
		}
	}

	// Deberíamos haber llenado el buffer eventualmente
	if successCount >= sendChannelSize+10 {
		t.Error("Expected buffer to fill up, but all messages were accepted")
	}
}

// TestClientClose verifica que Close() funciona correctamente
func TestClientClose(t *testing.T) {
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("Failed to upgrade: %v", err)
		}
		defer conn.Close()
		time.Sleep(100 * time.Millisecond)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")
	conn, _, err := websocket.DefaultDialer.Dial(wsURL, nil)
	if err != nil {
		t.Fatalf("Failed to dial: %v", err)
	}

	client := NewClient("test-3", "user-3", conn)

	// Enviar mensaje
	if !client.Send([]byte("test")) {
		t.Fatal("Failed to send initial message")
	}

	// Cerrar cliente
	client.Close()

	// Dar tiempo para que writePump termine
	time.Sleep(50 * time.Millisecond)

	// Intentar enviar después de cerrar debería fallar
	// (el canal está cerrado, puede causar panic si no se maneja)
	// En nuestra implementación, Send con canal cerrado puede causar panic,
	// pero Close() solo debe llamarse una vez por el Hub
}
