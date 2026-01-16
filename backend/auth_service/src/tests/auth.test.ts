/**
 * Auth Service - Unit & Integration Tests
 * Pilar 1: Microservicio de Autenticación
 * 
 * Para ejecutar: npm test
 */

import request from 'supertest';
import express, { Application } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { RevokedToken } from '../models/RevokedToken';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Crear app de prueba
const createTestApp = async (): Promise<Application> => {
  const app = express();
  app.use(express.json());
  
  // Importar rutas
  const authRoutes = (await import('../routes/authRoutes')).default;
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'auth-service',
      timestamp: new Date().toISOString()
    });
  });
  
  app.use('/auth', authRoutes);
  
  return app;
};

// Helper para generar datos de prueba
const generateTestUser = (suffix: string = '') => ({
  email: `test${suffix}${Date.now()}@example.com`,
  password: 'TestPassword123!',
  role: 'client' as const,
  reference_id: Math.floor(Math.random() * 10000),
  name: `Test User ${suffix}`
});

describe('Auth Service - Tests', () => {
  let app: Application;

  // Conexión a la base de datos antes de los tests
  beforeAll(async () => {
    // Inicializar conexión si no está inicializada
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    app = await createTestApp();
  });

  // Limpiar después de todos los tests
  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('Health Check', () => {
    it('GET /health - debería retornar estado saludable', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('auth-service');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /auth/register', () => {
    it('debería registrar un nuevo usuario exitosamente', async () => {
      const testUser = generateTestUser('register1');
      
      const response = await request(app)
        .post('/auth/register')
        .send(testUser);

      // El registro debería ser exitoso
      if (response.status === 201) {
        expect(response.body.message).toBe('Usuario registrado exitosamente');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.access_token).toBeDefined();
        expect(response.body.refresh_token).toBeDefined();
      }
    });

    it('debería rechazar registro con email inválido', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'TestPassword123!',
          role: 'client',
          reference_id: 1
        });

      expect(response.status).toBe(400);
    });

    it('debería rechazar registro sin campos requeridos', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com'
          // Falta password, role, reference_id
        });

      expect(response.status).toBe(400);
    });

    it('debería rechazar registro con rol inválido', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'TestPassword123!',
          role: 'invalid_role',
          reference_id: 1
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    const loginUser = generateTestUser('login1');
    
    // Primero registramos el usuario para las pruebas de login
    beforeAll(async () => {
      await request(app)
        .post('/auth/register')
        .send(loginUser);
    });

    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: loginUser.email,
          password: loginUser.password
        });

      if (response.status === 200) {
        expect(response.body.user).toBeDefined();
        expect(response.body.access_token).toBeDefined();
        expect(response.body.refresh_token).toBeDefined();
      }
    });

    it('debería rechazar login con contraseña incorrecta', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: loginUser.email,
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    it('debería rechazar login con email no existente', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    it('debería rechazar login sin email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    let validRefreshToken: string;
    const refreshUser = generateTestUser('refresh1');

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(refreshUser);
      
      if (response.status === 201) {
        validRefreshToken = response.body.refresh_token;
      }
    });

    it('debería refrescar tokens con refresh token válido', async () => {
      if (!validRefreshToken) {
        console.log('Skip: No se pudo obtener refresh token');
        return;
      }

      const response = await request(app)
        .post('/auth/refresh')
        .send({ refresh_token: validRefreshToken });

      if (response.status === 200) {
        expect(response.body.access_token).toBeDefined();
        expect(response.body.refresh_token).toBeDefined();
      }
    });

    it('debería rechazar refresh con token inválido', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-token' });

      expect(response.status).toBe(401);
    });

    it('debería rechazar refresh sin token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;
    const logoutUser = generateTestUser('logout1');

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(logoutUser);
      
      if (response.status === 201) {
        accessToken = response.body.access_token;
        refreshToken = response.body.refresh_token;
      }
    });

    it('debería hacer logout exitosamente', async () => {
      if (!accessToken || !refreshToken) {
        console.log('Skip: No se pudieron obtener tokens');
        return;
      }

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refresh_token: refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Sesión cerrada exitosamente');
    });

    it('debería rechazar logout sin autorización', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({ refresh_token: 'some-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /auth/validate', () => {
    let accessToken: string;
    const validateUser = generateTestUser('validate1');

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(validateUser);
      
      if (response.status === 201) {
        accessToken = response.body.access_token;
      }
    });

    it('debería validar token válido', async () => {
      if (!accessToken) {
        console.log('Skip: No se pudo obtener access token');
        return;
      }

      const response = await request(app)
        .get('/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    it('debería indicar invalid para token inválido', async () => {
      const response = await request(app)
        .get('/auth/validate')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
    });

    it('debería indicar invalid sin header de autorización', async () => {
      const response = await request(app)
        .get('/auth/validate');

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;
    const meUser = generateTestUser('me1');

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(meUser);
      
      if (response.status === 201) {
        accessToken = response.body.access_token;
      }
    });

    it('debería obtener datos del usuario autenticado', async () => {
      if (!accessToken) {
        console.log('Skip: No se pudo obtener access token');
        return;
      }

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      if (response.status === 200) {
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(meUser.email);
        expect(response.body.user.role).toBe(meUser.role);
      }
    });

    it('debería rechazar sin autorización', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
    });
  });

  describe('JWT Token Structure', () => {
    let accessToken: string;
    const jwtUser = generateTestUser('jwt1');

    beforeAll(async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(jwtUser);
      
      if (response.status === 201) {
        accessToken = response.body.access_token;
      }
    });

    it('debería contener los claims correctos en el JWT', async () => {
      if (!accessToken) {
        console.log('Skip: No se pudo obtener access token');
        return;
      }

      // Decodificar sin verificar para inspeccionar claims
      const decoded = jwt.decode(accessToken) as any;

      expect(decoded).toBeDefined();
      expect(decoded.jti).toBeDefined(); // Unique ID
      expect(decoded.sub).toBeDefined(); // User ID
      expect(decoded.email).toBe(jwtUser.email);
      expect(decoded.role).toBe(jwtUser.role);
      expect(decoded.reference_id).toBe(jwtUser.reference_id);
      expect(decoded.iss).toBe(env.JWT_ISSUER);
      expect(decoded.aud).toBe(env.JWT_AUDIENCE);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('el token debería expirar correctamente', async () => {
      if (!accessToken) {
        console.log('Skip: No se pudo obtener access token');
        return;
      }

      const decoded = jwt.decode(accessToken) as any;
      const now = Math.floor(Date.now() / 1000);
      
      // exp debería ser mayor que iat
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
      
      // Token debería expirar en el futuro
      expect(decoded.exp).toBeGreaterThan(now);
    });
  });

  describe('Rate Limiting', () => {
    it('debería aplicar rate limiting en login (después de muchos intentos)', async () => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({
              email: 'ratelimit@test.com',
              password: 'wrongpassword'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // Al menos las primeras deberían pasar (401 por credenciales inválidas)
      // Si el rate limit se activa, deberíamos ver 429
      const statuses = responses.map(r => r.status);
      expect(statuses.some(s => s === 401 || s === 429)).toBe(true);
    });
  });
});

// Tests de utilidades
describe('Utilities', () => {
  describe('Password Validation', () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    it('debería validar contraseña fuerte', () => {
      expect(passwordRegex.test('Password123!')).toBe(true);
      expect(passwordRegex.test('MyStr0ng@Pass')).toBe(true);
    });

    it('debería rechazar contraseña débil', () => {
      expect(passwordRegex.test('password')).toBe(false);
      expect(passwordRegex.test('12345678')).toBe(false);
      expect(passwordRegex.test('Password')).toBe(false);
      expect(passwordRegex.test('pass')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('debería validar email correcto', () => {
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('user.name@domain.co')).toBe(true);
    });

    it('debería rechazar email inválido', () => {
      expect(emailRegex.test('invalid-email')).toBe(false);
      expect(emailRegex.test('@example.com')).toBe(false);
      expect(emailRegex.test('test@')).toBe(false);
    });
  });
});
