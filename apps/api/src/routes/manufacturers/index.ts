/**
 * Manufacturer Routes - CRUD API für Hersteller
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { manufacturerService } from '../../services/manufacturer.service';
import {
  ManufacturerListQuerySchema,
  CreateManufacturerSchema,
  UpdateManufacturerSchema,
} from '@electrovault/schemas';

/**
 * Manufacturer Routes Plugin
 */
export default async function manufacturerRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /manufacturers
   * Liste aller Hersteller mit Paginierung
   */
  app.get('/', async (request, reply) => {
    const query = ManufacturerListQuerySchema.parse(request.query);
    const result = await manufacturerService.list(query);
    return reply.send(result);
  });

  /**
   * GET /manufacturers/search
   * Schnellsuche für Autocomplete
   */
  app.get<{ Querystring: { q: string; limit?: number } }>(
    '/search',
    async (request, reply) => {
      const { q, limit } = request.query;

      if (!q || q.length < 2) {
        return reply.send({ data: [] });
      }

      const manufacturers = await manufacturerService.search(q, limit);
      return reply.send({ data: manufacturers });
    }
  );

  /**
   * GET /manufacturers/:id
   * Einzelner Hersteller nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const manufacturer = isUuid
      ? await manufacturerService.getById(id)
      : await manufacturerService.getBySlug(id);

    return reply.send({ data: manufacturer });
  });

  /**
   * POST /manufacturers
   * Neuen Hersteller erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreateManufacturerSchema.parse(request.body);
      const userId = request.user?.id;

      const manufacturer = await manufacturerService.create(data, userId);
      return reply.code(201).send({ data: manufacturer });
    }
  );

  /**
   * PATCH /manufacturers/:id
   * Hersteller aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdateManufacturerSchema.parse(request.body);
      const userId = request.user?.id;

      const manufacturer = await manufacturerService.update(id, data, userId);
      return reply.send({ data: manufacturer });
    }
  );

  /**
   * DELETE /manufacturers/:id
   * Hersteller löschen (Admin required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { id } = request.params;
      await manufacturerService.delete(id);
      return reply.code(204).send();
    }
  );
}
