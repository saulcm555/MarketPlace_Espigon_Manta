# 💳 Sistema de Pago por Transferencia Bancaria

## 📋 Descripción General

Sistema que permite a los clientes pagar mediante transferencia bancaria, subiendo el comprobante de pago para verificación manual del vendedor.

---

## 🔄 Flujo de Trabajo

```
1. Cliente crea orden → Status: "pending"
2. Cliente sube comprobante → Status: "payment_pending_verification"
3. Vendedor verifica pago → Status: "payment_confirmed" o "payment_rejected"
4. Si aprobado → Procesar envío
5. Si rechazado → Notificar cliente
```

---

## 🛠️ Endpoints Creados

### 1. **POST /api/upload/payment-receipt**
Sube el comprobante de pago a Supabase Storage.

**Autenticación:** Requerida (cliente o vendedor)

**Body (multipart/form-data):**
```javascript
{
  receipt: File,        // Archivo (JPG, PNG, WEBP, PDF)
  order_id: number      // ID de la orden
}
```

**Validaciones:**
- ✅ Solo imágenes o PDF
- ✅ Máximo 5 MB
- ✅ Sube a bucket `payment-receipts`

**Respuesta exitosa:**
```json
{
  "message": "Comprobante subido exitosamente",
  "receiptUrl": "https://xxx.supabase.co/storage/v1/object/public/payment-receipts/orders/123/receipt-1699483200000.jpg",
  "filename": "orders/123/receipt-1699483200000.jpg",
  "storage": "supabase"
}
```

**Ejemplo con Fetch:**
```javascript
const formData = new FormData();
formData.append('receipt', fileInput.files[0]);
formData.append('order_id', orderId);

const response = await fetch('/api/upload/payment-receipt', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { receiptUrl } = await response.json();
```

---

### 2. **PATCH /api/orders/:id/payment-receipt**
Actualiza la orden con la URL del comprobante y cambia el estado.

**Autenticación:** Requerida (cliente)

**Body (JSON):**
```json
{
  "payment_receipt_url": "https://xxx.supabase.co/storage/.../receipt.jpg"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Comprobante de pago actualizado correctamente",
  "order": {
    "id_order": 123,
    "status": "payment_pending_verification",
    "payment_receipt_url": "https://...",
    ...
  }
}
```

**Ejemplo:**
```javascript
await fetch(`/api/orders/${orderId}/payment-receipt`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    payment_receipt_url: receiptUrl
  })
});
```

---

### 3. **PATCH /api/orders/:id/verify-payment**
Verificar o rechazar el pago (solo vendedor).

**Autenticación:** Requerida (vendedor)

**Body (JSON):**
```json
{
  "approved": true  // true = aprobar, false = rechazar
}
```

**Respuesta exitosa (aprobado):**
```json
{
  "message": "Pago verificado y aprobado correctamente",
  "order": {
    "id_order": 123,
    "status": "payment_confirmed",
    "payment_verified_at": "2025-11-08T10:30:00.000Z",
    ...
  }
}
```

**Respuesta exitosa (rechazado):**
```json
{
  "message": "Pago rechazado",
  "order": {
    "id_order": 123,
    "status": "payment_rejected",
    "payment_verified_at": "2025-11-08T10:30:00.000Z",
    ...
  }
}
```

**Ejemplo:**
```javascript
// Aprobar pago
await fetch(`/api/orders/${orderId}/verify-payment`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${sellerToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ approved: true })
});
```

---

## 🗄️ Cambios en Base de Datos

### Nuevos campos en tabla `order`:

| Campo | Tipo | Nullable | Descripción |
|-------|------|----------|-------------|
| `payment_receipt_url` | TEXT | ✅ | URL del comprobante en Supabase Storage |
| `payment_verified_at` | TIMESTAMP | ✅ | Fecha de verificación del pago |

### Migración SQL:
Ejecutar en Supabase SQL Editor:
```sql
-- Ver archivo: migrations/add_payment_receipt_fields.sql
```

---

## 📊 Estados de la Orden

| Estado | Descripción |
|--------|-------------|
| `pending` | Orden creada, sin pago |
| `payment_pending_verification` | Comprobante subido, esperando verificación |
| `payment_confirmed` | Pago verificado y aprobado |
| `payment_rejected` | Comprobante rechazado por el vendedor |
| `processing` | Preparando envío |
| `shipped` | En camino |
| `delivered` | Entregado |
| `cancelled` | Cancelada |

