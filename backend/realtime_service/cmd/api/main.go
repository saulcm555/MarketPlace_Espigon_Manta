package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/saulcm555/MarketPlace_Espigon_Manta/backend/realtime_service/internal/websockets"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	hub := websockets.NewHub()
	go hub.Run()

	// Opcional: configurar Redis Pub/Sub si REDIS_ADDR está presente.
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr != "" {
		redisPass := os.Getenv("REDIS_PASSWORD")
		ps := websockets.NewRedisPubSub(redisAddr, redisPass)
		if err := hub.SetPubSub(ps); err != nil {
			log.Printf("warning: could not start redis pubsub: %v", err)
		} else {
			log.Printf("redis pubsub started (addr=%s)", redisAddr)
		}
	}

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		websockets.ServeWS(hub, w, r)
	})

	// endpoint admin ligero: devuelve conteo de clientes y miembros por sala
	http.HandleFunc("/admin/clients", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(hub.Snapshot())
	})

	srv := &http.Server{Addr: ":" + port, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
	log.Printf("realtime_service listening on %s", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
