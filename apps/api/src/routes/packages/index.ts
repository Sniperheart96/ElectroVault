/**
 * Package Routes - CRUD API für Bauformen/Gehäuse
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { packageService } from '../../services/package.service';
import {
  PackageListQuerySchema,
  CreatePackageSchema,
  UpdatePackageSchema,
  CreateFootprintSchema,
} from '@electrovault/schemas';

/**
 * Package Routes Plugin
 */
export default async function packageRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /packages
   * Liste aller Packages mit Paginierung
   */
  app.get('/', async (request, reply) => {
    const query = PackageListQuerySchema.parse(request.query);
    const result = await packageService.list(query);
    return reply.send(result);
  });

  /**
   * GET /packages/search
   * Schnellsuche für Autocomplete
   */
  app.get<{ Querystring: { q: string; limit?: number } }>(
    '/search',
    async (request, reply) => {
      const { q, limit } = request.query;

      if (!q || q.length < 2) {
        return reply.send({ data: [] });
      }

      const packages = await packageService.search(q, limit);
      return reply.send({ data: packages });
    }
  );

  /**
   * GET /packages/:id
   * Einzelnes Package nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const pkg = isUuid
      ? await packageService.getById(id)
      : await packageService.getBySlug(id);

    return reply.send({ data: pkg });
  });

  /**
   * POST /packages
   * Neues Package erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreatePackageSchema.parse(request.body);
      const pkg = await packageService.create(data);
      return reply.code(201).send({ data: pkg });
    }
  );

  /**
   * PATCH /packages/:id
   * Package aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdatePackageSchema.parse(request.body);
      const pkg = await packageService.update(id, data);
      return reply.send({ data: pkg });
    }
  );

  /**
   * DELETE /packages/:id
   * Package löschen (Admin required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { id } = request.params;
      await packageService.delete(id);
      return reply.code(204).send();
    }
  );

  /**
   * POST /packages/:id/footprints
   * ECAD-Footprint hinzufügen (Auth required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/footprints',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = CreateFootprintSchema.parse(request.body);
      const userId = request.user?.id;

      const footprint = await packageService.addFootprint(id, data, userId);
      return reply.code(201).send({ data: footprint });
    }
  );

  /**
   * DELETE /packages/:id/footprints/:footprintId
   * ECAD-Footprint entfernen (Auth required)
   */
  app.delete<{ Params: { id: string; footprintId: string } }>(
    '/:id/footprints/:footprintId',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id, footprintId } = request.params;
      await packageService.removeFootprint(id, footprintId);
      return reply.code(204).send();
    }
  );
}
