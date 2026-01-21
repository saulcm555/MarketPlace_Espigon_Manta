-- ============================================
-- Migración: Crear tabla de cupones y actualizar orders
-- Fecha: 18 de Enero, 2026
-- Propósito: Sistema de cupones B2B para integración con Gym
-- ============================================

-- Crear tabla de cupones
CREATE TABLE IF NOT EXISTS coupons (
  id_coupon SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0 NOT NULL,
  discount_type VARCHAR(50) DEFAULT 'percentage' NOT NULL, -- 'percentage' o 'fixed_amount'
  valid_for VARCHAR(100) DEFAULT 'all_products' NOT NULL,
  expires_at TIMESTAMP NULL,
  issued_by VARCHAR(100) NOT NULL,
  minimum_purchase DECIMAL(10,2) DEFAULT 0 NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  used_at TIMESTAMP NULL,
  order_id INTEGER NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_coupons_customer_email ON coupons(customer_email);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_coupons_used ON coupons(used);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupons_updated_at
BEFORE UPDATE ON coupons
FOR EACH ROW
EXECUTE FUNCTION update_coupons_updated_at();

-- Agregar columnas de cupón a la tabla order (si no existen)
DO $$ 
BEGIN
  -- Agregar coupon_code si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE "order" ADD COLUMN coupon_code VARCHAR(50) NULL;
    CREATE INDEX idx_order_coupon_code ON "order"(coupon_code);
  END IF;

  -- Agregar discount_amount si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE "order" ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Insertar cupones de ejemplo para testing (OPCIONAL - comentar en producción)
-- INSERT INTO coupons (code, discount_percent, discount_type, valid_for, expires_at, issued_by, minimum_purchase, customer_email, customer_name, is_active, used)
-- VALUES 
--   ('GYM-15-TEST123', 15, 'percentage', 'marketplace_products', CURRENT_TIMESTAMP + INTERVAL '30 days', 'Gym Management', 20.00, 'test@example.com', 'Test User', true, false),
--   ('GYM-20-DEMO456', 20, 'percentage', 'marketplace_products', CURRENT_TIMESTAMP + INTERVAL '60 days', 'Gym Management', 50.00, 'demo@example.com', 'Demo User', true, false);

-- Verificar que todo se creó correctamente
SELECT 
  'Tabla coupons creada' as mensaje,
  COUNT(*) as total_cupones
FROM coupons;

-- Verificar columnas en order
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order' 
  AND column_name IN ('coupon_code', 'discount_amount')
ORDER BY column_name;

-- ============================================
-- INSTRUCCIONES DE USO:
-- ============================================
-- 1. Ve a Supabase > SQL Editor
-- 2. Pega todo este script
-- 3. Haz clic en "Run" o Ctrl+Enter
-- 4. Verifica que no haya errores en la salida
-- 5. Confirma que aparecen las tablas y columnas nuevas
-- ============================================
