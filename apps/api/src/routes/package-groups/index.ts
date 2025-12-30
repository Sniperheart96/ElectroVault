/**
 * PackageGroup Routes - CRUD API für Bauformen-Gruppen
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { packageGroupService } from '../../services/package-group.service';
import {
  PackageGroupListQuerySchema,
  CreatePackageGroupSchema,
  UpdatePackageGroupSchema,
} from '@electrovault/schemas';

/**
 * PackageGroup Routes Plugin
 */
export default async function packageGroupRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /package-groups
   * Liste aller Gruppen mit Paginierung
   */
  app.get('/', async (request, reply) => {
    const query = PackageGroupListQuerySchema.parse(request.query);
    const result = await packageGroupService.list(query);
    return reply.send(result);
  });

  /**
   * GET /package-groups/all
   * Alle Gruppen ohne Paginierung (für Sidebar)
   */
  app.get('/all', async (_request, reply) => {
    const groups = await packageGroupService.listAll();
    return reply.send({ data: groups });
  });

  /**
   * GET /package-groups/:id
   * Einzelne Gruppe nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const group = isUuid
      ? await packageGroupService.getById(id)
      : await packageGroupService.getBySlug(id);

    return reply.send({ data: group });
  });

  /**
   * POST /package-groups
   * Neue Gruppe erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreatePackageGroupSchema.parse(request.body);
      const group = await packageGroupService.create(data);
      return reply.code(201).send({ data: group });
    }
  );

  /**
   * PATCH /package-groups/:id
   * Gruppe aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdatePackageGroupSchema.parse(request.body);
      const group = await packageGroupService.update(id, data);
      return reply.send({ data: group });
    }
  );

  /**
   * DELETE /package-groups/:id
   * Gruppe löschen (Admin required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { id } = request.params;
      await packageGroupService.delete(id);
      return reply.code(204).send();
    }
  );

  /**
   * POST /package-groups/reorder
   * Sortierung ändern (Moderator required)
   */
  app.post<{ Body: { groups: Array<{ id: string; sortOrder: number }> } }>(
    '/reorder',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const schema = z.object({
        groups: z.array(
          z.object({
            id: z.string().uuid(),
            sortOrder: z.number().int(),
          })
        ),
      });

      const { groups } = schema.parse(request.body);
      await packageGroupService.reorder(groups);
      return reply.send({ success: true });
    }
  );
}
