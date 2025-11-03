FROM golang:1.20-alpine AS builder
WORKDIR /src

# Instalar herramientas necesarias para compilar
RUN apk add --no-cache git ca-certificates

# Copiar go.mod y descargar dependencias (aprovecha la cache de Docker)
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código y compilar el binario
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -trimpath -ldflags="-s -w" -o /app/api ./cmd/api

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/api /app/api
EXPOSE 8080
ENTRYPOINT ["/app/api"]
