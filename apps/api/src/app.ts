// Fastify App Builder
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import authPlugin from '@electrovault/auth/fastify';
import { createKeycloakClient } from '@electrovault/auth';
import { prisma } from '@electrovault/database';

export interface AppOptions {
  logger?: boolean;
  trustProxy?: boolean;
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger !== false
      ? {
          level: process.env.LOG_LEVEL || 'info',
          transport:
            process.env.NODE_ENV === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                  },
                }
              : undefined,
        }
      : false,
    trustProxy: options.trustProxy ?? true,
    disableRequestLogging: false,
    requestIdLogLabel: 'requestId',
  });

  // ============================================
  // PLUGINS
  // ============================================

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
  });

  // Auth Plugin
  const keycloak = createKeycloakClient();
  await app.register(authPlugin, { keycloak });

  // ============================================
  // HEALTH CHECK
  // ============================================

  app.get('/health', async () => {
    try {
      // Check database connection
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      app.log.error({ error }, 'Health check failed');
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  });

  // ============================================
  // API ROUTES
  // ============================================

  // Version prefix
  app.register(
    async (app) => {
      // Protected test route
      app.get(
        '/me',
        {
          onRequest: app.requireAuth,
        },
        async (request) => {
          return {
            user: request.user,
          };
        }
      );

      // TODO: Register route modules here
      // await app.register(componentsRoutes, { prefix: '/components' });
      // await app.register(manufacturersRoutes, { prefix: '/manufacturers' });
    },
    { prefix: '/api/v1' }
  );

  // ============================================
  // ERROR HANDLER
  // ============================================

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error, url: request.url }, 'Request error');

    // Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      });
    }

    // Default error
    const statusCode = error.statusCode || 500;
    return reply.code(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    });
  });

  // ============================================
  // NOT FOUND HANDLER
  // ============================================

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  return app;
}
