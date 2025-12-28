/**
 * Pin Routes - CRUD API für PinMappings
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { pinService } from '../../services/pin.service';
import {
  CreatePinSchema,
  UpdatePinSchema,
  BulkCreatePinsSchema,
  BulkReorderPinsSchema,
} from '@electrovault/schemas';

/**
 * Pin Routes Plugin
 */
export default async function pinRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /parts/:partId/pins
   * Alle Pins eines ManufacturerPart
   */
  app.get<{ Params: { partId: string } }>(
    '/parts/:partId/pins',
    async (request, reply) => {
      const { partId } = request.params;
      const pins = await pinService.getPinsByPartId(partId);
      return reply.send({ data: pins });
    }
  );

  /**
   * GET /pins/:id
   * Einzelner Pin nach ID
   */
  app.get<{ Params: { id: string } }>('/pins/:id', async (request, reply) => {
    const { id } = request.params;
    const pin = await pinService.getPinById(id);
    return reply.send({ data: pin });
  });

  /**
   * POST /parts/:partId/pins
   * Neuen Pin erstellen (Auth required)
   */
  app.post<{ Params: { partId: string } }>(
    '/parts/:partId/pins',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { partId } = request.params;
      const data = CreatePinSchema.parse(request.body);
      const userId = request.user?.dbId;

      const pin = await pinService.createPin(partId, data, userId);
      return reply.code(201).send({ data: pin });
    }
  );

  /**
   * POST /parts/:partId/pins/bulk
   * Mehrere Pins auf einmal erstellen (Auth required)
   */
  app.post<{ Params: { partId: string } }>(
    '/parts/:partId/pins/bulk',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { partId } = request.params;
      const data = BulkCreatePinsSchema.parse(request.body);
      const userId = request.user?.dbId;

      const pins = await pinService.bulkCreatePins(partId, data, userId);
      return reply.code(201).send({ data: pins });
    }
  );

  /**
   * PATCH /pins/:id
   * Pin aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/pins/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdatePinSchema.parse(request.body);
      const userId = request.user?.dbId;

      const pin = await pinService.updatePin(id, data, userId);
      return reply.send({ data: pin });
    }
  );

  /**
   * DELETE /pins/:id
   * Pin löschen (Auth required)
   */
  app.delete<{ Params: { id: string } }>(
    '/pins/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      await pinService.deletePin(id, userId);
      return reply.code(204).send();
    }
  );

  /**
   * POST /parts/:partId/pins/reorder
   * Pin-Reihenfolge ändern (Auth required)
   */
  app.post<{ Params: { partId: string } }>(
    '/parts/:partId/pins/reorder',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { partId } = request.params;
      const data = BulkReorderPinsSchema.parse(request.body);
      const userId = request.user?.dbId;

      await pinService.reorderPins(partId, data.pins, userId);
      return reply.send({ success: true });
    }
  );

  /**
   * DELETE /parts/:partId/pins
   * Alle Pins eines Parts löschen (Moderator required)
   */
  app.delete<{ Params: { partId: string } }>(
    '/parts/:partId/pins',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { partId } = request.params;
      const userId = request.user?.dbId;

      const count = await pinService.deleteAllPins(partId, userId);
      return reply.send({ deletedCount: count });
    }
  );
}
