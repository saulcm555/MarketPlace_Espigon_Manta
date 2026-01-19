![1768788230220](image/README/1768788230220.png)# 📂 n8n Workflows - MarketPlace El Espigón

Esta carpeta contiene los workflows de n8n exportados como JSON para versionamiento.

## 📥 Cómo Importar un Workflow

1. Accede a n8n: http://localhost:5678
2. Click en **"Add workflow"** → **"Import from File"**
3. Selecciona el archivo `.json` del workflow
4. Click en **"Save"** y luego **"Activate"**

## 📋 Workflows Disponibles

| Archivo | Descripción | Webhook URL |
|---------|-------------|-------------|
| `payment-handler.json` | Procesa webhooks de Stripe | `POST /webhook/payment` |
| `partner-handler.json` | Procesa webhooks de partners B2B | `POST /webhook/partner` |
| `mcp-input-handler.json` | Chatbot via Telegram | Telegram Bot |
| `daily-sales-report.json` | Reporte diario de ventas | Cron 8:00 AM |
| `health-check.json` | Monitoreo de servicios | Cron cada 5 min |
| `session-cleanup.json` | Limpieza de sesiones | Cron medianoche |
| `order-reminders.json` | Recordatorios a vendedores | Cron 10:00 AM |

## 🔗 URLs de Webhooks (después de activar)

```
# Payment Handler (Stripe)
POST http://localhost:5678/webhook/payment

# Partner Handler (B2B)
POST http://localhost:5678/webhook/partner
```

## 🧪 Testing

### Probar Payment Handler:

```bash
curl -X POST http://localhost:5678/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 5000,
        "currency": "usd",
        "metadata": {
          "orderId": "order-uuid-aqui"
        }
      }
    }
  }'
```

### Probar Payment Failed:

```bash
curl -X POST http://localhost:5678/webhook/payment \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.payment_failed",
    "data": {
      "object": {
        "id": "pi_test_456",
        "metadata": {
          "orderId": "order-uuid-aqui"
        },
        "last_payment_error": {
          "message": "Fondos insuficientes"
        }
      }
    }
  }'
```

## 📝 Notas

- Los workflows se exportan desde n8n UI → **"..."** → **"Download"**
- Siempre mantener los JSON actualizados después de cambios en n8n
- Las credenciales NO se exportan con los workflows (por seguridad)
