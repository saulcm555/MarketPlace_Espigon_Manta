# 🎟️ Sistema de Cupones Cruzados B2B
## Ejemplo: MarketPlace ↔️ Gimnasio

---

## 📊 Modelo de Base de Datos

### Tabla: `coupons`

```sql
CREATE TABLE coupons (
  id_coupon SERIAL PRIMARY KEY,
  coupon_code VARCHAR(50) UNIQUE NOT NULL,
  issued_by VARCHAR(100) NOT NULL, -- 'MarketPlace' o 'GymPartner'
  partner_id INT REFERENCES partner(id_partner),
  
  -- Info del cupón
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' o 'fixed'
  discount_value DECIMAL(10, 2) NOT NULL, -- 20 (%) o 10.00 (USD)
  minimum_purchase DECIMAL(10, 2) DEFAULT 0,
  max_uses INT DEFAULT 1,
  current_uses INT DEFAULT 0,
  
  -- Info del cliente
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  
  -- Validez
  valid_for VARCHAR(100), -- 'membership', 'marketplace_products', 'all'
  expires_at TIMESTAMP NOT NULL,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'redeemed', 'expired'
  redeemed_at TIMESTAMP,
  redeemed_in_order INT,
  
  -- Metadatos
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(coupon_code);
CREATE INDEX idx_coupons_email ON coupons(customer_email);
CREATE INDEX idx_coupons_status ON coupons(status);
```

---

## 💻 Implementación Backend (Node.js/TypeScript)

### 1️⃣ Generar cupón cuando cliente gasta $30+

```typescript
// backend/rest_service/src/application/use_cases/orders/CreateOrder.ts

import { WebhookService } from '../../../infrastructure/webhooks/WebhookService';
import { CouponService } from '../../../infrastructure/services/CouponService';

export class CreateOrderUseCase {
  constructor(
    private webhookService: WebhookService,
    private couponService: CouponService
  ) {}

  async execute(orderData: CreateOrderDTO) {
    // ... código existente de creación de orden ...

    // ✅ NUEVO: Verificar si genera cupón para partner
    if (order.total >= 30.00 && order.payment_status === 'success') {
      await this.generatePartnerCoupon(order);
    }

    return order;
  }

  private async generatePartnerCoupon(order: Order) {
    try {
      // 1. Generar código único
      const couponCode = `MARKET-20-${generateRandomCode(6)}`;

      // 2. Guardar en BD
      const coupon = await this.couponService.create({
        coupon_code: couponCode,
        issued_by: 'MarketPlace Espigón',
        partner_id: 1, // ID del Gimnasio en tu tabla partners
        discount_type: 'percentage',
        discount_value: 20,
        minimum_purchase: 0,
        customer_email: order.customer.email,
        customer_name: order.customer.name,
        valid_for: 'membership',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        status: 'active'
      });

      console.log(`🎟️ Cupón generado: ${couponCode} para ${order.customer.email}`);

      // 3. Enviar webhook al Gimnasio
      await this.webhookService.sendToPartner(1, 'coupon.issued', {
        customer_email: order.customer.email,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        coupon_code: couponCode,
        discount_percent: 20,
        discount_type: 'percentage',
        valid_for: 'membership',
        expires_at: coupon.expires_at.toISOString(),
        issued_by: 'MarketPlace Espigón',
        minimum_purchase: 0,
        message: `¡Felicidades! Por tu compra de $${order.total} has ganado 20% de descuento en FitPro Gym`
      });

      console.log(`✅ Webhook enviado al Gimnasio: coupon.issued`);

    } catch (error) {
      console.error('❌ Error generando cupón partner:', error);
      // No fallar la orden si el cupón falla
    }
  }
}

function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```

### 2️⃣ Servicio de Cupones

