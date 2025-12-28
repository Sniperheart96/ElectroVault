/**
 * File Routes - Datei-Upload und Verwaltung
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { fileService } from '../../services/file.service';
import { BadRequestError, ForbiddenError } from '../../lib/errors';

/**
 * File Routes Plugin
 */
export default async function fileRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // ============================================
  // UPLOAD ROUTES
  // ============================================

  /**
   * POST /files/datasheet
   * Upload eines Datasheets (PDF)
   *
   * Multipart Form Data:
   * - file: PDF-Datei (max 50MB)
   * - partId?: UUID (optional)
   * - componentId?: UUID (optional)
   * - version?: String (optional)
   * - language?: String (optional, z.B. 'de', 'en')
   * - description?: String (optional)
   */
  app.post(
    '/datasheet',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      if (!request.user || !request.user.dbId) {
        throw new BadRequestError('User not authenticated');
      }

      const data = await request.file({
        limits: {
          fileSize: 50 * 1024 * 1024, // 50 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      // Datei als Buffer laden
      const buffer = await data.toBuffer();

      // Metadaten aus Form-Feldern
      const partId = (data.fields as any)?.partId?.value;
      const componentId = (data.fields as any)?.componentId?.value;
      const version = (data.fields as any)?.version?.value;
      const language = (data.fields as any)?.language?.value;
      const description = (data.fields as any)?.description?.value;

      // Upload
      const fileMetadata = await fileService.uploadDatasheet(
        buffer,
        data.filename,
        data.mimetype,
        request.user.dbId,
        {
          partId,
          componentId,
          version,
          language,
          description,
        }
      );

      return reply.code(201).send({ data: fileMetadata });
    }
  );

  /**
   * POST /files/image
   * Upload eines Bildes (JPG, PNG, WebP)
   *
   * Multipart Form Data:
   * - file: Bilddatei (max 10MB)
   * - partId?: UUID (optional)
   * - componentId?: UUID (optional)
   * - description?: String (optional)
   */
  app.post(
    '/image',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      if (!request.user || !request.user.dbId) {
        throw new BadRequestError('User not authenticated');
      }

      const data = await request.file({
        limits: {
          fileSize: 10 * 1024 * 1024, // 10 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      const buffer = await data.toBuffer();

      const partId = (data.fields as any)?.partId?.value;
      const componentId = (data.fields as any)?.componentId?.value;
      const description = (data.fields as any)?.description?.value;

      const fileMetadata = await fileService.uploadImage(
        buffer,
        data.filename,
        data.mimetype,
        request.user.dbId,
        {
          partId,
          componentId,
          description,
        }
      );

      return reply.code(201).send({ data: fileMetadata });
    }
  );

  /**
   * POST /files/pinout
   * Upload eines Pinout-Diagramms (JPG, PNG, WebP, PDF)
   *
   * Multipart Form Data:
   * - file: Pinout-Datei (max 10MB)
   * - partId?: UUID (optional)
   * - componentId?: UUID (optional)
   * - description?: String (optional)
   */
  app.post(
    '/pinout',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      if (!request.user || !request.user.dbId) {
        throw new BadRequestError('User not authenticated');
      }

      const data = await request.file({
        limits: {
          fileSize: 10 * 1024 * 1024, // 10 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      const buffer = await data.toBuffer();

      const partId = (data.fields as any)?.partId?.value;
      const componentId = (data.fields as any)?.componentId?.value;
      const description = (data.fields as any)?.description?.value;

      const fileMetadata = await fileService.uploadPinout(
        buffer,
        data.filename,
        data.mimetype,
        request.user.dbId,
        {
          partId,
          componentId,
          description,
        }
      );

      return reply.code(201).send({ data: fileMetadata });
    }
  );

  // ============================================
  // RETRIEVAL ROUTES
  // ============================================

  /**
   * GET /files/:id
   * Holt die Metadaten einer Datei
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const file = await fileService.getFileById(id);

    if (!file) {
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: 'File not found',
        },
      });
    }

    return reply.send({ data: file });
  });

  /**
   * GET /files/:id/download
   * Generiert eine Presigned URL für den Download
   */
  app.get<{ Params: { id: string } }>(
    '/:id/download',
    async (request, reply) => {
      const { id } = request.params;
      const url = await fileService.getDownloadUrl(id);

      return reply.send({
        data: {
          id,
          url,
          expiresIn: 24 * 60 * 60, // Sekunden
        },
      });
    }
  );

  /**
   * GET /files/component/:componentId
   * Holt alle Files eines Components
   */
  app.get<{ Params: { componentId: string } }>(
    '/component/:componentId',
    async (request, reply) => {
      const { componentId } = request.params;
      const files = await fileService.getFilesByComponent(componentId);

      return reply.send({ data: files });
    }
  );

  /**
   * GET /files/part/:partId
   * Holt alle Files eines Parts
   */
  app.get<{ Params: { partId: string } }>(
    '/part/:partId',
    async (request, reply) => {
      const { partId } = request.params;
      const files = await fileService.getFilesByPart(partId);

      return reply.send({ data: files });
    }
  );

  // ============================================
  // DELETE ROUTE
  // ============================================

  /**
   * DELETE /files/:id
   * Löscht eine Datei (Soft-Delete)
   *
   * Nur der Uploader, Moderator oder Admin dürfen löschen
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      if (!request.user || !request.user.dbId || !request.user.dbRole) {
        throw new BadRequestError('User not authenticated');
      }

      const { id } = request.params;

      await fileService.deleteFile(id, request.user.dbId, request.user.dbRole);

      return reply.code(204).send();
    }
  );

  // ============================================
  // STATS ROUTE (Admin only)
  // ============================================

  /**
   * GET /files/stats
   * Holt Statistiken über File-Uploads
   */
  app.get(
    '/stats',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const stats = await fileService.getStats();
      return reply.send({ data: stats });
    }
  );
}
