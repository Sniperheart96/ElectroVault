/**
 * Component Routes - CRUD API für CoreComponents
 */

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { componentService } from '../../services/component.service';
import { partService } from '../../services/part.service';
import {
  ComponentSearchQuerySchema,
  CreateComponentSchema,
  UpdateComponentSchema,
  CreateConceptRelationSchema,
  UpdateConceptRelationSchema,
} from '@electrovault/schemas';

/**
 * Component Routes Plugin
 */
export default async function componentRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  /**
   * GET /components
   * Liste aller Components mit Paginierung und Filterung
   *
   * Unterstützt Attribut-basierte Filter über den Query-Parameter 'attributeFilters'.
   * Filter werden als JSON-Array übergeben, z.B.:
   * ?attributeFilters=[{"definitionId":"uuid","operator":"between","value":1e-6,"valueTo":100e-6}]
   *
   * Wenn includeDrafts=true, werden eigene Entwuerfe mit angezeigt.
   * Die userId wird automatisch vom Backend gesetzt falls der User eingeloggt ist.
   */
  app.get('/', {
    // Optional Auth: User wird gesetzt wenn Token vorhanden, sonst anonym
    onRequest: app.optionalAuth,
  }, async (request, reply) => {
    console.log('[FilterDebug] GET /components - Raw query:', request.query);

    // attributeFilters aus Query-String parsen (als JSON string)
    const rawQuery = request.query as Record<string, unknown>;
    if (typeof rawQuery.attributeFilters === 'string') {
      console.log('[FilterDebug] attributeFilters string (raw):', rawQuery.attributeFilters);
      try {
        rawQuery.attributeFilters = JSON.parse(rawQuery.attributeFilters);
        console.log('[FilterDebug] attributeFilters parsed:', rawQuery.attributeFilters);
      } catch (error) {
        // Parse-Fehler loggen (nicht stillschweigend ignorieren)
        request.log.warn({
          msg: 'Failed to parse attributeFilters JSON',
          input: rawQuery.attributeFilters?.substring(0, 100),
          error: error instanceof Error ? error.message : 'Unknown parse error',
        });
        console.log('[FilterDebug] attributeFilters parse FAILED:', error);
        delete rawQuery.attributeFilters;
      }
    }

    const parsedQuery = ComponentSearchQuerySchema.parse(rawQuery);
    console.log('[FilterDebug] Parsed query:', parsedQuery);

    // Wenn includeDrafts gesetzt ist und User eingeloggt, userId hinzufuegen
    const query = {
      ...parsedQuery,
      // userId nur setzen wenn includeDrafts=true und User authentifiziert
      userId: parsedQuery.includeDrafts && request.user?.dbId ? request.user.dbId : undefined,
    };

    // searchWithFilters nutzen wenn Filter vorhanden, sonst list()
    const result = query.attributeFilters && query.attributeFilters.length > 0
      ? await componentService.searchWithFilters(query)
      : await componentService.list(query);

    return reply.send(result);
  });

  /**
   * GET /components/:id
   * Einzelnes Component nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // Prüfen ob UUID oder Slug
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const component = isUuid
      ? await componentService.getById(id)
      : await componentService.getBySlug(id);

    return reply.send({ data: component });
  });

  /**
   * POST /components
   * Neues Component erstellen (Auth required)
   */
  app.post(
    '/',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const data = CreateComponentSchema.parse(request.body);
      const userId = request.user?.dbId;

      const component = await componentService.create(data, userId);
      return reply.code(201).send({ data: component });
    }
  );

  /**
   * PATCH /components/:id
   * Component aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = UpdateComponentSchema.parse(request.body);
      const userId = request.user?.dbId;

      const component = await componentService.update(id, data, userId);
      return reply.send({ data: component });
    }
  );

  /**
   * DELETE /components/:id
   * Component löschen/archivieren (Auth required)
   */
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      await componentService.delete(id, userId);
      return reply.code(204).send();
    }
  );

  /**
   * POST /components/:id/restore
   * Gelöschtes Component wiederherstellen (Admin required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/restore',
    {
      onRequest: app.requireRole('ADMIN'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const userId = request.user?.dbId;

      const component = await componentService.restore(id, userId);
      return reply.send({ data: component });
    }
  );

  /**
   * GET /components/:id/relations
   * Alle Konzept-Beziehungen eines Components
   */
  app.get<{ Params: { id: string } }>('/:id/relations', async (request, reply) => {
    const { id } = request.params;
    const relations = await componentService.getConceptRelations(id);
    return reply.send({ data: relations });
  });

  /**
   * POST /components/:id/relations
   * Konzept-Beziehung hinzufügen (Auth required)
   */
  app.post<{ Params: { id: string } }>(
    '/:id/relations',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id } = request.params;
      const data = CreateConceptRelationSchema.parse(request.body);
      const userId = request.user?.dbId;

      await componentService.addConceptRelation(id, data, userId);
      return reply.code(201).send({ success: true });
    }
  );

  /**
   * PATCH /components/:id/relations/:relationId
   * Konzept-Beziehung aktualisieren (Auth required)
   */
  app.patch<{ Params: { id: string; relationId: string } }>(
    '/:id/relations/:relationId',
    {
      onRequest: app.requireRole('CONTRIBUTOR'),
    },
    async (request, reply) => {
      const { id, relationId } = request.params;
      const data = UpdateConceptRelationSchema.parse(request.body);
      const userId = request.user?.dbId;

      await componentService.updateConceptRelation(id, relationId, data, userId);
      return reply.send({ success: true });
    }
  );

  /**
   * DELETE /components/:id/relations/:relationId
   * Konzept-Beziehung entfernen (Auth required)
   */
  app.delete<{ Params: { id: string; relationId: string } }>(
    '/:id/relations/:relationId',
    {
      onRequest: app.requireRole('MODERATOR'),
    },
    async (request, reply) => {
      const { id, relationId } = request.params;
      await componentService.removeConceptRelation(id, relationId);
      return reply.code(204).send();
    }
  );

  /**
   * GET /components/:id/parts
   * Alle ManufacturerParts eines Components
   */
  app.get<{ Params: { id: string } }>('/:id/parts', async (request, reply) => {
    const { id } = request.params;
    const parts = await partService.getByComponentId(id);
    return reply.send({ data: parts });
  });
}
