/**
 * Payment Service - Main Entry Point
 * Microservicio de Pagos con Webhooks B2B
 * Pilar 2: Webhooks e Interoperabilidad B2B
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { initializeDatabase } from './config/database';

// Importar rutas
import paymentRoutes from './routes/paymentRoutes';
import partnerRoutes from './routes/partnerRoutes';
import webhookRoutes from './routes/webhookRoutes';
import couponRoutes from './routes/couponRoutes';

// Crear aplicación Express
const app: Application = express();

// ============================================
// Middlewares
// ============================================

// CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:3003'  // MCP Service
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Webhook-Signature', 
    'X-Partner-Id', 
    'Stripe-Signature',
    'X-Internal-Api-Key'  // Para autenticación service-to-service
  ]
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware (desarrollo)
if (env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Rutas
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.NODE_ENV,
    provider: env.PAYMENT_PROVIDER
  });
});

// API Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/coupons', couponRoutes);

// Alias para integración con Gym B2B (redirige a /api/webhooks/partner)
app.use('/api/gym', webhookRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: '💳 Payment Service - Marketplace Espigón Manta',
    version: '1.0.0',
    pilar: 'Pilar 2: Webhooks e Interoperabilidad B2B',
    endpoints: {
      health: '/health',
      payments: {
        process: 'POST /api/payments/process',
        refund: 'POST /api/payments/refund',
        transaction: 'GET /api/payments/transaction/:id'
      },
      partners: {
        register: 'POST /api/partners/register',
        list: 'GET /api/partners',
        get: 'GET /api/partners/:id',
        update: 'PUT /api/partners/:id',
        delete: 'DELETE /api/partners/:id'
      },
      webhooks: {
        partner: 'POST /api/webhooks/partner',
        stripe: 'POST /api/webhooks/stripe',
        logs: 'GET /api/webhooks/logs'
      }
    },
    features: [
      '✅ Patrón Adapter para múltiples pasarelas',
      '✅ MockAdapter para desarrollo',
      '✅ StripeAdapter para pagos reales',
      '✅ Registro de partners B2B',
      '✅ Webhooks con firma HMAC',
      '✅ Logs de auditoría',
      '✅ Reintentos automáticos'
    ]
  });
});

// ============================================
// Manejo de errores
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Error handler global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);

  res.status(500).json({
    error: 'Error interno del servidor',
    message: env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// Iniciar servidor
// ============================================

const startServer = async () => {
  try {
    // Conectar a base de datos
    await initializeDatabase();

    // Iniciar servidor HTTP
    app.listen(env.PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   💳 PAYMENT SERVICE                                     ║
║   Marketplace Espigón Manta                              ║
║                                                          ║
║   🎯 Pilar 2: Webhooks e Interoperabilidad B2B          ║
║                                                          ║
║   🌐 Puerto: ${env.PORT}                                       ║
║   🔧 Entorno: ${env.NODE_ENV}                             ║
║   💰 Provider: ${env.PAYMENT_PROVIDER.toUpperCase()}                                 ║
║                                                          ║
║   📋 Endpoints disponibles:                              ║
║   • POST   /api/payments/process                        ║
║   • POST   /api/payments/refund                         ║
║   • POST   /api/partners/register                       ║
║   • GET    /api/partners                                 ║
║   • POST   /api/webhooks/partner                        ║
║   • POST   /api/webhooks/stripe                         ║
║   • GET    /health                                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
