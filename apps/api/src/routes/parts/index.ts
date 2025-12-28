/**
 * Part Routes - CRUD API für ManufacturerParts
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { partService } from '../../services/part.service';
import {
  PartListQuerySchema,
  CreatePartSchema,
  UpdatePartSchema,
  CreatePartRelationshipSchema,
  CreateDatasheetSchema,
  CreatePartImageSchema,
  SetPartAttributeValuesSchema,
} from '@electrovault/schemas';

/**
 * Part Routes Plugin
 */
export default async function partRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /parts
   * Liste aller Parts mit Paginierung und Filterung
   */
  app.get('/', async (request, reply) => {
    const query = PartListQuerySchema.parse(request.query);
    const result = await partService.list(query);
    return reply.send(result);
  });

  /**
   * GET /parts/search
   * Schnellsuche für Autocomplete
   */
  app.get<{ Querystring: { q: string; limit?: number } }>(
    '/search',
    async (request, reply) => {
      const { q, limit } = request.query;

      if (!q || q.length < 2) {
        return reply.send({ data: [] });
      }

      const parts = await partService.search(q, limit);
      return reply.send({ data: parts });
    }
  );

  /**
   * GET /parts/:id
   * Einzelnes Part nach ID
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const part = await partService.getById(id);
    return reply.send({ data: part });
  });

  /**
   * GET /parts/by-mpn/:manufacturerId/:mpn
   * Part nach Hersteller und MPN
   */
  app.get<{ Params: { manufacturerId: string; mpn: string } }>(
    '/by-mpn/:manufacturerId/:mpn',
    async (request, reply) => {
      const { manufacturerId, mpn } = request.params;
      const part = await partService.getByMpn(manufacturerId, mpn);
      return reply.send({ data: part });
    }
  );

  /**
   * POST /parts
   * Neues Part erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreatePartSchema.parse(request.body);
      const userId = request.user?.dbId;

      const part = await partService.create(data, userId);
      return reply.code(201).send({ data: part });
    }
  );

  /**
   * PATCH /parts/:id
   * Part aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdatePartSchema.parse(request.body);
      const userId = request.user?.dbId;

      const part = await partService.update(id, data, userId);
      return reply.send({ data: part });
    }
  );

  /**
   * DELETE /parts/:id
   * Part löschen/archivieren (Auth required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      await partService.delete(id, userId);
      return reply.code(204).send();
    }
  );

  /**
   * POST /parts/:id/relationships
   * Part-Beziehung hinzufügen (Auth required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/relationships',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = CreatePartRelationshipSchema.parse(request.body);
      const userId = request.user?.dbId;

      await partService.addRelationship(id, data, userId);
      return reply.code(201).send({ success: true });
    }
  );

  /**
   * POST /parts/:id/datasheets
   * Datasheet hinzufügen (Auth required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/datasheets',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = CreateDatasheetSchema.parse(request.body);
      const userId = request.user?.dbId;

      await partService.addDatasheet(id, data, userId);
      return reply.code(201).send({ success: true });
    }
  );

  /**
   * POST /parts/:id/images
   * Bild hinzufügen (Auth required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/images',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = CreatePartImageSchema.parse(request.body);
      const userId = request.user?.dbId;

      await partService.addImage(id, data, userId);
      return reply.code(201).send({ success: true });
    }
  );

  /**
   * GET /parts/:id/attributes
   * Alle Attributwerte eines Parts abrufen
   */
  app.get<{ Params: { id: string } }>(
    '/:id/attributes',
    async (request, reply) => {
      const { id } = request.params;
      const values = await partService.getAttributeValues(id);
      return reply.send({ data: values });
    }
  );

  /**
   * PUT /parts/:id/attributes
   * Attributwerte eines Parts setzen/aktualisieren (Auth required)
   */
  app.put<{ Params: { id: string } }>(
    '/:id/attributes',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      // Validiere Array von Attributwerten
      const values = SetPartAttributeValuesSchema.parse(request.body);

      await partService.setAttributeValues(id, values, userId);
      return reply.send({ success: true });
    }
  );
}
