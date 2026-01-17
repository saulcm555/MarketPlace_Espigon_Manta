-- ============================================
-- Payment Service - Migraciones SQL
-- ============================================
-- Archivo: 001_initial_schema.sql
-- Descripción: Crea las tablas base del Payment Service
-- Ejecutar desde cero para levantar el servicio
-- ============================================

-- Tabla de transacciones de pago
-- Esta tabla ya existe en producción (baseline)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    order_id INTEGER,
    customer_id INTEGER,
    provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    metadata JSONB,
    refund_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para transactions
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- Tabla de partners B2B
CREATE TABLE IF NOT EXISTS partners (
    id_partner SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    webhook_url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT '{}',
    secret VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para partners
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(active);
CREATE INDEX IF NOT EXISTS idx_partners_name ON partners(name);

-- Tabla de logs de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES partners(id_partner),
    direction VARCHAR(20) NOT NULL, -- 'sent' | 'received'
    event VARCHAR(100) NOT NULL,
    payload JSONB,
    signature VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    response_code INTEGER,
    response_body TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_partner_id ON webhook_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs(event);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);

-- ============================================
-- Función para actualizar updated_at automáticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para auto-update de updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comentarios para documentación
-- ============================================
COMMENT ON TABLE transactions IS 'Transacciones de pago procesadas por el Payment Service';
COMMENT ON COLUMN transactions.transaction_id IS 'ID único de transacción del provider (Stripe, Mock, etc.)';
COMMENT ON COLUMN transactions.status IS 'Estado: pending, completed, failed, refunded';
COMMENT ON COLUMN transactions.provider IS 'Proveedor de pago: mock, stripe, mercadopago';
COMMENT ON COLUMN transactions.metadata IS 'Datos adicionales en formato JSON';

COMMENT ON TABLE partners IS 'Partners B2B registrados para recibir webhooks';
COMMENT ON COLUMN partners.events IS 'Array de eventos suscritos (ej: payment.success, order.created)';
COMMENT ON COLUMN partners.secret IS 'Secret compartido para firma HMAC-SHA256';

COMMENT ON TABLE webhook_logs IS 'Logs de auditoría de webhooks enviados y recibidos';
COMMENT ON COLUMN webhook_logs.direction IS 'Dirección: sent (enviado a partner) o received (recibido de partner)';