```typescript
// backend/rest_service/src/infrastructure/services/CouponService.ts

import { db } from '../../config/database';

export class CouponService {
  async create(data: CreateCouponDTO) {
    const result = await db.query(`
      INSERT INTO coupons (
        coupon_code, issued_by, partner_id, discount_type, discount_value,
        minimum_purchase, customer_email, customer_name, valid_for, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      data.coupon_code,
      data.issued_by,
      data.partner_id,
      data.discount_type,
      data.discount_value,
      data.minimum_purchase,
      data.customer_email,
      data.customer_name,
      data.valid_for,
      data.expires_at
    ]);

    return result.rows[0];
  }

  async validate(couponCode: string, customerEmail: string, orderTotal: number) {
    const result = await db.query(`
      SELECT * FROM coupons 
      WHERE coupon_code = $1 
        AND customer_email = $2 
        AND status = 'active'
        AND expires_at > NOW()
        AND current_uses < max_uses
    `, [couponCode, customerEmail]);

    if (result.rows.length === 0) {
      throw new Error('Cupón inválido, expirado o ya usado');
    }

    const coupon = result.rows[0];

    if (orderTotal < coupon.minimum_purchase) {
      throw new Error(`Compra mínima: $${coupon.minimum_purchase}`);
    }

    return coupon;
  }

  async redeem(couponCode: string, orderId: number) {
    await db.query(`
      UPDATE coupons 
      SET status = 'redeemed',
          current_uses = current_uses + 1,
          redeemed_at = NOW(),
          redeemed_in_order = $1,
          updated_at = NOW()
      WHERE coupon_code = $2
    `, [orderId, couponCode]);
  }

  async calculateDiscount(coupon: any, orderTotal: number): Promise<number> {
    if (coupon.discount_type === 'percentage') {
      return orderTotal * (coupon.discount_value / 100);
    } else {
      return Math.min(coupon.discount_value, orderTotal);
    }
  }
}
```

### 3️⃣ Recibir cupones del Gimnasio

```typescript
// backend/payment_service/src/routes/webhookRoutes.ts

router.post('/partner', async (req, res) => {
  try {
    // Verificar firma HMAC (código existente)
    const isValid = verifySignature(req.body, req.headers['x-webhook-signature'], partnerSecret);
    if (!isValid) {
      return res.status(401).json({ error: 'Firma inválida' });
    }

    const { event, data } = req.body;

    switch (event) {
      case 'coupon.issued':
        await handleCouponIssuedByPartner(data);
        break;

      case 'coupon.redeemed':
        await handleCouponRedeemed(data);
        break;

      // ... otros eventos ...
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: error.message });
  }
});

