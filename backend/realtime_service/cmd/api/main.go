package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/config"
	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/db"
	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/handlers"
	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/services"
	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/websockets"
)

// main es el punto de entrada del servicio de tiempo real.
// Inicializa configuración, Redis, WebSocket Hub y endpoints HTTP.
func main() {
	// Cargar configuración desde variables de entorno
	cfg := config.LoadConfig()
	log.Printf("Starting realtime_service on port %s (env: %s)", cfg.Port, cfg.Environment)

	// Inicializar conexión a Redis (opcional pero recomendado para pub/sub)
	if err := db.InitRedis(); err != nil {
		log.Printf("Warning: Redis not available: %v", err)
		log.Println("Service will run without Redis pub/sub support")
	} else {
		log.Printf("Redis connected successfully at %s", cfg.RedisAddr)
		defer db.CloseRedis()
	}

	// Crear y arrancar el Hub de WebSockets
	hub := websockets.NewHub()
	go hub.Run()

	// Configurar Redis Pub/Sub si está disponible
	if db.RedisClient != nil {
		ps := websockets.NewRedisPubSub(cfg.RedisAddr, cfg.RedisPassword, hub)
		if err := hub.SetPubSub(ps); err != nil {
			log.Printf("Warning: could not start redis pubsub: %v", err)
		} else {
			log.Printf("Redis pub/sub started successfully (listening to 'ws:room:*' and 'events')")
		}
	}

	// Crear servicio de notificaciones y su handler
	notifService := services.NewNotificationService(hub)
	notifHandler := handlers.NewNotificationHandler(notifService)

	// Endpoint WebSocket principal
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websockets.ServeWS(hub, w, r)
	})

	// Endpoint para enviar notificaciones desde otros servicios
	http.HandleFunc("/api/notify", notifHandler.HandleSendNotification)

	// Endpoint de administración: devuelve conteo de clientes y miembros por sala
	http.HandleFunc("/admin/clients", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(hub.Snapshot())
	})

	// Endpoint de health check
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status":  "healthy",
			"service": "realtime_service",
		})
	})

	// Configurar servidor HTTP
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	// Manejar shutdown ordenado
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("Realtime service listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	<-stop
	log.Println("Shutting down gracefully...")

	// Contexto para shutdown con timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Cerrar recursos del hub (pubsub)
	if err := hub.Close(); err != nil {
		log.Printf("Error closing hub: %v", err)
	}

	// Shutdown del servidor HTTP
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}

	log.Println("Server stopped successfully")
}
