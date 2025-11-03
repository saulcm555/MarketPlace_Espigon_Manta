package websockets

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestCanJoinRoom_ClaimsBased(t *testing.T) {
	// owner allowed
	claims := &Claims{UserID: "u1", Role: "", SellerID: "s1"}
	ok, err := CanJoinRoom(context.Background(), "u1", claims, "order-u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("owner should be allowed to join own order room")
	}

	// other denied: trying to join a different owner's room
	ok, err = CanJoinRoom(context.Background(), "u1", claims, "order-other")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("other user should NOT be allowed to join someone else's order room")
	}

	// seller allowed
	claims = &Claims{UserID: "x", Role: "seller", SellerID: "s1"}
	ok, err = CanJoinRoom(context.Background(), "x", claims, "seller-s1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("seller should be allowed to join their seller room")
	}

	// admin allowed
	claims = &Claims{UserID: "any", Role: "admin"}
	ok, err = CanJoinRoom(context.Background(), "other", claims, "order-foo")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("admin should be allowed to join any room")
	}
}

func TestCanJoinRoom_RuntimeCheck(t *testing.T) {
	// Simple httptest server that returns allowed=true for order 123 and user=u1
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// respond based on path/query
		// examples: /orders/123/can_access?user_id=u1
		resp := map[string]bool{"allowed": false}
		if r.URL.Path == "/orders/123/can_access" && r.URL.Query().Get("user_id") == "u1" {
			resp["allowed"] = true
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	// set BACKEND_URL to the test server
	old := os.Getenv("BACKEND_URL")
	_ = os.Setenv("BACKEND_URL", ts.URL)
	defer os.Setenv("BACKEND_URL", old)

	// allowed case
	ok, err := CanJoinRoom(context.Background(), "u1", nil, "order-123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !ok {
		t.Fatalf("expected runtime backend to allow user u1 on order-123")
	}

	// denied case
	ok, err = CanJoinRoom(context.Background(), "u2", nil, "order-123")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ok {
		t.Fatalf("expected runtime backend to deny user u2 on order-123")
	}
}