async function handleCouponIssuedByPartner(data: any) {
  console.log(`🎟️ Cupón recibido de partner: ${data.coupon_code}`);

  // Guardar en nuestra BD
  await db.query(`
    INSERT INTO coupons (
      coupon_code, issued_by, partner_id, discount_type, discount_value,
      minimum_purchase, customer_email, customer_name, valid_for, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    data.coupon_code,
    data.issued_by || 'Partner',
    data.partner_id || 1,
    data.discount_type,
    data.discount_percent || data.discount_value,
    data.minimum_purchase || 0,
    data.customer_email,
    data.customer_name,
    data.valid_for,
    new Date(data.expires_at)
  ]);

  console.log(`✅ Cupón ${data.coupon_code} guardado para ${data.customer_email}`);

  // TODO: Notificar al cliente por email o app
}

async function handleCouponRedeemed(data: any) {
  console.log(`💰 Cupón canjeado: ${data.coupon_code}`);

  // Actualizar estado si es nuestro cupón
  await db.query(`
    UPDATE coupons 
    SET status = 'redeemed',
        redeemed_at = $1,
        updated_at = NOW()
    WHERE coupon_code = $2
  `, [new Date(data.redeemed_at), data.coupon_code]);

  // Registrar estadísticas
  await db.query(`
    INSERT INTO coupon_redemptions (
      coupon_code, partner_id, redeemed_by, discount_applied, final_price
    ) VALUES ($1, $2, $3, $4, $5)
  `, [
    data.coupon_code,
    1,
    data.redeemed_by,
    data.discount_applied,
    data.final_price
  ]);
}
```

---

## 🎨 Implementación Frontend

### 1️⃣ Mostrar cupones disponibles

```typescript
// frontend/src/pages/UserProfile.tsx

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function UserProfile() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  useEffect(() => {
    fetchUserCoupons();
  }, []);

  const fetchUserCoupons = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/coupons/my-coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      console.error('Error cargando cupones:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Cupones</h1>

      {coupons.length === 0 ? (
        <p className="text-gray-500">No tienes cupones disponibles</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id_coupon} className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="text-lg font-mono">{coupon.coupon_code}</span>
                  <Badge variant="success">
                    {coupon.discount_value}% OFF
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  Válido para: <strong>{coupon.valid_for}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  De: <strong>{coupon.issued_by}</strong>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Expira: {new Date(coupon.expires_at).toLocaleDateString()}
                </p>
                
                {coupon.minimum_purchase > 0 && (
                  <p className="text-xs text-orange-600">
                    Compra mínima: ${coupon.minimum_purchase}
                  </p>
                )}

                <button 
                  className="w-full mt-3 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                  onClick={() => copyCouponCode(coupon.coupon_code)}
                >
                  Copiar Código
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function copyCouponCode(code: string) {
  navigator.clipboard.writeText(code);
  alert(`Código copiado: ${code}`);
}
```

### 2️⃣ Aplicar cupón en Checkout

```typescript
// frontend/src/pages/Checkout.tsx (agregar)

const [couponCode, setCouponCode] = useState('');
const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
const [discountAmount, setDiscountAmount] = useState(0);

const applyCoupon = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/coupons/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        coupon_code: couponCode,
        order_total: total
      })
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message);
      return;
    }

    const coupon = await response.json();
    setAppliedCoupon(coupon);
    
    // Calcular descuento
    const discount = coupon.discount_type === 'percentage'
      ? total * (coupon.discount_value / 100)
      : coupon.discount_value;
    
    setDiscountAmount(discount);
    alert(`✅ Cupón aplicado! Descuento: $${discount.toFixed(2)}`);

  } catch (error) {
    console.error('Error aplicando cupón:', error);
    alert('Error validando cupón');
  }
};

const finalTotal = total - discountAmount;

// En el JSX:
<div className="mb-6">
  <label className="block mb-2 font-semibold">¿Tienes un cupón?</label>
  <div className="flex gap-2">
    <input
      type="text"
      value={couponCode}
      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
      placeholder="CODIGO-CUPON"
      className="flex-1 border rounded px-3 py-2"
    />
    <button
      onClick={applyCoupon}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      Aplicar
    </button>
  </div>
  
  {appliedCoupon && (
    <div className="mt-2 p-3 bg-green-100 text-green-800 rounded">
      ✅ Cupón {appliedCoupon.coupon_code} aplicado: -${discountAmount.toFixed(2)}
    </div>
  )}
</div>

<div className="border-t pt-4 mt-4">
  <div className="flex justify-between mb-2">
    <span>Subtotal:</span>
    <span>${total.toFixed(2)}</span>
  </div>
  {discountAmount > 0 && (
    <div className="flex justify-between mb-2 text-green-600">
      <span>Descuento:</span>
      <span>-${discountAmount.toFixed(2)}</span>
    </div>
  )}
  <div className="flex justify-between font-bold text-xl">
    <span>Total:</span>
    <span>${finalTotal.toFixed(2)}</span>
  </div>
</div>
```

---

## 🔄 Flujo Completo Resumido

### MarketPlace → Gimnasio

```
Cliente compra $30
    ↓
REST Service genera "MARKET-20-ABC123"
    ↓
Guarda en tabla coupons
    ↓
Payment Service envía webhook "coupon.issued" al Gimnasio
    ↓
Gimnasio recibe y guarda cupón
    ↓
Cliente ve cupón en app del Gimnasio
    ↓
Cliente usa cupón → 20% OFF en membresía
    ↓
Gimnasio envía webhook "coupon.redeemed" (opcional)
```

### Gimnasio → MarketPlace

```
Cliente compra membresía
    ↓
Gimnasio genera "GYM-15-XYZ789"
    ↓
Gimnasio envía webhook "coupon.issued" a Payment Service
    ↓
Payment Service recibe y guarda cupón
    ↓
Cliente ve cupón en su perfil MarketPlace
    ↓
Cliente aplica cupón en checkout → 15% OFF
    ↓
REST Service marca cupón como usado
    ↓
Payment Service envía webhook "coupon.redeemed" al Gimnasio (opcional)
```

---

## 📊 Dashboard de Cupones (Opcional)

```typescript
// Endpoint para estadísticas de cupones

router.get('/api/coupons/stats', async (req, res) => {
  const stats = await db.query(`
    SELECT 
      issued_by,
      COUNT(*) as total_issued,
      SUM(CASE WHEN status = 'redeemed' THEN 1 ELSE 0 END) as total_redeemed,
      SUM(CASE WHEN status = 'active' AND expires_at > NOW() THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN status = 'active' AND expires_at <= NOW() THEN 1 ELSE 0 END) as expired
    FROM coupons
    GROUP BY issued_by
  `);

  res.json(stats.rows);
});

/*
Resultado ejemplo:
[
  {
    "issued_by": "MarketPlace Espigón",
    "total_issued": 50,
    "total_redeemed": 35,
    "active": 10,
    "expired": 5
  },
  {
    "issued_by": "FitPro Gym",
    "total_issued": 30,
    "total_redeemed": 20,
    "active": 8,
    "expired": 2
  }
]
*/
```

---

## ✅ Checklist de Implementación

### Tu MarketPlace:
- [ ] Crear tabla `coupons`
- [ ] Implementar `CouponService`
- [ ] Modificar `CreateOrder` para generar cupones cuando total >= $30
- [ ] Enviar webhook `coupon.issued` al Gimnasio
- [ ] Crear endpoint `/api/coupons/my-coupons` para listar cupones del usuario
- [ ] Crear endpoint `/api/coupons/validate` para validar cupones
- [ ] Agregar lógica en checkout para aplicar cupón
- [ ] Recibir webhooks `coupon.issued` del Gimnasio
- [ ] Mostrar cupones en perfil de usuario

### Gimnasio (tu compañero):
- [ ] Crear tabla `coupons` (mismo esquema)
- [ ] Implementar lógica para generar cupones cuando alguien compra membresía
- [ ] Enviar webhook `coupon.issued` a tu MarketPlace
- [ ] Recibir webhooks `coupon.issued` de tu MarketPlace
- [ ] Validar cupones en su checkout
- [ ] Aplicar descuentos según cupón

### Testing:
- [ ] Probar generación de cupón al gastar $30
- [ ] Verificar webhook enviado al Gimnasio
- [ ] Simular webhook del Gimnasio hacia ti
- [ ] Probar validación y aplicación de cupón en checkout
- [ ] Verificar cupones expirados no se pueden usar
- [ ] Probar cupones de un solo uso

---

## 🎯 Beneficios

✅ **Lealtad cruzada:** Incentivas a clientes a usar ambos servicios
✅ **Marketing gratuito:** Cada servicio promociona al otro
✅ **Experiencia integrada:** Los clientes ven valor en el ecosistema completo
✅ **Datos compartidos:** Ambos conocen comportamiento de clientes
✅ **Escalable:** Puedes agregar más partners (tours, hoteles, etc.)

---

**¡Éxito con tu sistema de cupones cruzados! 🚀**
