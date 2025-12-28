/**
 * Moderation Routes - API für Moderations-Queue
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { moderationService } from '../../services/moderation.service';
import { PaginationSchema } from '@electrovault/schemas';

// ============================================
// ROUTES
// ============================================

/**
 * Moderation Routes Plugin
 */
export default async function moderationRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /moderation/queue
   * Kombinierte Queue (Components + Parts)
   * Nur für MODERATOR und ADMIN
   */
  app.get(
    '/queue',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const query = PaginationSchema.parse(request.query);
      const result = await moderationService.getCombinedQueue(query);
      return reply.send(result);
    }
  );

  /**
   * GET /moderation/queue/components
   * Nur PENDING Components
   * Nur für MODERATOR und ADMIN
   */
  app.get(
    '/queue/components',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const query = PaginationSchema.parse(request.query);
      const result = await moderationService.getPendingComponents(query);
      return reply.send(result);
    }
  );

  /**
   * GET /moderation/queue/parts
   * Nur PENDING Parts
   * Nur für MODERATOR und ADMIN
   */
  app.get(
    '/queue/parts',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const query = PaginationSchema.parse(request.query);
      const result = await moderationService.getPendingParts(query);
      return reply.send(result);
    }
  );

  /**
   * GET /moderation/stats
   * Statistiken für die Queue
   * Nur für MODERATOR und ADMIN
   */
  app.get(
    '/stats',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const stats = await moderationService.getQueueStats();
      return reply.send({ data: stats });
    }
  );

  /**
   * POST /moderation/component/:id/approve
   * Component freigeben
   * Nur für MODERATOR und ADMIN
   */
  app.post<{ Params: { id: string } }>(
    '/component/:id/approve',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found',
          },
        });
      }

      const component = await moderationService.moderateComponent({
        componentId: id,
        action: 'APPROVE',
        moderatorId: userId,
      });

      return reply.send({ data: component });
    }
  );

  /**
   * POST /moderation/component/:id/reject
   * Component ablehnen
   * Nur für MODERATOR und ADMIN
   */
  app.post<{ Params: { id: string }; Body: { comment?: string } }>(
    '/component/:id/reject',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const { id } = request.params;
      const { comment } = request.body;
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found',
          },
        });
      }

      const component = await moderationService.moderateComponent({
        componentId: id,
        action: 'REJECT',
        comment,
        moderatorId: userId,
      });

      return reply.send({ data: component });
    }
  );

  /**
   * POST /moderation/part/:id/approve
   * Part freigeben
   * Nur für MODERATOR und ADMIN
   */
  app.post<{ Params: { id: string } }>(
    '/part/:id/approve',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found',
          },
        });
      }

      const part = await moderationService.moderatePart({
        partId: id,
        action: 'APPROVE',
        moderatorId: userId,
      });

      return reply.send({ data: part });
    }
  );

  /**
   * POST /moderation/part/:id/reject
   * Part ablehnen
   * Nur für MODERATOR und ADMIN
   */
  app.post<{ Params: { id: string }; Body: { comment?: string } }>(
    '/part/:id/reject',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const { id } = request.params;
      const { comment } = request.body;
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found',
          },
        });
      }

      const part = await moderationService.moderatePart({
        partId: id,
        action: 'REJECT',
        comment,
        moderatorId: userId,
      });

      return reply.send({ data: part });
    }
  );

  /**
   * POST /moderation/batch/approve
   * Mehrere Components freigeben
   * Nur für MODERATOR und ADMIN
   */
  app.post<{ Body: { componentIds: string[] } }>(
    '/batch/approve',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const { componentIds } = request.body;
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found',
          },
        });
      }

      if (!componentIds || !Array.isArray(componentIds) || componentIds.length === 0) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'componentIds must be a non-empty array',
          },
        });
      }

      const count = await moderationService.batchApprove(componentIds, userId);

      return reply.send({
        data: {
          approved: count,
          total: componentIds.length,
        },
      });
    }
  );

  /**
   * POST /moderation/batch/reject
   * Mehrere Components ablehnen
   * Nur für MODERATOR und ADMIN
   */
  app.post<{ Body: { componentIds: string[]; comment: string } }>(
    '/batch/reject',
    {
      onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      const { componentIds, comment } = request.body;
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found',
          },
        });
      }

      if (!componentIds || !Array.isArray(componentIds) || componentIds.length === 0) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'componentIds must be a non-empty array',
          },
        });
      }

      if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'comment is required for batch rejection',
          },
        });
      }

      const count = await moderationService.batchReject(componentIds, comment, userId);

      return reply.send({
        data: {
          rejected: count,
          total: componentIds.length,
        },
      });
    }
  );
}
