// Fastify Auth Plugin for Keycloak
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { KeycloakClient, UserInfo } from '../keycloak';

declare module 'fastify' {
  interface FastifyRequest {
    user?: UserInfo;
  }
}

export interface AuthPluginOptions {
  keycloak: KeycloakClient;
}

/**
 * Fastify Plugin für Keycloak-Auth
 */
const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, options) => {
  const { keycloak } = options;

  // Decorator: user auf Request
  fastify.decorateRequest('user', null);

  /**
   * Extract Bearer token from Authorization header
   */
  function extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Hook: Optionale Auth (setzt user wenn Token vorhanden)
   */
  fastify.decorate('optionalAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extractToken(request);
    if (!token) {
      return; // Kein Token → kein User, aber kein Fehler
    }

    try {
      request.user = await keycloak.validateToken(token);
    } catch (error) {
      // Ungültiger Token → ignorieren, kein User
      request.log.warn({ error }, 'Invalid token in optionalAuth');
    }
  });

  /**
   * Hook: Auth erforderlich
   */
  fastify.decorate('requireAuth', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = extractToken(request);
    if (!token) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authorization token',
        },
      });
    }

    try {
      request.user = await keycloak.validateToken(token);
    } catch (error) {
      request.log.error({ error }, 'Token validation failed');
      return reply.code(401).send({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }
  });

  /**
   * Hook: Rolle erforderlich
   */
  fastify.decorate('requireRole', (role: string | string[]) => {
    const requiredRoles = Array.isArray(role) ? role : [role];

    return async (request: FastifyRequest, reply: FastifyReply) => {
      // Erst Auth prüfen
      await fastify.requireAuth(request, reply);

      if (!request.user) {
        return; // Bereits durch requireAuth abgelehnt
      }

      // Rolle prüfen
      const hasRole = keycloak.hasAnyRole(request.user, requiredRoles);
      if (!hasRole) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: `Required role(s): ${requiredRoles.join(', ')}`,
          },
        });
      }
    };
  });
};

export default fp(authPlugin, {
  name: 'auth-plugin',
  fastify: '4.x',
});

// Type declarations for decorators
declare module 'fastify' {
  interface FastifyInstance {
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      role: string | string[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
