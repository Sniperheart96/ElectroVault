/**
 * Attribute Routes - CRUD API für Attribut-Definitionen
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { attributeService } from '../../services/attribute.service';
import {
  AttributeListQuerySchema,
  CreateAttributeDefinitionSchema,
  UpdateAttributeDefinitionSchema,
  CategoryAttributesQuerySchema,
  ReorderAttributesSchema,
} from '@electrovault/schemas';

/**
 * Attribute Routes Plugin
 */
export default async function attributeRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  /**
   * GET /attributes
   * Liste aller Attribut-Definitionen mit Paginierung
   */
  app.get('/', async (request, reply) => {
    const query = AttributeListQuerySchema.parse(request.query);
    const result = await attributeService.list(query);
    return reply.send(result);
  });

  /**
   * GET /attributes/by-category/:categoryId
   * Alle Attribute einer Kategorie (inkl. vererbter)
   */
  app.get<{ Params: { categoryId: string }; Querystring: { scope?: string; includeInherited?: string } }>(
    '/by-category/:categoryId',
    async (request, reply) => {
      const { categoryId } = request.params;
      const query = CategoryAttributesQuerySchema.parse({
        ...request.query,
        includeInherited: request.query.includeInherited !== 'false',
      });
      const attributes = await attributeService.getByCategory(categoryId, query);
      return reply.send({ data: attributes });
    }
  );

  /**
   * GET /attributes/:id
   * Einzelne Attribut-Definition nach ID
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const attribute = await attributeService.getById(id);
    return reply.send({ data: attribute });
  });

  // ============================================
  // MUTATION ROUTES (Auth required)
  // ============================================

  /**
   * POST /attributes
   * Neue Attribut-Definition erstellen (CONTRIBUTOR)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreateAttributeDefinitionSchema.parse(request.body);
      const userId = request.user?.dbId;

      const attribute = await attributeService.create(data, userId);
      return reply.code(201).send({ data: attribute });
    }
  );

  /**
   * PATCH /attributes/:id
   * Attribut-Definition aktualisieren (CONTRIBUTOR)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdateAttributeDefinitionSchema.parse(request.body);
      const userId = request.user?.dbId;

      const attribute = await attributeService.update(id, data, userId);
      return reply.send({ data: attribute });
    }
  );

  /**
   * DELETE /attributes/:id
   * Attribut-Definition löschen (MODERATOR)
   * Nur möglich wenn keine Werte zugeordnet sind
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      await attributeService.delete(id, userId);
      return reply.code(204).send();
    }
  );

  /**
   * POST /attributes/reorder
   * Sortierreihenfolge von Attributen aktualisieren (MODERATOR)
   */
  app.post(
    '/reorder',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const data = ReorderAttributesSchema.parse(request.body);
      const userId = request.user?.dbId;

      await attributeService.reorder(data.categoryId, data.attributes, userId);
      return reply.send({ success: true });
    }
  );
}
