package websockets

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v4"
)

// jwtSecret se lee desde la variable de entorno JWT_SECRET.
var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

// Claims contiene la información del usuario extraída del JWT.
// Incluye RegisteredClaims para validar exp/nbf/iat.
type Claims struct {
	UserID   string `json:"user_id"`
	Role     string `json:"role,omitempty"`
	SellerID string `json:"seller_id,omitempty"`
	jwt.RegisteredClaims
}

// ValidateToken valida el header "Authorization: Bearer <token>" de forma segura.
// Comprueba algoritmo (HMAC), firma y claims registrados (exp, nbf).
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

	claims := &Claims{}
	tok, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		// Asegurar que el método de firma es HMAC (HS256/HS384/HS512 etc.)
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse error: %w", err)
	}
	if tok == nil || !tok.Valid {
		return nil, fmt.Errorf("token invalid")
	}

	// Validar claims registrados (exp, nbf, iat) explícitamente.
	if err := claims.RegisteredClaims.Valid(); err != nil {
		return nil, fmt.Errorf("invalid claims: %w", err)
	}

	// Si user_id no está en el struct (compatibilidad), intentar extraer de MapClaims
	if claims.UserID == "" {
		if mc, ok := tok.Claims.(jwt.MapClaims); ok {
			if uid, ok := mc["user_id"].(string); ok {
				claims.UserID = uid
			}
		}
	}

	// devolver claims (userID puede estar vacío dependiendo del token)
	return claims, nil
}
