package main

import (
  "fmt"
  "time"

  "github.com/golang-jwt/jwt/v4"
)

func main() {
  token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
    "user_id": "user-123",
    "exp":     time.Now().Add(time.Hour).Unix(),
  })
  s, err := token.SignedString([]byte("prueba"))
  if err != nil {
    panic(err)
  }
  fmt.Println(s)
}
