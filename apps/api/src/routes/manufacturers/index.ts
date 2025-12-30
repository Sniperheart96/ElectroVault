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
import { minioClient, BUCKET_NAME } from '../../lib/minio';
import {
  NotFoundError,
  transformManufacturerLogoUrls,
  transformManufacturerLogoUrl,
  getImageContentType,
} from '../../lib';

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
   * optionalAuth: User-Info verfügbar falls eingeloggt (für eigene Entwürfe)
   */
  app.get('/', {
    onRequest: app.optionalAuth,
  }, async (request, reply) => {
    const parsedQuery = ManufacturerListQuerySchema.parse(request.query);

    // userId nur setzen wenn includeDrafts aktiv UND User eingeloggt
    const query = {
      ...parsedQuery,
      userId: parsedQuery.includeDrafts && request.user?.dbId
        ? request.user.dbId
        : undefined,
    };

    const result = await manufacturerService.list(query);

    // Ersetze MinIO-URLs mit API-Proxy-URLs
    result.data = transformManufacturerLogoUrls(result.data);

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

      // Ersetze MinIO-URLs mit API-Proxy-URLs
      return reply.send({ data: transformManufacturerLogoUrls(manufacturers) });
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

    // Ersetze MinIO-URL mit API-Proxy-URL
    return reply.send({ data: transformManufacturerLogoUrl(manufacturer) });
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
      // Use local database ID, not Keycloak ID
      const userId = request.user?.dbId;

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
      // Use local database ID, not Keycloak ID
      const userId = request.user?.dbId;

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

  /**
   * GET /manufacturers/:id/logo
   * Logo-Proxy: Holt das Logo von MinIO und sendet es an den Client
   * Löst CORS-Probleme, da alle Requests über die gleiche Origin laufen
   */
  app.get<{ Params: { id: string } }>(
    '/:id/logo',
    async (request, reply) => {
      const { id } = request.params;

      // Hersteller abrufen um logoUrl zu bekommen
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      const manufacturer = isUuid
        ? await manufacturerService.getById(id)
        : await manufacturerService.getBySlug(id);

      if (!manufacturer.logoUrl) {
        throw new NotFoundError('Logo', id);
      }

      // Extrahiere Bucket-Pfad aus logoUrl
      // logoUrl Format: http://192.168.178.80:9000/electrovault-files/logos/manufacturers/...
      const url = new URL(manufacturer.logoUrl);
      const pathParts = url.pathname.split('/');
      // Entferne leeren ersten Teil und Bucket-Namen
      const bucketPath = pathParts.slice(2).join('/'); // logos/manufacturers/...

      try {
        // Hole das Objekt von MinIO
        const stream = await minioClient.getObject(BUCKET_NAME.toString(), bucketPath);

        // Setze Header für Cross-Origin Zugriff
        // WICHTIG: Cross-Origin-Resource-Policy muss 'cross-origin' sein,
        // damit das Frontend (Port 3000) Bilder von der API (Port 3001) laden kann
        reply.header('Content-Type', getImageContentType(bucketPath));
        reply.header('Cache-Control', 'public, max-age=604800'); // 7 Tage
        reply.header('Cross-Origin-Resource-Policy', 'cross-origin');
        reply.header('Access-Control-Allow-Origin', '*');

        // Streame das Bild an den Client
        return reply.send(stream);
      } catch (error) {
        console.error('[Manufacturer Logo Proxy] Failed to fetch logo:', error);
        throw new NotFoundError('Logo file', bucketPath);
      }
    }
  );
}
