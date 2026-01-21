# 🤝 Guía de Integración B2B - Payment Service
## MarketPlace Espigón Manta - Webhooks e Interoperabilidad

> **Pilar 2:** Sistema de webhooks bidireccionales para integración empresarial entre grupos.

---

## 📋 Tabla de Contenidos

1. [Resumen](#resumen)
2. [Requisitos Previos](#requisitos-previos)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Registro como Partner](#registro-como-partner)
5. [Recibir Webhooks de Nosotros](#recibir-webhooks-de-nosotros)
6. [Enviarnos Webhooks](#enviarnos-webhooks)
7. [Seguridad HMAC](#seguridad-hmac)
8. [Contrato de Eventos](#contrato-de-eventos)
9. [Ejemplos de Código](#ejemplos-de-código)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## 📖 Resumen

Nuestro **Payment Service** actúa como hub de integración B2B que:

- ✅ Procesa pagos con tarjeta automáticamente
- ✅ Envía webhooks cuando ocurren eventos importantes (orden creada, pago exitoso, etc.)
- ✅ Recibe webhooks de servicios externos (delivery, tours, cupones, etc.)
- ✅ Usa firma HMAC-SHA256 para seguridad
- ✅ Registra logs de todas las comunicaciones

**Ejemplo de integración:** Cuando un cliente compra en nuestro marketplace, enviamos un webhook a tu servicio de delivery para que asignes un repartidor. Cuando completas la entrega, nos envías un webhook para actualizar el estado de la orden.

---

## 🔧 Requisitos Previos

- Backend con endpoint HTTP para recibir webhooks
- Capacidad de hacer peticiones POST HTTP (para enviarnos webhooks)
- Soporte para firma HMAC-SHA256
- Base de datos para guardar secrets de partners

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────┐         Webhook         ┌─────────────────────┐
│  MarketPlace        │  ─────────────────────> │  Tu Servicio        │
│  (Nosotros)         │    order.created        │  (Partner)          │
│                     │    payment.success      │                     │
└─────────────────────┘                         └─────────────────────┘
         ^                                               |
         |                  Webhook                      |
         |           delivery.assigned                   |
         └───────────────────────────────────────────────┘
                     delivery.completed
```

**Flujo:**
1. Cliente crea orden → Payment Service procesa pago
2. Payment Service envía webhook `order.created` a Partner
3. Partner asigna recurso (repartidor, tour, cupo gym, etc.)
4. Partner envía webhook `service.assigned` a Payment Service
5. Ambos sistemas actualizan sus bases de datos

---

## 📝 Registro como Partner

### Paso 1: Registrarse en nuestro sistema

**Endpoint:** `POST http://[NUESTRA_IP]:3001/api/partners/register`

**Request Body:**
```json
{
  "name": "Tu Empresa S.A.",
  "webhook_url": "https://tu-dominio.com/webhooks/marketplace",
  "events": ["order.created", "payment.success", "order.cancelled"]
}
```

**Response (200 OK):**
```json
{
  "partner_id": 2,
  "name": "Tu Empresa S.A.",
  "secret": "8f3d9a2b1c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
  "webhook_url": "https://tu-dominio.com/webhooks/marketplace",
  "events": ["order.created", "payment.success", "order.cancelled"],
  "active": true
}
```

⚠️ **IMPORTANTE:** Guarda el `secret` de forma segura. Solo se muestra una vez y lo necesitarás para verificar las firmas HMAC.

### Paso 2: Proporcionar tus datos

Dinos tu URL de webhook y los eventos que quieres recibir para que podamos registrarte manualmente si prefieres.

---

## 📥 Recibir Webhooks de Nosotros

### Implementar endpoint en tu backend

**Tu endpoint debe:**
1. Aceptar POST en la URL que registraste
2. Verificar la firma HMAC
3. Procesar el evento
4. Responder 200 OK

### Estructura del Webhook

**Headers:**
```
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 del body>
X-Webhook-Event: order.created
X-Partner-Id: 2
```

**Body:**
```json
{
  "event": "order.created",
  "data": {
    "order_id": 123,
    "customer": {
      "id": 45,
      "name": "Juan Pérez",
      "email": "juan@example.com",
      "phone": "+593987654321"
    },
    "items": [
      {
        "product_id": 10,
        "product_name": "Camiseta Azul",
        "quantity": 2,
        "unit_price": 25.00
      }
    ],
    "delivery_address": "Av. 4 de Noviembre #456, Manta",
    "delivery_city": "Manta",
    "total": 50.00,
    "currency": "USD",
    "payment_method": "Tarjeta de Crédito/Débito",
    "transaction_id": "txn_abc123"
  },
  "timestamp": "2026-01-16T22:00:00Z"
}
```

### Ejemplo de Implementación (Node.js/TypeScript)

```typescript
import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Secret que recibiste al registrarte
const MARKETPLACE_SECRET = '8f3d9a2b1c4e5f6a7b8c9d0e1f2a3b4c...';

router.post('/marketplace', async (req, res) => {
  try {
    // 1. Obtener firma del header
    const signature = req.headers['x-webhook-signature'] as string;
    const event = req.headers['x-webhook-event'] as string;

    if (!signature) {
      return res.status(401).json({ error: 'Falta firma' });
    }

    // 2. Verificar firma HMAC
    const expectedSignature = crypto
      .createHmac('sha256', MARKETPLACE_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('❌ Firma inválida');
      return res.status(401).json({ error: 'Firma inválida' });
    }

    console.log(`✅ Webhook válido: ${event}`);

    // 3. Procesar según el evento
    const { event: eventType, data } = req.body;

    switch (eventType) {
      case 'order.created':
        await handleOrderCreated(data);
        break;

      case 'payment.success':
        await handlePaymentSuccess(data);
        break;

      case 'order.cancelled':
        await handleOrderCancelled(data);
        break;

      default:
        console.log(`⚠️ Evento no manejado: ${eventType}`);
    }

    // 4. Responder OK (IMPORTANTE: responder rápido)
    res.json({ received: true });

  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleOrderCreated(data: any) {
  console.log(`📦 Nueva orden: ${data.order_id}`);
  
  // Tu lógica aquí (asignar repartidor, crear reserva, etc.)
  await assignResource(data);
  
  // Opcional: Enviarnos un webhook de vuelta
  await notifyMarketplace('resource.assigned', {
    order_id: data.order_id,
    resource_id: 123
  });
}

export default router;
```

### Ejemplo en Python (FastAPI)

```python
from fastapi import APIRouter, Request, Header, HTTPException
import hmac
import hashlib
import json

router = APIRouter()

MARKETPLACE_SECRET = "8f3d9a2b1c4e5f6a7b8c9d0e1f2a3b4c..."

@router.post("/marketplace")
async def receive_webhook(
    request: Request,
    x_webhook_signature: str = Header(None),
    x_webhook_event: str = Header(None)
):
    try:
        # 1. Leer body
        body = await request.json()
        body_str = json.dumps(body, separators=(',', ':'))
        
        # 2. Verificar firma HMAC
        expected_signature = hmac.new(
            MARKETPLACE_SECRET.encode(),
            body_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if x_webhook_signature != expected_signature:
            raise HTTPException(status_code=401, detail="Firma inválida")
        
        print(f"✅ Webhook válido: {x_webhook_event}")
        
        # 3. Procesar evento
        event_type = body.get("event")
        data = body.get("data")
        
        if event_type == "order.created":
            await handle_order_created(data)
        elif event_type == "payment.success":
            await handle_payment_success(data)
        
        return {"received": True}
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📤 Enviarnos Webhooks

### Registrarnos en tu sistema

Nosotros nos registraremos en tu API de partners (si tienes una) o puedes enviarnos webhooks directamente a:

**Nuestro endpoint:** `POST http://[NUESTRA_IP]:3001/api/webhooks/partner`

### Estructura que esperamos

**Headers obligatorios:**
```
Content-Type: application/json
X-Webhook-Signature: <HMAC-SHA256 del body con TU secret>
X-Webhook-Event: <nombre del evento>
X-Partner-Id: <tu partner_id>
```

**Body:**
```json
{
  "event": "delivery.assigned",
  "data": {
    "order_id": 123,
    "resource": {
      "id": 67,
      "name": "Carlos Mendoza",
      "type": "driver",
      "contact": "+593998765432"
    },
    "estimated_time": "30 minutos",
    "tracking_url": "https://tu-app.com/track/abc123"
  },
  "timestamp": "2026-01-16T22:05:00Z"
}
```

### Ejemplo de código para enviarnos webhook

```typescript
import axios from 'axios';
import crypto from 'crypto';

const MARKETPLACE_WEBHOOK_URL = 'http://[IP]:3001/api/webhooks/partner';
const YOUR_SECRET = 'secret_que_te_dimos_al_registrarte';
const YOUR_PARTNER_ID = 2;

async function notifyMarketplace(event: string, data: any) {
  const payload = {
    event,
    data,
    timestamp: new Date().toISOString()
  };

  // Generar firma HMAC
  const signature = crypto
    .createHmac('sha256', YOUR_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  try {
    const response = await axios.post(MARKETPLACE_WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
        'X-Partner-Id': YOUR_PARTNER_ID.toString()
      },
      timeout: 10000
    });

    console.log(`✅ Webhook enviado: ${event}`);
    return response.data;

  } catch (error: any) {
    console.error(`❌ Error enviando webhook: ${error.message}`);
    throw error;
  }
}

// Uso
await notifyMarketplace('delivery.assigned', {
  order_id: 123,
  driver_id: 67,
  driver_name: 'Carlos Mendoza'
});
```

---

## 🔐 Seguridad HMAC

### ¿Por qué HMAC?

- ✅ Garantiza que el webhook proviene de la fuente correcta
- ✅ Previene ataques de replay
- ✅ Detecta modificaciones del payload

### Algoritmo: HMAC-SHA256

```
signature = HMAC-SHA256(secret, JSON.stringify(body))
```

### Verificación paso a paso

1. **Recibir webhook:**
   - Header: `X-Webhook-Signature: abc123def456...`
   - Body: `{"event": "order.created", ...}`

2. **Calcular firma esperada:**
   ```javascript
   const expectedSignature = crypto
     .createHmac('sha256', secret)
     .update(JSON.stringify(body))
     .digest('hex');
   ```

3. **Comparar firmas (timing-safe):**
   ```javascript
   const isValid = crypto.timingSafeEqual(
     Buffer.from(receivedSignature),
     Buffer.from(expectedSignature)
   );
   ```

⚠️ **Nunca** uses comparación simple (`===`) porque es vulnerable a timing attacks.

---

## 📡 Contrato de Eventos

### Eventos que ENVIAMOS (Outgoing)

| Evento | Descripción | Cuándo se dispara |
|--------|-------------|-------------------|
| `order.created` | Nueva orden creada con pago exitoso | Después de procesar pago con tarjeta |
| `payment.success` | Pago procesado exitosamente | Al completar transacción |
| `payment.failed` | Pago rechazado | Si la tarjeta es rechazada |
| `order.cancelled` | Orden cancelada por cliente | Al cancelar orden |

### Eventos que RECIBIMOS (Incoming)

**Puedes enviarnos cualquier evento personalizado. Ejemplos:**

| Evento | Uso sugerido | Datos esperados |
|--------|--------------|-----------------|
| `delivery.assigned` | Repartidor asignado | `order_id`, `driver_id`, `driver_name`, `phone` |
| `delivery.in_transit` | Pedido en camino | `order_id`, `location` (opcional) |
| `delivery.completed` | Entrega completada | `order_id`, `delivered_at`, `signature_url` (opcional) |
| `delivery.failed` | Fallo en entrega | `order_id`, `reason` |
| `coupon.issued` | Cupón generado para cliente | `customer_id`, `coupon_code`, `discount_percent`, `expires_at` |
| `coupon.redeemed` | Cupón canjeado | `coupon_code`, `order_id`, `discount_applied` |
| `membership.activated` | Membresía activada | `customer_id`, `membership_type`, `expires_at` |
| `tour.booked` | Tour reservado | `customer_id`, `tour_id`, `date`, `participants` |

---

## 💻 Ejemplos de Código

### Caso de Uso: Integración con Delivery Service

**Flujo completo:**

1. Cliente compra en marketplace → Enviamos `order.created`
2. Delivery asigna repartidor → Envían `delivery.assigned`
3. Repartidor recoge pedido → Envían `delivery.in_transit`
4. Pedido entregado → Envían `delivery.completed`

```typescript
// ========================================
// TU CÓDIGO: Recibir order.created
// ========================================
async function handleOrderCreated(data: any) {
  const { order_id, customer, items, delivery_address } = data;

  // 1. Crear registro de delivery en tu BD
  const delivery = await createDelivery({
    marketplace_order_id: order_id,
    customer_name: customer.name,
    customer_phone: customer.phone,
    pickup_address: "MarketPlace Bodega, Manta",
    delivery_address: delivery_address,
    items: items,
    status: 'pending'
  });

  // 2. Asignar repartidor
  const driver = await assignDriver(delivery.id);

  // 3. Notificar al marketplace
  await notifyMarketplace('delivery.assigned', {
    order_id: order_id,
    delivery_id: delivery.id,
    driver: {
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      photo_url: driver.photo_url
    },
    estimated_arrival: calculateETA(delivery_address)
  });

  console.log(`✅ Delivery ${delivery.id} asignado a ${driver.name}`);
}

// ========================================
// NUESTRO CÓDIGO: Recibir delivery.assigned
// ========================================
async function handleDeliveryAssigned(data: any) {
  const { order_id, driver } = data;

  // Actualizar orden en BD
  await db.query(
    `UPDATE "order" 
     SET status = $1, 
         driver_name = $2, 
         driver_phone = $3,
         updated_at = NOW()
     WHERE id_order = $4`,
    ['in_delivery', driver.name, driver.phone, order_id]
  );

  // Notificar al cliente vía WebSocket
  await notifyClient(order_id, {
    type: 'delivery_assigned',
    driver: driver
  });

  console.log(`✅ Orden ${order_id} actualizada con repartidor ${driver.name}`);
}
```

### Caso de Uso: Sistema de Cupones Cruzados

Ver la sección completa más abajo.

---

## 🧪 Testing

### 1. Probar recepción de webhooks (desde nosotros)

**Usar herramienta de testing:**

```bash
# Simular webhook de order.created
curl -X POST http://localhost:TU_PUERTO/webhooks/marketplace \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: FIRMA_HMAC_AQUI" \
  -H "X-Webhook-Event: order.created" \
  -d '{
    "event": "order.created",
    "data": {
      "order_id": 999,
      "customer": {"id": 1, "name": "Test User"},
      "total": 100.00
    }
  }'
```

### 2. Probar envío de webhooks (hacia nosotros)

```bash
# Enviarnos un webhook de prueba
curl -X POST http://NUESTRA_IP:3001/api/webhooks/partner \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: TU_FIRMA_HMAC" \
  -H "X-Webhook-Event: delivery.completed" \
  -H "X-Partner-Id: TU_ID" \
  -d '{
    "event": "delivery.completed",
    "data": {
      "order_id": 123,
      "delivered_at": "2026-01-16T23:00:00Z"
    }
  }'
```

### 3. Ver logs de webhooks

**En nuestro sistema:**
```sql
-- Ver webhooks enviados
SELECT * FROM webhook_logs 
WHERE direction = 'sent' AND partner_id = 2
ORDER BY created_at DESC LIMIT 10;

-- Ver webhooks recibidos
SELECT * FROM webhook_logs 
WHERE direction = 'received' AND partner_id = 2
ORDER BY created_at DESC LIMIT 10;
```

---

## 🔧 Troubleshooting

### Problema: Webhook no llega

**Posibles causas:**
1. ✅ Verifica que tu servidor esté accesible públicamente
2. ✅ Revisa firewall/puertos bloqueados
3. ✅ Confirma que la URL registrada sea correcta
4. ✅ Revisa logs de tu servidor

### Problema: Firma HMAC inválida

**Solución:**
```typescript
// CORRECTO ✅
const signature = crypto.createHmac('sha256', secret)
  .update(JSON.stringify(body))  // Stringify SIN espacios
  .digest('hex');

// INCORRECTO ❌
const signature = crypto.createHmac('sha256', secret)
  .update(JSON.stringify(body, null, 2))  // Con indentación
  .digest('hex');
```

### Problema: Webhook duplicado

**Causa:** Nuestro sistema reintenta webhooks fallidos hasta 3 veces.

**Solución:** Implementa idempotencia usando `order_id` o `timestamp`.

```typescript
const processedWebhooks = new Set();

router.post('/webhook', async (req, res) => {
  const webhookId = `${req.body.event}-${req.body.data.order_id}`;
  
  if (processedWebhooks.has(webhookId)) {
    console.log('⚠️ Webhook duplicado, ignorando');
    return res.json({ received: true });
  }
  
  processedWebhooks.add(webhookId);
  await processWebhook(req.body);
  
  res.json({ received: true });
});
```

---

## 📞 Contacto

**Marketplace Espigón Manta**
- Equipo: [Tu nombre y contactos]
- Email: [email del equipo]
- GitHub: [enlace al repo]
- IP del servidor: [tu IP pública]

**Para soporte técnico:**
- Abre un issue en GitHub
- Contacta por WhatsApp: [número]

---

## 📄 Licencia

Este proyecto es parte del curso de Desarrollo de Software - ULEAM 2026.

---

**¡Gracias por integrarte con nosotros! 🚀**