---

## 🏗️ Estructura de Archivos en Supabase Storage

### Bucket: `payment-receipts`

```
payment-receipts/
└── orders/
    ├── 123/
    │   └── receipt-1699483200000.jpg
    ├── 124/
    │   └── receipt-1699483250000.png
    └── 125/
        └── receipt-1699483300000.pdf
```

**Configuración del Bucket:**
- ✅ Público (para que vendedores vean comprobantes)
- ✅ Límite de tamaño: 5 MB por archivo
- ✅ Tipos permitidos: image/*, application/pdf

---

## 🔐 Permisos y Seguridad

### Backend:
- ✅ Solo clientes autenticados pueden subir comprobantes
- ✅ Solo vendedores pueden verificar pagos
- ✅ Validación de tipo de archivo (imágenes/PDF)
- ✅ Validación de tamaño (máx. 5 MB)
- ✅ Nombres de archivo únicos (timestamp)

### Supabase Storage:
- ✅ Bucket público para lectura
- ✅ Solo backend puede escribir (via service key)
- ✅ Protección contra sobrescritura accidental

---

## 🧪 Ejemplo de Flujo Completo

```javascript
// 1. Cliente crea orden
const order = await createOrder({
  id_client: 1,
  id_cart: 5,
  id_payment_method: 3, // 3 = Transferencia bancaria
  delivery_type: 'home_delivery',
  delivery_address: 'Av. Principal 123'
});
// order.status = "pending"

// 2. Cliente sube comprobante
const formData = new FormData();
formData.append('receipt', fileInput.files[0]);
formData.append('order_id', order.id_order);

const uploadResponse = await fetch('/api/upload/payment-receipt', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

const { receiptUrl } = await uploadResponse.json();

// 3. Cliente actualiza la orden con el comprobante
await fetch(`/api/orders/${order.id_order}/payment-receipt`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ payment_receipt_url: receiptUrl })
});
// order.status = "payment_pending_verification"

// 4. Vendedor verifica el pago
await fetch(`/api/orders/${order.id_order}/verify-payment`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${sellerToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ approved: true })
});
// order.status = "payment_confirmed"
// order.payment_verified_at = "2025-11-08T10:30:00.000Z"
```

---

## 📝 Próximos Pasos (Futuro)

1. **Compresión de imágenes** (frontend)
   - Reducir tamaño antes de subir
   - Librería: `browser-image-compression`

2. **Limpieza automática** (backend)
   - Eliminar comprobantes después de 15 días sin verificar
   - Eliminar comprobantes después de 60 días verificados
   - Implementar con Cron Job

3. **Notificaciones**
   - Email al subir comprobante
   - Email al verificar/rechazar pago

---

## ✅ Checklist de Implementación

- [x] Agregar campos a `OrderEntity` (model)
- [x] Actualizar interfaz `Order` (domain)
- [x] Actualizar `CreateOrderDto`
- [x] Endpoint POST `/upload/payment-receipt`
- [x] Endpoint PATCH `/orders/:id/payment-receipt`
- [x] Endpoint PATCH `/orders/:id/verify-payment`
- [x] Función `deleteFromSupabase` en storage
- [x] Migración SQL
- [ ] Ejecutar migración en Supabase
- [ ] Crear bucket `payment-receipts` en Supabase
- [ ] Configurar permisos del bucket
- [ ] Implementar en frontend
- [ ] Probar flujo completo

---

## 🎯 Configuración Requerida en Supabase

### 1. Crear Bucket
```
Nombre: payment-receipts
Público: ✅ Sí
Tamaño máximo de archivo: 5 MB
```

### 2. Política de Seguridad (RLS)
```sql
-- Permitir lectura pública
CREATE POLICY "Permitir lectura pública" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-receipts');

-- Solo backend puede insertar (usar service_role key)
CREATE POLICY "Solo backend puede insertar" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-receipts' AND auth.role() = 'service_role');
```

---

**Documentación creada:** 2025-11-08  
**Versión:** 1.0  
**Autor:** Sistema de Pago por Transferencia
