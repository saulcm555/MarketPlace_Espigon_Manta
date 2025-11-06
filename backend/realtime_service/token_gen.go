package main

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

func main() {
	// Leer JWT_SECRET del entorno (OBLIGATORIO)
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		fmt.Fprintln(os.Stderr, "❌ ERROR: JWT_SECRET no está configurado en las variables de entorno")
		fmt.Fprintln(os.Stderr, "⚠️  Configura JWT_SECRET en tu archivo .env antes de generar tokens")
		os.Exit(1)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": "user-123",
		"role":    "client",
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	})
	s, err := token.SignedString([]byte(secret))
	if err != nil {
		panic(err)
	}
	fmt.Println(s)
}
