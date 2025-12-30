/**
 * Import Mapping Routes - CRUD API für Import-Mappings
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { importMappingService } from '../../services/import';
import {
  ImportMappingListQuerySchema,
  CreateImportMappingSchema,
  UpdateImportMappingSchema,
  BulkCreateMappingsSchema,
} from '@electrovault/schemas';

/**
 * Import Mapping Routes Plugin
 */
export default async function importMappingRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /import/mappings
   * Liste aller Mappings mit Paginierung
   */
  app.get('/', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const query = ImportMappingListQuerySchema.parse(request.query);
    const result = await importMappingService.list(query);
    return reply.send(result);
  });

  /**
   * GET /import/mappings/global
   * Liste nur globaler Mappings
   */
  app.get('/global', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const query = ImportMappingListQuerySchema.parse(request.query);
    const result = await importMappingService.listGlobal(query);
    return reply.send(result);
  });

  /**
   * GET /import/mappings/source/:sourceId
   * Alle aktiven Mappings für eine Quelle (inkl. globale)
   */
  app.get<{ Params: { sourceId: string } }>('/source/:sourceId', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { sourceId } = request.params;
    const mappings = await importMappingService.getActiveMappingsForSource(sourceId);
    return reply.send({ data: mappings });
  });

  /**
   * GET /import/mappings/:id
   * Einzelnes Mapping nach ID
   */
  app.get<{ Params: { id: string } }>('/:id', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;
    const mapping = await importMappingService.getById(id);
    return reply.send({ data: mapping });
  });

  /**
   * POST /import/mappings
   * Neues Mapping erstellen
   */
  app.post('/', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const input = CreateImportMappingSchema.parse(request.body);
    const mapping = await importMappingService.create(input, request.user?.dbId);
    return reply.status(201).send({ data: mapping });
  });

  /**
   * POST /import/mappings/bulk
   * Mehrere Mappings auf einmal erstellen
   */
  app.post('/bulk', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const input = BulkCreateMappingsSchema.parse(request.body);
    const result = await importMappingService.bulkCreate(input, request.user?.dbId);
    return reply.send({ data: result });
  });

  /**
   * PUT /import/mappings/:id
   * Mapping aktualisieren
   */
  app.put<{ Params: { id: string } }>('/:id', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;
    const input = UpdateImportMappingSchema.parse(request.body);
    const mapping = await importMappingService.update(id, input, request.user?.dbId);
    return reply.send({ data: mapping });
  });

  /**
   * DELETE /import/mappings/:id
   * Mapping löschen
   */
  app.delete<{ Params: { id: string } }>('/:id', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;
    await importMappingService.delete(id);
    return reply.status(204).send();
  });
}
