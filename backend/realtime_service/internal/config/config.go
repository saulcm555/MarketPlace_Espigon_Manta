package config

import "os"

// Config contiene la configuración del servicio de tiempo real.
// Lee variables de entorno necesarias para la operación del servicio.
type Config struct {
	Port          string
	JWTSecret     string
	RedisAddr     string
	RedisPassword string
	Environment   string // "development", "production"
}

// LoadConfig lee las variables de entorno y retorna la configuración.
// Establece valores por defecto cuando las variables no están definidas.
func LoadConfig() *Config {
	c := &Config{
		Port:          os.Getenv("PORT"),
		JWTSecret:     os.Getenv("JWT_SECRET"),
		RedisAddr:     os.Getenv("REDIS_ADDR"),
		RedisPassword: os.Getenv("REDIS_PASSWORD"),
		Environment:   os.Getenv("ENVIRONMENT"),
	}

	// Valores por defecto
	if c.Port == "" {
		c.Port = "8080"
	}
	if c.RedisAddr == "" {
		c.RedisAddr = "localhost:6379"
	}
	if c.Environment == "" {
		c.Environment = "development"
	}

	return c
}
