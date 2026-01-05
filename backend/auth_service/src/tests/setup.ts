/**
 * Jest Test Setup
 * Configuración inicial para los tests
 */

// Aumentar timeout para operaciones de DB
jest.setTimeout(30000);

// Silenciar logs durante tests (opcional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.JWT_ISSUER = 'auth-service';
process.env.JWT_AUDIENCE = 'marketplace-espigon';
process.env.BCRYPT_SALT_ROUNDS = '10';
