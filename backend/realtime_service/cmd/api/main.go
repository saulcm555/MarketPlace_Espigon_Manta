package main

import (
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

    http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
        websockets.ServeWS(hub, w, r)
    })

    srv := &http.Server{Addr: ":" + port, ReadTimeout: 10 * time.Second, WriteTimeout: 10 * time.Second}
    log.Printf("realtime_service listening on %s", srv.Addr)
    log.Fatal(srv.ListenAndServe())
}
