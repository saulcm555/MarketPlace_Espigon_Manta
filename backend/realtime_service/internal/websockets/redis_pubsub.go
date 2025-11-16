package websockets

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisPubSub es una implementación de PubSub usando Redis Pub/Sub con
// reconexión automática (backoff exponencial) y cierre ordenado.
type RedisPubSub struct {
	client *redis.Client
	addr   string
	pass   string

	ctx    context.Context
	cancel context.CancelFunc
	sub    *redis.PubSub
	mu     sync.Mutex
	wg     sync.WaitGroup

	// Hub para enviar eventos de estadísticas
	hub *Hub
}

// NewRedisPubSub crea una nueva instancia conectada a la dirección dada.
func NewRedisPubSub(addr, password string, hub *Hub) *RedisPubSub {
	ctx, cancel := context.WithCancel(context.Background())
	r := &RedisPubSub{
		client: redis.NewClient(&redis.Options{Addr: addr, Password: password}),
		addr:   addr,
		pass:   password,
		ctx:    ctx,
		cancel: cancel,
		hub:    hub,
	}
	return r
}

// Start lanza una goroutine que mantiene una suscripción (pattern) en Redis
// y re-intenta la conexión en caso de fallo con backoff exponencial.
func (r *RedisPubSub) Start(handler func(room string, payload []byte)) error {
	r.wg.Add(1)
	go func() {
		defer r.wg.Done()
		base := 100 * time.Millisecond
		max := 5 * time.Second
		randSrc := rand.New(rand.NewSource(time.Now().UnixNano()))

		for {
			select {
			case <-r.ctx.Done():
				return
			default:
			}

			// intentar subscribir
			r.mu.Lock()
			// Suscribirse a dos patrones:
			// 1. ws:room:* para mensajes de salas normales
			// 2. events para eventos de actualización de estadísticas
			r.sub = r.client.PSubscribe(r.ctx, "ws:room:*", "events")
			r.mu.Unlock()

			ch := r.sub.Channel()
			// procesar mensajes hasta que haya un error o cierre
			okloop := true
			for okloop {
				select {
				case <-r.ctx.Done():
					okloop = false
				case msg, ok := <-ch:
					if !ok {
						okloop = false
						break
					}

					// Distinguir entre mensajes de salas y eventos de estadísticas
					if msg.Channel == "events" {
						// Evento de estadísticas: usar BroadcastStatsEvent
						if r.hub != nil {
							r.hub.BroadcastStatsEvent([]byte(msg.Payload))
						}
					} else {
						// Mensaje de sala normal: usar handler
						room := strings.TrimPrefix(msg.Channel, "ws:room:")
						handler(room, []byte(msg.Payload))
					}
				}
			}

			// cerrar la suscripción si existe
			r.mu.Lock()
			if r.sub != nil {
				_ = r.sub.Close()
				r.sub = nil
			}
			r.mu.Unlock()

			// si el contexto fue cancelado, salimos
			select {
			case <-r.ctx.Done():
				return
			default:
			}

			// backoff exponencial con jitter antes de reintentar
			// empezamos en base y doblamos hasta max
			sleep := base
			// añadir jitter
			jitter := time.Duration(randSrc.Int63n(int64(sleep)))
			time.Sleep(sleep + jitter)
			// incrementar base para siguiente ciclo pero cap a max
			for sleep < max {
				sleep = sleep * 2
				if sleep > max {
					sleep = max
					break
				}
			}
		}
	}()
	return nil
}

// Publish publica el payload en el canal para la room.
func (r *RedisPubSub) Publish(room string, payload []byte) error {
	// usar un contexto corto para publicar
	ctx, cancel := context.WithTimeout(r.ctx, 2*time.Second)
	defer cancel()
	channel := fmt.Sprintf("ws:room:%s", room)
	return r.client.Publish(ctx, channel, payload).Err()
}

// Close cancela el contexto, espera a las goroutines y cierra el cliente Redis.
func (r *RedisPubSub) Close() error {
	r.cancel()
	// esperar goroutine de Start
	r.wg.Wait()
	r.mu.Lock()
	if r.sub != nil {
		_ = r.sub.Close()
		r.sub = nil
	}
	r.mu.Unlock()
	return r.client.Close()
}
