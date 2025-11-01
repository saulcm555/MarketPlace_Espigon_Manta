package config

import "os"

type Config struct {
    Port      string
    JWTSecret string
}

// LoadConfig reads a couple of env vars; expand as needed.
func LoadConfig() *Config {
    c := &Config{
        Port:      os.Getenv("PORT"),
        JWTSecret: os.Getenv("JWT_SECRET"),
    }
    if c.Port == "" {
        c.Port = "8080"
    }
    return c
}
