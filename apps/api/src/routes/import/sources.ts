/**
 * Import Source Routes - CRUD API für Import-Quellen (Distributoren)
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { importSourceService } from '../../services/import';
import {
  ImportSourceListQuerySchema,
  CreateImportSourceSchema,
  UpdateImportSourceSchema,
} from '@electrovault/schemas';

/**
 * Import Source Routes Plugin
 */
export default async function importSourceRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /import/sources
   * Liste aller Import-Quellen mit Paginierung
   */
  app.get('/', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const query = ImportSourceListQuerySchema.parse(request.query);
    const result = await importSourceService.list(query);
    return reply.send(result);
  });

  /**
   * GET /import/sources/:id
   * Einzelne Import-Quelle nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const source = isUuid
      ? await importSourceService.getById(id)
      : await importSourceService.getBySlug(id);

    return reply.send({ data: source });
  });

  /**
   * POST /import/sources
   * Neue Import-Quelle erstellen
   */
  app.post('/', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const input = CreateImportSourceSchema.parse(request.body);
    const source = await importSourceService.create(input, request.user?.dbId);
    return reply.status(201).send({ data: source });
  });

  /**
   * PUT /import/sources/:id
   * Import-Quelle aktualisieren
   */
  app.put<{ Params: { id: string } }>('/:id', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;
    const input = UpdateImportSourceSchema.parse(request.body);
    const source = await importSourceService.update(id, input, request.user?.dbId);
    return reply.send({ data: source });
  });

  /**
   * DELETE /import/sources/:id
   * Import-Quelle löschen
   */
  app.delete<{ Params: { id: string } }>('/:id', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;
    await importSourceService.delete(id);
    return reply.status(204).send();
  });

  /**
   * POST /import/sources/:id/test-connection
   * Verbindung zu einer API-Quelle testen
   */
  app.post<{ Params: { id: string } }>('/:id/test-connection', {
    onRequest: app.requireRole('ADMIN'),
  }, async (request, reply) => {
    const { id } = request.params;
    const result = await importSourceService.testConnection(id);
    return reply.send({ data: result });
  });
}
