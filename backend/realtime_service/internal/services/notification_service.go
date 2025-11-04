package services

import (
	"encoding/json"
	"log"

	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/models"
	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/websockets"
)

// NotificationService maneja el envío de notificaciones en tiempo real.
// Proporciona métodos de alto nivel para enviar eventos específicos.
type NotificationService struct {
	hub *websockets.Hub
}

// NewNotificationService crea una nueva instancia del servicio de notificaciones.
func NewNotificationService(hub *websockets.Hub) *NotificationService {
	return &NotificationService{hub: hub}
}

// SendOrderUpdate envía una actualización de pedido a un cliente específico.
func (ns *NotificationService) SendOrderUpdate(userID string, order models.Order) error {
	notification := models.Notification{
		Event: "order_updated",
		Data:  order,
		To:    userID,
	}

	msg, err := json.Marshal(notification)
	if err != nil {
		log.Printf("Error marshaling order update: %v", err)
		return err
	}

	ns.hub.SendToUser(userID, msg)
	log.Printf("Order update sent to user %s: order_id=%d", userID, order.IDOrder)
	return nil
}

// SendProductUpdate envía una actualización de producto a una sala específica.
func (ns *NotificationService) SendProductUpdate(room string, product models.Product) error {
	notification := models.Notification{
		Event: "product_updated",
		Data:  product,
		To:    room,
	}

	msg, err := json.Marshal(notification)
	if err != nil {
		log.Printf("Error marshaling product update: %v", err)
		return err
	}

	ns.hub.PublishRoom(room, msg)
	log.Printf("Product update sent to room %s: product_id=%d", room, product.IDProduct)
	return nil
}

// BroadcastNotification envía una notificación a una sala específica.
func (ns *NotificationService) BroadcastNotification(room string, event string, data interface{}) error {
	notification := models.Notification{
		Event: event,
		Data:  data,
		To:    room,
	}

	msg, err := json.Marshal(notification)
	if err != nil {
		log.Printf("Error marshaling notification: %v", err)
		return err
	}

	ns.hub.PublishRoom(room, msg)
	log.Printf("Notification broadcasted to room %s: event=%s", room, event)
	return nil
}

// SendNotificationToUser envía una notificación a un usuario específico.
func (ns *NotificationService) SendNotificationToUser(userID string, event string, data interface{}) error {
	notification := models.Notification{
		Event: event,
		Data:  data,
		To:    userID,
	}

	msg, err := json.Marshal(notification)
	if err != nil {
		log.Printf("Error marshaling notification: %v", err)
		return err
	}

	ns.hub.SendToUser(userID, msg)
	log.Printf("Notification sent to user %s: event=%s", userID, event)
	return nil
}

// SendToUser envía un mensaje ya serializado directamente a un usuario.
// Útil cuando ya tienes el mensaje en formato []byte y no necesitas serializarlo.
func (ns *NotificationService) SendToUser(userID string, msg []byte) {
	ns.hub.SendToUser(userID, msg)
}
