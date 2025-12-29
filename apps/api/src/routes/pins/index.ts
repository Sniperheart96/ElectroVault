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
   * GET /components/:componentId/pins
   * Alle Pins eines CoreComponent
   */
  app.get<{ Params: { componentId: string } }>(
    '/components/:componentId/pins',
    async (request, reply) => {
      const { componentId } = request.params;
      const pins = await pinService.getPinsByComponentId(componentId);
      return reply.send({ data: pins });
    }
  );

  /**
   * POST /components/:componentId/pins
   * Neuen Pin erstellen (Auth required)
   */
  app.post<{ Params: { componentId: string } }>(
    '/components/:componentId/pins',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { componentId } = request.params;
      const data = CreatePinSchema.parse(request.body);
      const userId = request.user?.dbId;

      const pin = await pinService.createPin(componentId, data, userId);
      return reply.code(201).send({ data: pin });
    }
  );

  /**
   * POST /components/:componentId/pins/bulk
   * Mehrere Pins auf einmal erstellen (Auth required)
   */
  app.post<{ Params: { componentId: string } }>(
    '/components/:componentId/pins/bulk',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { componentId } = request.params;
      const data = BulkCreatePinsSchema.parse(request.body);
      const userId = request.user?.dbId;

      const pins = await pinService.bulkCreatePins(componentId, data, userId);
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
   * POST /components/:componentId/pins/reorder
   * Pin-Reihenfolge ändern (Auth required)
   */
  app.post<{ Params: { componentId: string } }>(
    '/components/:componentId/pins/reorder',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { componentId } = request.params;
      const data = BulkReorderPinsSchema.parse(request.body);
      const userId = request.user?.dbId;

      await pinService.reorderPins(componentId, data.pins, userId);
      return reply.send({ success: true });
    }
  );

  /**
   * DELETE /components/:componentId/pins
   * Alle Pins eines Components löschen (Moderator required)
   */
  app.delete<{ Params: { componentId: string } }>(
    '/components/:componentId/pins',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { componentId } = request.params;
      const userId = request.user?.dbId;

      const count = await pinService.deleteAllPins(componentId, userId);
      return reply.send({ deletedCount: count });
    }
  );
}
