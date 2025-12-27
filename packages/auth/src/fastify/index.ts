// Fastify Auth Plugin for Keycloak
import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { KeycloakClient, UserInfo } from '../keycloak';
import { syncUser } from '../user-sync';
import type { PrismaClient, UserRole } from '@electrovault/database';

export interface AuthenticatedUser extends UserInfo {
  /** Local database user ID (UUID) */
  dbId?: string;
  /** Local database role */
  dbRole?: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export interface AuthPluginOptions {
  keycloak: KeycloakClient;
  prisma?: PrismaClient;
}

/**
 * Fastify Plugin für Keycloak-Auth
 */
const authPlugin: FastifyPluginAsync<AuthPluginOptions> = async (fastify, options) => {
  const { keycloak, prisma } = options;

  // Decorator: user auf Request
  fastify.decorateRequest('user', null);

  /**
   * Sync user to local database and add dbId to user object
   */
  async function syncUserToDb(userInfo: UserInfo): Promise<AuthenticatedUser> {
    const authenticatedUser: AuthenticatedUser = { ...userInfo };

    if (prisma) {
      try {
        const dbUser = await syncUser(prisma, { userInfo });
        authenticatedUser.dbId = dbUser.id;
        authenticatedUser.dbRole = dbUser.role;
      } catch (error) {
        fastify.log.error({ error, userId: userInfo.id }, 'Failed to sync user to database');
        // Continue without dbId - user can still authenticate but won't be tracked
      }
    }

    return authenticatedUser;
  }

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
      const userInfo = await keycloak.validateToken(token);
      request.user = await syncUserToDb(userInfo);
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
      const userInfo = await keycloak.validateToken(token);
      request.user = await syncUserToDb(userInfo);
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
