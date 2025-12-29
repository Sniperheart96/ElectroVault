/**
 * File Routes - Datei-Upload und Verwaltung
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { assertAuthenticated } from '@electrovault/auth';
import { fileService } from '../../services/file.service';
import { BadRequestError } from '../../lib/errors';

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
   * - languages: String (required, kommasepariert z.B. 'de,en')
   * - description?: String (optional)
   */
  app.post(
    '/datasheet',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      assertAuthenticated(request);
      request.log.info({ route: '/files/datasheet' }, 'Upload started');

      const data = await request.file({
        limits: {
          fileSize: 50 * 1024 * 1024, // 50 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      request.log.info({ filename: data.filename, mimetype: data.mimetype }, 'File received');

      // Datei als Buffer laden
      const buffer = await data.toBuffer();

      // Metadaten aus Form-Feldern
      const partId = (data.fields as any)?.partId?.value;
      const componentId = (data.fields as any)?.componentId?.value;
      const languagesRaw = (data.fields as any)?.languages?.value;
      const description = (data.fields as any)?.description?.value;

      // Sprachen als Array parsen (kommasepariert)
      const languages = languagesRaw
        ? languagesRaw.split(',').map((l: string) => l.trim()).filter(Boolean)
        : [];

      // Sprachen sind Pflichtfeld für Datasheets
      if (languages.length === 0) {
        throw new BadRequestError('At least one language must be specified for datasheets');
      }

      const fileMetadata = await fileService.uploadDatasheet(
        buffer,
        data.filename,
        data.mimetype,
        request.user.dbId,
        {
          partId,
          componentId,
          languages,
          description,
        }
      );

      request.log.info({ fileId: fileMetadata.id }, 'Upload successful');
      return reply.code(201).send({ data: fileMetadata });
    }
  );

  /**
   * POST /files/part-image
   * Upload eines Part-Vorschaubildes (JPG, PNG, WebP)
   * Nur ein Bild pro Part erlaubt - wird im Part.imageUrl gespeichert
   *
   * Multipart Form Data:
   * - file: Bilddatei (max 10MB)
   * - partId: UUID (required)
   *
   * Returns: { data: { imageUrl: string } }
   */
  app.post(
    '/part-image',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      assertAuthenticated(request);

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

      if (!partId) {
        throw new BadRequestError('partId is required');
      }

      const result = await fileService.uploadPartImage(
        buffer,
        data.filename,
        data.mimetype,
        partId
      );

      return reply.code(201).send({ data: result });
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
      assertAuthenticated(request);

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

  /**
   * POST /files/other
   * Upload einer beliebigen Datei (Applikationshinweise, etc.)
   *
   * Multipart Form Data:
   * - file: Beliebige Datei (max 50MB)
   * - partId?: UUID (optional)
   * - componentId?: UUID (optional)
   * - languages?: String (optional, kommasepariert z.B. 'de,en')
   * - description?: String (optional)
   */
  app.post(
    '/other',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      assertAuthenticated(request);

      const data = await request.file({
        limits: {
          fileSize: 50 * 1024 * 1024, // 50 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      const buffer = await data.toBuffer();
      const partId = (data.fields as any)?.partId?.value;
      const componentId = (data.fields as any)?.componentId?.value;
      const languagesRaw = (data.fields as any)?.languages?.value;
      const description = (data.fields as any)?.description?.value;

      // Sprachen als Array parsen (kommasepariert) - optional für Other
      const languages = languagesRaw
        ? languagesRaw.split(',').map((l: string) => l.trim()).filter(Boolean)
        : [];

      const fileMetadata = await fileService.uploadOther(
        buffer,
        data.filename,
        data.mimetype,
        request.user.dbId,
        {
          partId,
          componentId,
          description,
          languages: languages.length > 0 ? languages : undefined,
        }
      );

      return reply.code(201).send({ data: fileMetadata });
    }
  );

  /**
   * POST /files/package-3d
   * Upload eines 3D-Modells für ein Package (STEP, STL, 3MF, OBJ, etc.)
   *
   * Multipart Form Data:
   * - file: 3D-Datei (max 50MB)
   * - packageId: UUID des Packages (required)
   * - description?: String (optional)
   */
  app.post(
    '/package-3d',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      assertAuthenticated(request);

      const data = await request.file({
        limits: {
          fileSize: 50 * 1024 * 1024, // 50 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      const buffer = await data.toBuffer();
      const packageId = (data.fields as any)?.packageId?.value;
      const description = (data.fields as any)?.description?.value;

      if (!packageId) {
        throw new BadRequestError('packageId is required');
      }

      const fileMetadata = await fileService.upload3DModel(
        buffer,
        data.filename,
        data.mimetype,
        request.user.dbId,
        {
          packageId,
          description,
        }
      );

      return reply.code(201).send({ data: fileMetadata });
    }
  );

  /**
   * POST /files/manufacturer-logo
   * Upload eines Hersteller-Logos (JPG, PNG, WebP, SVG)
   *
   * Multipart Form Data:
   * - file: Bilddatei (max 5MB)
   * - manufacturerId: UUID des Herstellers (required)
   *
   * Returns: { data: { logoUrl: string } }
   */
  app.post(
    '/manufacturer-logo',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      assertAuthenticated(request);

      const data = await request.file({
        limits: {
          fileSize: 5 * 1024 * 1024, // 5 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      const buffer = await data.toBuffer();
      const manufacturerId = (data.fields as any)?.manufacturerId?.value;

      if (!manufacturerId) {
        throw new BadRequestError('manufacturerId is required');
      }

      const result = await fileService.uploadManufacturerLogo(
        buffer,
        data.filename,
        data.mimetype,
        manufacturerId
      );

      return reply.code(201).send({ data: result });
    }
  );

  /**
   * POST /files/category-icon
   * Upload eines Kategorie-Icons (JPG, PNG, WebP, SVG)
   *
   * Multipart Form Data:
   * - file: Bilddatei (max 5MB)
   * - categoryId: UUID der Kategorie (required)
   *
   * Returns: { data: { iconUrl: string } }
   */
  app.post(
    '/category-icon',
    {
      onRequest: app.requireAuth,
      preHandler: app.requireRole(['CONTRIBUTOR', 'MODERATOR', 'ADMIN']),
    },
    async (request, reply) => {
      assertAuthenticated(request);

      const data = await request.file({
        limits: {
          fileSize: 5 * 1024 * 1024, // 5 MB
        },
      });

      if (!data) {
        throw new BadRequestError('No file uploaded');
      }

      const buffer = await data.toBuffer();
      const categoryId = (data.fields as any)?.categoryId?.value;

      if (!categoryId) {
        throw new BadRequestError('categoryId is required');
      }

      const result = await fileService.uploadCategoryIcon(
        buffer,
        data.filename,
        data.mimetype,
        categoryId
      );

      return reply.code(201).send({ data: result });
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

  /**
   * GET /files/package/:packageId
   * Holt alle Files eines Packages (z.B. 3D-Modelle)
   */
  app.get<{ Params: { packageId: string } }>(
    '/package/:packageId',
    async (request, reply) => {
      const { packageId } = request.params;
      const files = await fileService.getFilesByPackage(packageId);

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
      assertAuthenticated(request);

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
