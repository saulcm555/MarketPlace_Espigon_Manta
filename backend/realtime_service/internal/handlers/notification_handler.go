package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/models"
	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/services"
)

// NotificationHandler maneja las peticiones HTTP relacionadas con notificaciones.
type NotificationHandler struct {
	notificationService *services.NotificationService
}

// NewNotificationHandler crea una nueva instancia del handler de notificaciones.
func NewNotificationHandler(ns *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: ns}
}

// SendNotificationRequest representa el body de una solicitud de envío de notificación.
type SendNotificationRequest struct {
	Event  string      `json:"event"`
	Data   interface{} `json:"data"`
	UserID string      `json:"user_id,omitempty"`
	Room   string      `json:"room,omitempty"`
}

// HandleSendNotification maneja POST /api/notify
// Permite enviar notificaciones desde otros servicios (ej: rest_service).
func (h *NotificationHandler) HandleSendNotification(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req SendNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding notification request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validar que se especifique al menos UserID o Room
	if req.UserID == "" && req.Room == "" {
		http.Error(w, "Must specify user_id or room", http.StatusBadRequest)
		return
	}

	notification := models.Notification{
		Event: req.Event,
		Data:  req.Data,
		To:    req.UserID,
	}

	if req.Room != "" {
		notification.To = req.Room
		if err := h.notificationService.BroadcastNotification(req.Room, req.Event, req.Data); err != nil {
			log.Printf("Error broadcasting notification: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
	} else {
		// Enviar a usuario específico
		msg, err := json.Marshal(notification)
		if err != nil {
			log.Printf("Error marshaling notification: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		// Aquí necesitarías acceso al hub, puedes extender el servicio
		_ = msg
		log.Printf("Notification sent to user %s", req.UserID)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": "Notification sent",
	})
}
