package db

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient es una instancia global de conexión a Redis.
var RedisClient *redis.Client

// InitRedis inicializa la conexión a Redis usando las variables de entorno.
// Lee REDIS_ADDR y REDIS_PASSWORD desde el entorno.
// Retorna error si no se puede conectar.
func InitRedis() error {
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379" // valor por defecto
	}

	redisPassword := os.Getenv("REDIS_PASSWORD")
	redisDB := 0 // base de datos por defecto

	RedisClient = redis.NewClient(&redis.Options{
		Addr:         redisAddr,
		Password:     redisPassword,
		DB:           redisDB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
		PoolSize:     10,
	})

	// Verificar conectividad
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := RedisClient.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis at %s: %w", redisAddr, err)
	}

	return nil
}

// CloseRedis cierra la conexión a Redis de forma ordenada.
func CloseRedis() error {
	if RedisClient != nil {
		return RedisClient.Close()
	}
	return nil
}
