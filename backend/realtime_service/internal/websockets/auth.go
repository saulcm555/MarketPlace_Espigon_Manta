package websockets

import (
	"errors"
	"fmt"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v4"
)

// Constantes para validación de tokens del Auth Service
const (
	// DefaultJWTSecret se usa si JWT_SECRET no está configurado
	DefaultJWTSecret = "supersecreto123"

	// ExpectedIssuer debe coincidir con el Auth Service
	ExpectedIssuer = "auth-service"

	// ExpectedAudience debe coincidir con el Auth Service
	ExpectedAudience = "marketplace-espigon"
)

// jwtSecret se lee desde la variable de entorno JWT_SECRET.
var jwtSecret []byte

func init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = DefaultJWTSecret
	}
	jwtSecret = []byte(secret)
}

// Claims contiene la información del usuario extraída del JWT.
// Soporta tanto el formato legacy como el nuevo formato del Auth Service.
type Claims struct {
	// Campos del Auth Service (nuevo formato)
	Email       string `json:"email,omitempty"`
	ReferenceID int64  `json:"reference_id,omitempty"` // id_client, id_seller, o id_admin

	// Campos legacy (compatibilidad con tokens antiguos)
	UserID   string  `json:"user_id,omitempty"`
	ID       float64 `json:"id,omitempty"`        // ID numérico del usuario
	IDSeller float64 `json:"id_seller,omitempty"` // ID del vendedor (viene como id_seller en JWT)
	IDClient float64 `json:"id_client,omitempty"` // ID del cliente
	IDAdmin  float64 `json:"id_admin,omitempty"`  // ID del admin
	Role     string  `json:"role,omitempty"`

	// Campos calculados
	SellerID string // Campo calculado a partir de IDSeller o ReferenceID
	ClientID string // Campo calculado a partir de IDClient o ReferenceID
	AdminID  string // Campo calculado a partir de IDAdmin o ReferenceID

	jwt.RegisteredClaims
}

// ValidateToken valida el header "Authorization: Bearer <token>" de forma segura.
// Comprueba algoritmo (HMAC), firma, issuer, audience y claims registrados (exp, nbf).
// ACTUALIZADO: Soporta tokens del Auth Service (Pilar 1)
func ValidateToken(authorizationHeader string) (*Claims, error) {
	if authorizationHeader == "" {
		return nil, errors.New("missing token")
	}
	parts := strings.Split(authorizationHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return nil, errors.New("invalid header format, expected 'Bearer <token>'")
	}
	tokenStr := parts[1]

	if len(jwtSecret) == 0 {
		return nil, errors.New("jwt secret not configured")
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
		// Detectar si es error de expiración
		if strings.Contains(err.Error(), "token is expired") {
			return nil, fmt.Errorf("TOKEN_EXPIRED: %w", err)
		}
		return nil, fmt.Errorf("TOKEN_INVALID: %w", err)
	}
	if tok == nil || !tok.Valid {
		return nil, fmt.Errorf("TOKEN_INVALID: token is not valid")
	}

	// Validar claims registrados (exp, nbf, iat) explícitamente.
	if err := claims.RegisteredClaims.Valid(); err != nil {
		return nil, fmt.Errorf("TOKEN_INVALID: invalid claims: %w", err)
	}

	// Validar issuer y audience si están presentes (tokens del Auth Service)
	if claims.Issuer != "" {
		if claims.Issuer != ExpectedIssuer {
			return nil, fmt.Errorf("TOKEN_INVALID: invalid issuer, expected %s got %s", ExpectedIssuer, claims.Issuer)
		}
	}

	// Verificar audience (puede ser un array o string)
	if len(claims.Audience) > 0 {
		validAudience := false
		for _, aud := range claims.Audience {
			if aud == ExpectedAudience {
				validAudience = true
				break
			}
		}
		if !validAudience {
			return nil, fmt.Errorf("TOKEN_INVALID: invalid audience, expected %s", ExpectedAudience)
		}
	}

	// Procesar claims para compatibilidad
	processClaimsCompatibility(tok, claims)

	return claims, nil
}

// processClaimsCompatibility procesa los claims para mantener compatibilidad
// entre tokens legacy y tokens del Auth Service
func processClaimsCompatibility(tok *jwt.Token, claims *Claims) {
	// Si es token del Auth Service, usar Subject (sub) como UserID
	if claims.Subject != "" {
		claims.UserID = claims.Subject
	}

	// Extraer claims adicionales de MapClaims si es necesario
	if mc, ok := tok.Claims.(jwt.MapClaims); ok {
		// user_id legacy
		if claims.UserID == "" {
			if uid, ok := mc["user_id"].(string); ok {
				claims.UserID = uid
			}
		}

		// id legacy
		if claims.UserID == "" {
			if id, ok := mc["id"].(float64); ok {
				claims.UserID = fmt.Sprintf("%.0f", id)
				claims.ID = id
			}
		}

		// email
		if claims.Email == "" {
			if email, ok := mc["email"].(string); ok {
				claims.Email = email
			}
		}

		// role
		if claims.Role == "" {
			if role, ok := mc["role"].(string); ok {
				claims.Role = role
			}
		}

		// reference_id del Auth Service
		if claims.ReferenceID == 0 {
			if refID, ok := mc["reference_id"].(float64); ok {
				claims.ReferenceID = int64(refID)
			}
		}
	}

	// Mapear reference_id según el rol (para tokens del Auth Service)
	if claims.ReferenceID > 0 && claims.Role != "" {
		refIDStr := fmt.Sprintf("%d", claims.ReferenceID)
		switch claims.Role {
		case "seller":
			claims.SellerID = refIDStr
			claims.IDSeller = float64(claims.ReferenceID)
		case "client":
			claims.ClientID = refIDStr
			claims.IDClient = float64(claims.ReferenceID)
		case "admin":
			claims.AdminID = refIDStr
			claims.IDAdmin = float64(claims.ReferenceID)
		}
	}

	// Compatibilidad: extraer seller_id de id_seller legacy
	if claims.SellerID == "" && claims.IDSeller > 0 {
		claims.SellerID = fmt.Sprintf("%.0f", claims.IDSeller)
	}

	// Compatibilidad: extraer client_id de id_client legacy
	if claims.ClientID == "" && claims.IDClient > 0 {
		claims.ClientID = fmt.Sprintf("%.0f", claims.IDClient)
	}

	// Compatibilidad: extraer admin_id de id_admin legacy
	if claims.AdminID == "" && claims.IDAdmin > 0 {
		claims.AdminID = fmt.Sprintf("%.0f", claims.IDAdmin)
	}
}

// GetUserIdentifier retorna el identificador principal del usuario
// Prioriza: Subject (UUID) > UserID > ID formateado
func (c *Claims) GetUserIdentifier() string {
	if c.Subject != "" {
		return c.Subject
	}
	if c.UserID != "" {
		return c.UserID
	}
	if c.ID > 0 {
		return fmt.Sprintf("%.0f", c.ID)
	}
	return ""
}

// GetRoleSpecificID retorna el ID específico del rol (id_seller, id_client, id_admin)
func (c *Claims) GetRoleSpecificID() string {
	switch c.Role {
	case "seller":
		return c.SellerID
	case "client":
		return c.ClientID
	case "admin":
		return c.AdminID
	default:
		return ""
	}
}
