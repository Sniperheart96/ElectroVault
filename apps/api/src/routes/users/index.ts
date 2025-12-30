/**
 * User Routes - API fuer User-spezifische Daten (Dashboard, Statistiken, Entwuerfe)
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { componentService } from '../../services/component.service';
import { auditService } from '../../services/audit.service';

/**
 * User Routes Plugin
 */
export default async function userRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /users/me/stats
   * Statistiken des aktuellen Users (Anzahl Bauteile, Varianten, Status-Verteilung)
   */
  app.get(
    '/me/stats',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const userId = request.user?.dbId;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const stats = await componentService.getUserStats(userId);
      return reply.send({ data: stats });
    }
  );

  /**
   * GET /users/me/components
   * Eigene Bauteile des aktuellen Users (mit optionalem Status-Filter)
   */
  app.get<{ Querystring: { status?: string; limit?: number } }>(
    '/me/components',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const userId = request.user?.dbId;
      const { status, limit } = request.query;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const components = await componentService.getUserComponents(userId, {
        status,
        limit: limit ? Number(limit) : undefined,
      });
      return reply.send({ data: components });
    }
  );

  /**
   * GET /users/me/drafts
   * Entwuerfe (DRAFT) des aktuellen Users
   */
  app.get<{ Querystring: { limit?: number } }>(
    '/me/drafts',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const userId = request.user?.dbId;
      const { limit } = request.query;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const drafts = await componentService.getUserDrafts(
        userId,
        limit ? Number(limit) : undefined
      );
      return reply.send({ data: drafts });
    }
  );

  /**
   * GET /users/me/activity
   * Aktivitaetsverlauf des aktuellen Users
   */
  app.get<{ Querystring: { limit?: number } }>(
    '/me/activity',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const userId = request.user?.dbId;
      const { limit } = request.query;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const activity = await auditService.getUserActivity(
        userId,
        limit ? Number(limit) : 50
      );
      return reply.send({ data: activity });
    }
  );

  /**
   * GET /users/me/dashboard
   * Kombinierte Dashboard-Daten (Stats + Drafts + Activity)
   */
  app.get<{ Querystring: { draftsLimit?: number; activityLimit?: number } }>(
    '/me/dashboard',
    {
      onRequest: app.requireAuth,
    },
    async (request, reply) => {
      const userId = request.user?.dbId;
      const { draftsLimit, activityLimit } = request.query;

      if (!userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      // Alle Dashboard-Daten parallel laden
      const [stats, drafts, activity] = await Promise.all([
        componentService.getUserStats(userId),
        componentService.getUserDrafts(userId, draftsLimit ? Number(draftsLimit) : 5),
        auditService.getUserActivity(userId, activityLimit ? Number(activityLimit) : 10),
      ]);

      return reply.send({
        data: {
          stats,
          drafts,
          activity,
        },
      });
    }
  );
}
