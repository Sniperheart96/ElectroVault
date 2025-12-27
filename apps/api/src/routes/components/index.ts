/**
 * Component Routes - CRUD API für CoreComponents
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { componentService } from '../../services/component.service';
import {
  ComponentListQuerySchema,
  CreateComponentSchema,
  UpdateComponentSchema,
  CreateConceptRelationSchema,
} from '@electrovault/schemas';

/**
 * Component Routes Plugin
 */
export default async function componentRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /components
   * Liste aller Components mit Paginierung und Filterung
   */
  app.get('/', async (request, reply) => {
    const query = ComponentListQuerySchema.parse(request.query);
    const result = await componentService.list(query);
    return reply.send(result);
  });

  /**
   * GET /components/:id
   * Einzelnes Component nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const component = isUuid
      ? await componentService.getById(id)
      : await componentService.getBySlug(id);

    return reply.send({ data: component });
  });

  /**
   * POST /components
   * Neues Component erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreateComponentSchema.parse(request.body);
      const userId = request.user?.dbId;

      const component = await componentService.create(data, userId);
      return reply.code(201).send({ data: component });
    }
  );

  /**
   * PATCH /components/:id
   * Component aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdateComponentSchema.parse(request.body);
      const userId = request.user?.dbId;

      const component = await componentService.update(id, data, userId);
      return reply.send({ data: component });
    }
  );

  /**
   * DELETE /components/:id
   * Component löschen/archivieren (Auth required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      await componentService.delete(id, userId);
      return reply.code(204).send();
    }
  );

  /**
   * POST /components/:id/restore
   * Gelöschtes Component wiederherstellen (Admin required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/restore',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      const component = await componentService.restore(id, userId);
      return reply.send({ data: component });
    }
  );

  /**
   * POST /components/:id/relations
   * Konzept-Beziehung hinzufügen (Auth required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/relations',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = CreateConceptRelationSchema.parse(request.body);
      const userId = request.user?.dbId;

      await componentService.addConceptRelation(id, data, userId);
      return reply.code(201).send({ success: true });
    }
  );

  /**
   * DELETE /components/:id/relations/:relationId
   * Konzept-Beziehung entfernen (Auth required)
   */
  app.delete<{ Params: { id: string; relationId: string } }>(
    '/:id/relations/:relationId',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id, relationId } = request.params;
      await componentService.removeConceptRelation(id, relationId);
      return reply.code(204).send();
    }
  );
}
