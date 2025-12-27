/**
 * Audit Routes - API für Audit-Logs (Read-Only für Non-Admins)
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { auditService } from '../../services/audit.service';
import { AuditLogQuerySchema, EntityHistoryQuerySchema } from '@electrovault/schemas';

/**
 * Audit Routes Plugin
 */
export default async function auditRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /audit
   * Liste aller Audit-Logs (Admin only)
   */
  app.get(
    '/',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const query = AuditLogQuerySchema.parse(request.query);
      const result = await auditService.list(query);
      return reply.send(result);
    }
  );

  /**
   * GET /audit/entity/:entityType/:entityId
   * History einer einzelnen Entität (Moderator+)
   */
  app.get<{ Params: { entityType: string; entityId: string }; Querystring: { limit?: number } }>(
    '/entity/:entityType/:entityId',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { entityType, entityId } = request.params;
      const { limit } = request.query;

      const query = EntityHistoryQuerySchema.parse({
        entityType,
        entityId,
        limit: limit || 50,
      });

      const history = await auditService.getEntityHistory(query);
      return reply.send({ data: history });
    }
  );

  /**
   * GET /audit/user/:userId
   * Aktivitäten eines Users (Admin oder eigener User)
   */
  app.get<{ Params: { userId: string }; Querystring: { limit?: number } }>(
    '/user/:userId',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const { userId } = request.params;
      const { limit } = request.query;

      // Nur eigene Aktivitäten oder Admin
      const isOwnUser = request.user?.id === userId;
      const isAdmin = request.user?.roles?.includes('admin');

      if (!isOwnUser && !isAdmin) {
        return reply.code(403).send({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own activity',
          },
        });
      }

      const activity = await auditService.getUserActivity(userId, limit);
      return reply.send({ data: activity });
    }
  );

  /**
   * GET /audit/my-activity
   * Eigene Aktivitäten des aktuellen Users
   */
  app.get<{ Querystring: { limit?: number } }>(
    '/my-activity',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const userId = request.user?.id;
      const { limit } = request.query;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const activity = await auditService.getUserActivity(userId, limit);
      return reply.send({ data: activity });
    }
  );

  /**
   * GET /audit/stats
   * Statistiken (Admin only)
   */
  app.get<{ Querystring: { fromDate?: string; toDate?: string } }>(
    '/stats',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { fromDate, toDate } = request.query;

      const stats = await auditService.getStats(
        fromDate ? new Date(fromDate) : undefined,
        toDate ? new Date(toDate) : undefined
      );

      return reply.send({ data: stats });
    }
  );
}
