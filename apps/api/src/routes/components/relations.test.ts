/**
 * Component Relations API Tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { buildApp } from '../../app';
import type { FastifyInstance } from 'fastify';
import { prisma } from '@electrovault/database';

// Mock Keycloak client
vi.mock('@electrovault/auth', () => ({
  createKeycloakClient: () => ({
    validateToken: vi.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      username: 'testuser',
      roles: ['CONTRIBUTOR'],
    }),
    hasAnyRole: vi.fn((userInfo, roles) => {
      return roles.some((role: string) => userInfo.roles.includes(role));
    }),
  }),
  authPlugin: vi.fn(),
}));

describe('Component Relations API', () => {
  let app: FastifyInstance;
  let categoryId: string;
  let sourceComponentId: string;
  let targetComponentId: string;
  let relationId: string;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    await app.ready();

    // Test-Kategorie erstellen
    const category = await prisma.categoryTaxonomy.create({
      data: {
        name: { en: 'Test Category', de: 'Test Kategorie' },
        slug: 'test-relations-category',
        level: 1,
      },
    });
    categoryId = category.id;

    // Source Component erstellen
    const sourceComponent = await prisma.coreComponent.create({
      data: {
        name: { en: 'NE555 Timer', de: 'NE555 Timer' },
        slug: 'ne555-timer-test',
        categoryId,
        status: 'PUBLISHED',
      },
    });
    sourceComponentId = sourceComponent.id;

    // Target Component erstellen
    const targetComponent = await prisma.coreComponent.create({
      data: {
        name: { en: 'TLC555 Low Power Timer', de: 'TLC555 Stromspar-Timer' },
        slug: 'tlc555-timer-test',
        categoryId,
        status: 'PUBLISHED',
      },
    });
    targetComponentId = targetComponent.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.componentConceptRelation.deleteMany({
      where: {
        OR: [{ sourceId: sourceComponentId }, { targetId: sourceComponentId }],
      },
    });
    await prisma.coreComponent.deleteMany({
      where: { id: { in: [sourceComponentId, targetComponentId] } },
    });
    await prisma.categoryTaxonomy.delete({ where: { id: categoryId } });
    await app.close();
  });

  beforeEach(async () => {
    // Alle Relations zwischen Tests löschen
    await prisma.componentConceptRelation.deleteMany({
      where: {
        OR: [{ sourceId: sourceComponentId }, { targetId: sourceComponentId }],
      },
    });
  });

  describe('GET /components/:id/relations', () => {
    it('should return empty relations for component without relations', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/components/${sourceComponentId}/relations`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toBeDefined();
      expect(body.data.outgoing).toEqual([]);
      expect(body.data.incoming).toEqual([]);
    });

    it('should return 404 for non-existent component', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/components/00000000-0000-0000-0000-000000000000/relations',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('should return outgoing and incoming relations', async () => {
      // Relation erstellen
      await prisma.componentConceptRelation.create({
        data: {
          sourceId: sourceComponentId,
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
          notes: { en: 'TLC555 is a low-power version of NE555' },
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/components/${sourceComponentId}/relations`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.outgoing).toHaveLength(1);
      expect(body.data.outgoing[0].relationType).toBe('LOW_POWER_VERSION');
      expect(body.data.outgoing[0].target.name.en).toBe('TLC555 Low Power Timer');
      expect(body.data.incoming).toHaveLength(0);
    });
  });

  describe('POST /components/:id/relations', () => {
    it('should create a new relation', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/components/${sourceComponentId}/relations`,
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
          notes: { en: 'TLC555 is CMOS version' },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify in database
      const relations = await prisma.componentConceptRelation.findMany({
        where: { sourceId: sourceComponentId },
      });
      expect(relations).toHaveLength(1);
      expect(relations[0].relationType).toBe('LOW_POWER_VERSION');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/components/${sourceComponentId}/relations`,
        payload: {
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate input data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/components/${sourceComponentId}/relations`,
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          targetId: 'invalid-uuid',
          relationType: 'INVALID_TYPE',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should prevent duplicate relations', async () => {
      // Erste Relation erstellen
      await app.inject({
        method: 'POST',
        url: `/api/v1/components/${sourceComponentId}/relations`,
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
        },
      });

      // Versuch, die gleiche Relation nochmal zu erstellen
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/components/${sourceComponentId}/relations`,
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('CONFLICT');
    });
  });

  describe('PATCH /components/:id/relations/:relationId', () => {
    beforeEach(async () => {
      // Relation für Tests erstellen
      const relation = await prisma.componentConceptRelation.create({
        data: {
          sourceId: sourceComponentId,
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
        },
      });
      relationId = relation.id;
    });

    it('should update relation notes', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/components/${sourceComponentId}/relations/${relationId}`,
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          notes: {
            en: 'Updated note: TLC555 is a CMOS version',
            de: 'Aktualisierte Notiz: TLC555 ist eine CMOS-Version',
          },
        },
      });

      expect(response.statusCode).toBe(200);

      // Verify in database
      const updated = await prisma.componentConceptRelation.findUnique({
        where: { id: relationId },
      });
      expect(updated?.notes).toMatchObject({
        en: 'Updated note: TLC555 is a CMOS version',
        de: 'Aktualisierte Notiz: TLC555 ist eine CMOS-Version',
      });
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/components/${sourceComponentId}/relations/${relationId}`,
        payload: {
          notes: { en: 'Updated note' },
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent relation', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/v1/components/${sourceComponentId}/relations/00000000-0000-0000-0000-000000000000`,
        headers: {
          authorization: 'Bearer valid-token',
        },
        payload: {
          notes: { en: 'Updated note' },
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /components/:id/relations/:relationId', () => {
    beforeEach(async () => {
      // Relation für Tests erstellen
      const relation = await prisma.componentConceptRelation.create({
        data: {
          sourceId: sourceComponentId,
          targetId: targetComponentId,
          relationType: 'LOW_POWER_VERSION',
        },
      });
      relationId = relation.id;
    });

    it('should delete a relation', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/components/${sourceComponentId}/relations/${relationId}`,
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(204);

      // Verify deletion
      const deleted = await prisma.componentConceptRelation.findUnique({
        where: { id: relationId },
      });
      expect(deleted).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/components/${sourceComponentId}/relations/${relationId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 for non-existent relation', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/components/${sourceComponentId}/relations/00000000-0000-0000-0000-000000000000`,
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
