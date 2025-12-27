// Tests for Fastify App
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from './app';
import type { FastifyInstance } from 'fastify';

// Mock Keycloak client
vi.mock('@electrovault/auth', () => ({
  createKeycloakClient: () => ({
    validateToken: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['admin'],
    }),
    hasAnyRole: vi.fn((userInfo, roles) => {
      return roles.some((role: string) => userInfo.roles.includes(role));
    }),
  }),
  authPlugin: vi.fn(),
}));

describe('Fastify App', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.database).toBe('connected');
      expect(body.timestamp).toBeDefined();
    });
  });

  describe('API Routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/unknown',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should require auth for /api/v1/me', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/me',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return user info when authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/me',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user).toBeDefined();
      expect(body.user.id).toBe('test-user-id');
      expect(body.user.email).toBe('test@example.com');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/does-not-exist',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('Security Headers', () => {
    it('should set security headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.headers['x-content-type-options']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
