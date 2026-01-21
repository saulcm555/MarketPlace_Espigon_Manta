/**
 * Script para simular que el GYM nos envía un webhook con un cupón
 * Simula: Gym → Marketplace (nosotros recibimos)
 */

const crypto = require('crypto');

const SECRET = 'super-secure-gym-marketplace-2026';
const MARKETPLACE_WEBHOOK_URL = 'http://localhost:3001/api/coupons/webhook/marketplace';

const payload = {
  event: 'coupon.issued',
  data: {
    coupon_code: 'GYM-20-TEST-' + Date.now(),
    discount_type: 'percentage',
    discount_value: 20,
    customer_email: 'test@example.com',
    customer_name: 'Juan Test',
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
    description: 'Cupón de prueba 20% descuento por activar membresía Gym',
    source: 'gym_membership',
    membership_type: 'premium',
    is_active: true
  }
};

// Convertir a string JSON
const payloadString = JSON.stringify(payload);

// Generar firma HMAC-SHA256
const signature = crypto
  .createHmac('sha256', SECRET)
  .update(payloadString)
  .digest('hex');

console.log('\n🔐 Simulando webhook del GYM → Marketplace\n');
console.log('📋 Payload:', JSON.stringify(payload, null, 2));
console.log('\n🔑 Firma HMAC-SHA256:', signature);
console.log('\n📡 Enviando a:', MARKETPLACE_WEBHOOK_URL);
console.log('\n---\n');

// Enviar webhook
fetch(MARKETPLACE_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-signature': signature
  },
  body: payloadString
})
  .then(async response => {
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ RESULTADO_FINAL: ÉXITO\n');
      console.log('Respuesta del servidor:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ RESULTADO_FINAL: ERROR\n');
      console.log('Status:', response.status);
      console.log('Respuesta:', JSON.stringify(data, null, 2));
    }
  })
  .catch(error => {
    console.log('❌ RESULTADO_FINAL: ERROR DE CONEXIÓN\n');
    console.error('Error:', error.message);
    console.error('\n⚠️  Verifica que el payment-service esté corriendo en puerto 3001');
  });
