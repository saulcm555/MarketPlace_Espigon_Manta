package websockets

// PubSub define la interfaz mínima que el Hub necesita para publicar y
// suscribirse a mensajes de rooms. Implementaciones concretas (Redis, NATS)
// deben respetar esta interfaz.
type PubSub interface {
	// Publish publica los bytes payload en la "room" indicada.
	Publish(room string, payload []byte) error

	// Start inicia la suscripción y llama al handler por cada mensaje entrante.
	// Debe ejecutarse de forma no bloqueante (puede iniciar goroutine interna).
	Start(handler func(room string, payload []byte)) error

	// Close limpia los recursos.
	Close() error
}
