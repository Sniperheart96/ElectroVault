/**
 * Category Routes - CRUD API für Kategorien
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { categoryService } from '../../services/category.service';
import { attributeService } from '../../services/attribute.service';
import {
  CategoryListQuerySchema,
  CategoryTreeQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CategoryAttributesQuerySchema,
} from '@electrovault/schemas';

/**
 * Category Routes Plugin
 */
export default async function categoryRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /categories
   * Liste aller Kategorien mit Paginierung
   */
  app.get('/', async (request, reply) => {
    const query = CategoryListQuerySchema.parse(request.query);
    const result = await categoryService.list(query);
    return reply.send(result);
  });

  /**
   * GET /categories/tree
   * Kategorie-Baum (hierarchisch)
   */
  app.get('/tree', async (request, reply) => {
    const query = CategoryTreeQuerySchema.parse(request.query);
    const tree = await categoryService.getTree(query);
    return reply.send({ data: tree });
  });

  /**
   * GET /categories/:id
   * Einzelne Kategorie nach ID
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const category = isUuid
      ? await categoryService.getById(id)
      : await categoryService.getBySlug(id);

    return reply.send({ data: category });
  });

  /**
   * GET /categories/:id/attributes
   * Attribut-Definitionen einer Kategorie (inkl. vererbter)
   */
  app.get<{ Params: { id: string } }>('/:id/attributes', async (request, reply) => {
    const { id } = request.params;
    const query = CategoryAttributesQuerySchema.parse(request.query);

    // Hole Kategorie-Info
    const category = await categoryService.getById(id);

    // Hole Attribute (inkl. vererbter wenn gewünscht)
    const attributes = await attributeService.getByCategory(id, query);

    return reply.send({
      data: {
        categoryId: category.id,
        categoryName: category.name,
        categoryLevel: category.level,
        attributes,
        includeInherited: query.includeInherited,
      },
    });
  });

  /**
   * GET /categories/:id/path
   * Breadcrumb-Pfad zu einer Kategorie
   */
  app.get<{ Params: { id: string } }>('/:id/path', async (request, reply) => {
    const { id } = request.params;
    const path = await categoryService.getPath(id);
    return reply.send({ data: path });
  });

  /**
   * GET /categories/:id/descendants
   * IDs aller Unterkategorien
   */
  app.get<{ Params: { id: string } }>('/:id/descendants', async (request, reply) => {
    const { id } = request.params;
    const descendantIds = await categoryService.getDescendantIds(id);
    return reply.send({ data: { categoryId: id, descendantIds } });
  });

  // ============================================
  // MUTATION ROUTES (Auth required)
  // ============================================

  /**
   * POST /categories
   * Neue Kategorie erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreateCategorySchema.parse(request.body);
      const userId = request.user?.dbId;

      const category = await categoryService.create(data, userId);
      return reply.code(201).send({ data: category });
    }
  );

  /**
   * PATCH /categories/:id
   * Kategorie aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdateCategorySchema.parse(request.body);
      const userId = request.user?.dbId;

      const category = await categoryService.update(id, data, userId);
      return reply.send({ data: category });
    }
  );

  /**
   * DELETE /categories/:id
   * Kategorie löschen (Admin required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      await categoryService.delete(id, userId);
      return reply.code(204).send();
    }
  );
}
