package websockets

import (
	"context"
	"fmt"
	"strings"

	"github.com/go-redis/redis/v8"
)

// RedisPubSub es una implementación simple de PubSub usando Redis Pub/Sub.
type RedisPubSub struct {
	client *redis.Client
	ctx    context.Context
	cancel context.CancelFunc
	sub    *redis.PubSub
}

// NewRedisPubSub crea una nueva instancia conectada a la dirección dada.
func NewRedisPubSub(addr, password string) *RedisPubSub {
	ctx, cancel := context.WithCancel(context.Background())
	r := &RedisPubSub{
		client: redis.NewClient(&redis.Options{Addr: addr, Password: password}),
		ctx:    ctx,
		cancel: cancel,
	}
	return r
}

// Start se suscribe al patrón de canales "ws:room:*" y llama al handler por cada mensaje.
func (r *RedisPubSub) Start(handler func(room string, payload []byte)) error {
	// subscribirse por patrón para cubrir todas las rooms
	r.sub = r.client.PSubscribe(r.ctx, "ws:room:*")

	// lanzar goroutine para procesar mensajes
	go func() {
		ch := r.sub.Channel()
		for {
			select {
			case <-r.ctx.Done():
				return
			case msg, ok := <-ch:
				if !ok {
					return
				}
				// msg.Channel es del formato "ws:room:<room>"
				room := strings.TrimPrefix(msg.Channel, "ws:room:")
				handler(room, []byte(msg.Payload))
			}
		}
	}()

	return nil
}

// Publish publica el payload en el canal para la room.
func (r *RedisPubSub) Publish(room string, payload []byte) error {
	channel := fmt.Sprintf("ws:room:%s", room)
	return r.client.Publish(r.ctx, channel, payload).Err()
}

// Close cancela el contexto y cierra la suscripción y el cliente.
func (r *RedisPubSub) Close() error {
	r.cancel()
	if r.sub != nil {
		_ = r.sub.Close()
	}
	return r.client.Close()
}
