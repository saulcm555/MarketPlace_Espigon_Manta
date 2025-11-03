package websockets

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"
)

// backendResponse estructura la respuesta esperada del backend para autorización.
type backendResponse struct {
	Allowed bool `json:"allowed"`
}

// CanJoinRoom verifica si un usuario puede unirse a una sala específica.
//
// Comportamiento:
//   - Si BACKEND_URL está configurado, realiza una llamada HTTP al backend para validar acceso.
//     Endpoints esperados: GET {BACKEND_URL}/orders/{id}/can_access?user_id=<id>
//     El endpoint debe retornar 200 con JSON {"allowed":true} en caso de éxito.
//
// - Si BACKEND_URL no está configurado, realiza validación basada en claims:
//   - room formato `order-{id}`: usuario puede unirse si claims.UserID == id, o si claims.Role == "admin".
//   - room formato `seller-{id}`: usuario puede unirse si claims.SellerID == id o claims.Role == "seller" o "admin".
//
// Retorna (true, nil) cuando está permitido, (false, nil) cuando no, o (false, err) en errores inesperados.
func CanJoinRoom(ctx context.Context, userID string, claims *Claims, room string) (bool, error) {
	// Fast path: if room is empty, deny
	if room == "" {
		return false, nil
	}

	backend := strings.TrimRight(os.Getenv("BACKEND_URL"), "/")
	if backend != "" {
		// Validación runtime vía HTTP
		client := &http.Client{Timeout: 3 * time.Second}

		// Construir URL según el tipo de sala
		var url string
		if strings.HasPrefix(room, "order-") {
			id := strings.TrimPrefix(room, "order-")
			url = backend + "/orders/" + id + "/can_access?user_id=" + userID
		} else if strings.HasPrefix(room, "seller-") {
			id := strings.TrimPrefix(room, "seller-")
			url = backend + "/sellers/" + id + "/can_access?user_id=" + userID
		} else {
			// endpoint genérico de validación
			url = backend + "/ws/can_join?room=" + room + "&user_id=" + userID
		}

		req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
		if err != nil {
			return false, err
		}

		resp, err := client.Do(req)
		if err != nil {
			return false, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			// tratar no-200 como no permitido (pero no fatal)
			return false, nil
		}

		var br backendResponse
		if err := json.NewDecoder(resp.Body).Decode(&br); err != nil {
			return false, err
		}
		return br.Allowed, nil
	}

	// Fallback: validación basada en claims
	switch {
	case strings.HasPrefix(room, "order-"):
		id := strings.TrimPrefix(room, "order-")
		if claims == nil {
			return false, nil
		}
		if claims.UserID == id || claims.Role == "admin" {
			return true, nil
		}
		return false, nil

	case strings.HasPrefix(room, "seller-"):
		id := strings.TrimPrefix(room, "seller-")
		if claims == nil {
			return false, nil
		}
		if claims.SellerID == id || claims.Role == "seller" || claims.Role == "admin" {
			return true, nil
		}
		return false, nil

	default:
		// para salas desconocidas, requiere admin o mismo usuario
		if claims == nil {
			return false, nil
		}
		if claims.UserID == userID || claims.Role == "admin" {
			return true, nil
		}
		return false, nil
	}
}

// ErrInvalidRoomFormat puede ser retornado por helpers cuando el nombre de sala es malformado.
var ErrInvalidRoomFormat = errors.New("invalid room format")
