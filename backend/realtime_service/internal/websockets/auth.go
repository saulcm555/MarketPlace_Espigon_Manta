package websockets

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v4"
)

// jwtSecret se lee desde la variable de entorno JWT_SECRET si existe.
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

// Claims minimalistas para PoC.
type Claims struct {
	UserID string `json:"user_id"`
}

// ValidateToken valida un header "Authorization: Bearer <token>" de forma simple
// y extrae el claim `user_id` si está presente.
func ValidateToken(authorizationHeader string) (*Claims, error) {
	if authorizationHeader == "" {
		return nil, errors.New("missing token")
	}
	parts := strings.Split(authorizationHeader, " ")
	if len(parts) != 2 {
		return nil, errors.New("invalid header")
	}
	tokenStr := parts[1]

	if len(jwtSecret) == 0 {
		return nil, errors.New("jwt secret not set (JWT_SECRET env var)")
	}

	tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		// devolver el error original para tener más contexto en los logs
		return nil, fmt.Errorf("parse error: %w", err)
	}
	if tok == nil || !tok.Valid {
		return nil, fmt.Errorf("token invalid")
	}

	// extraer claims
	if claims, ok := tok.Claims.(jwt.MapClaims); ok {
		if uid, ok := claims["user_id"].(string); ok {
			return &Claims{UserID: uid}, nil
		}
	}

	// si no hay user_id, devolver un id vacío pero válido
	return &Claims{UserID: ""}, nil
}
