// Fastify App Builder
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import compress from '@fastify/compress';
import authPlugin from '@electrovault/auth/fastify';
import { createKeycloakClient } from '@electrovault/auth';
import { prisma } from '@electrovault/database';

// Route Modules
import categoryRoutes from './routes/categories/index';
import manufacturerRoutes from './routes/manufacturers/index';
import packageRoutes from './routes/packages/index';
import packageGroupRoutes from './routes/package-groups/index';
import componentRoutes from './routes/components/index';
import partRoutes from './routes/parts/index';
import attributeRoutes from './routes/attributes/index';
import auditRoutes from './routes/audit/index';
import moderationRoutes from './routes/moderation/index';
import fileRoutes from './routes/files/index';
import pinRoutes from './routes/pins/index';
import statsRoutes from './routes/stats/index';
import userRoutes from './routes/users/index';
import importRoutes from './routes/import/index';

// Custom Error Types
import { ApiError } from './lib/errors';

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

  // CORS - Allow multiple origins for development
  const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.178.80:3000',
    process.env.CORS_ORIGIN,
  ].filter(Boolean) as string[];

  await app.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  // Response Compression (gzip, deflate)
  await app.register(compress, {
    global: true,
    encodings: ['gzip', 'deflate'],
    threshold: 1024, // Only compress responses > 1KB
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

  // Multipart Support (für File Uploads)
  await app.register(multipart, {
    limits: {
      fieldNameSize: 100,      // Max field name size in bytes
      fieldSize: 1000,         // Max field value size in bytes
      fields: 10,              // Max number of non-file fields
      fileSize: 50 * 1024 * 1024,  // Max file size (50MB - wird pro Route überschrieben)
      files: 1,                // Max number of file fields
      headerPairs: 2000,       // Max number of header key=>value pairs
    },
  });

  // Auth Plugin with user sync
  const keycloak = createKeycloakClient();
  await app.register(authPlugin, { keycloak, prisma });

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
    async (api) => {
      // Protected test route
      api.get(
        '/me',
        {
          onRequest: api.requireAuth,
        },
        async (request) => {
          return {
            user: request.user,
          };
        }
      );

      // Register route modules
      await api.register(categoryRoutes, { prefix: '/categories' });
      await api.register(manufacturerRoutes, { prefix: '/manufacturers' });
      await api.register(packageRoutes, { prefix: '/packages' });
      await api.register(packageGroupRoutes, { prefix: '/package-groups' });
      await api.register(componentRoutes, { prefix: '/components' });
      await api.register(partRoutes, { prefix: '/parts' });
      await api.register(attributeRoutes, { prefix: '/attributes' });
      await api.register(auditRoutes, { prefix: '/audit' });
      await api.register(moderationRoutes, { prefix: '/moderation' });
      await api.register(fileRoutes, { prefix: '/files' });
      await api.register(pinRoutes);
      await api.register(statsRoutes, { prefix: '/stats' });
      await api.register(userRoutes, { prefix: '/users' });
      await api.register(importRoutes, { prefix: '/import' });
    },
    { prefix: '/api/v1' }
  );

  // ============================================
  // ERROR HANDLER
  // ============================================

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error, url: request.url }, 'Request error');

    // Zod Validation errors
    if (error.name === 'ZodError') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error,
        },
      });
    }

    // Fastify Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      });
    }

    // Custom API Errors
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
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
