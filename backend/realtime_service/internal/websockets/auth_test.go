package websockets

import (
	"crypto/rand"
	"crypto/rsa"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

func TestValidateToken_ValidAndInvalid(t *testing.T) {
	// set secret
	old := os.Getenv("JWT_SECRET")
	_ = os.Setenv("JWT_SECRET", "test-secret-123")
	defer os.Setenv("JWT_SECRET", old)
	// update package-level jwtSecret (auth.go captured it at init)
	jwtSecret = []byte(os.Getenv("JWT_SECRET"))

	// valid token
	claims := &Claims{UserID: "u-valid", RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour))}}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	s, err := tok.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		t.Fatalf("failed to sign token: %v", err)
	}
	got, err := ValidateToken("Bearer " + s)
	if err != nil {
		t.Fatalf("expected valid token, got error: %v", err)
	}
	if got.UserID != "u-valid" {
		t.Fatalf("expected user id u-valid, got %s", got.UserID)
	}

	// expired token
	claimsExp := &Claims{UserID: "u-exp", RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour))}}
	tok2 := jwt.NewWithClaims(jwt.SigningMethodHS256, claimsExp)
	s2, err := tok2.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		t.Fatalf("failed to sign expired token: %v", err)
	}
	if _, err := ValidateToken("Bearer " + s2); err == nil {
		t.Fatalf("expected error for expired token, got nil")
	}

	// wrong alg: RS256 signed token should be rejected by ValidateToken
	rsaKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("failed to generate rsa key: %v", err)
	}
	claimsRSA := &Claims{UserID: "u-rs", RegisteredClaims: jwt.RegisteredClaims{ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour))}}
	tok3 := jwt.NewWithClaims(jwt.SigningMethodRS256, claimsRSA)
	s3, err := tok3.SignedString(rsaKey)
	if err != nil {
		t.Fatalf("failed to sign rs token: %v", err)
	}
	if _, err := ValidateToken("Bearer " + s3); err == nil {
		t.Fatalf("expected error for wrong alg token, got nil")
	}
}
