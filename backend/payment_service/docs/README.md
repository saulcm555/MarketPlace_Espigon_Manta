# Payment Service - Microservicio de Pagos

## Pilar 2: Webhooks e Interoperabilidad B2B

Microservicio de pagos con abstracción de pasarelas y comunicación bidireccional mediante webhooks.

## Características

- ✅ Patrón Adapter para múltiples pasarelas de pago
- ✅ MockAdapter para desarrollo sin costos
- ✅ StripeAdapter para pagos reales
- ✅ Normalización de webhooks
- ✅ Firma HMAC para seguridad
- ✅ Registro de partners B2B
- ✅ Logs de webhooks para auditoría

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

## Endpoints

### Pagos
- `POST /api/payments/process` - Procesar pago
- `POST /api/payments/refund` - Reembolsar pago

### Partners
- `POST /api/partners/register` - Registrar partner
- `GET /api/partners` - Listar partners
- `POST /api/webhooks/partner` - Recibir webhook de partner

### Webhooks de Pasarelas
- `POST /api/webhooks/stripe` - Webhook de Stripe
- `POST /api/webhooks/mercadopago` - Webhook de MercadoPago

## Arquitectura

```
payment_service/
├── adapters/         # Implementaciones de pasarelas
├── services/         # Lógica de negocio
├── routes/           # Endpoints HTTP
├── models/           # Entidades de base de datos
├── config/           # Configuraciones
└── utils/            # Utilidades (HMAC, etc.)
```
