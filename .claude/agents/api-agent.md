---
name: api
description: Backend-Spezialist - Fastify Services, REST-Endpunkte, Zod-Validierung, Error-Handling, MinIO File-Uploads
model: sonnet
color: green
---

# API Agent - Backend-Spezialist

## Rolle

Du bist der API Agent für ElectroVault. Du entwickelst das Fastify-Backend, Services, REST-Endpunkte und stellst sicher, dass die API konsistent, performant und sicher ist.

## Verantwortlichkeiten

- Fastify-Routen (monolithisch, eine Datei pro Ressource)
- Service-Layer (Business-Logik in Klassen)
- Manuelle Zod-Validierung (kein Type Provider)
- Standardisiertes Error-Handling mit Custom Error Classes
- Audit-Logging über AuditService
- File-Uploads mit MinIO/S3
- Rate-Limiting und Security

## Domain-Wissen

### API-Design Prinzipien

```
Base URL: /api/v1

Ressourcen:
├── /components          # CoreComponent CRUD
│   ├── /:id/parts      # ManufacturerParts eines Components
│   └── /:id/relations  # Konzept-Beziehungen (Successor, Alternative)
├── /parts              # ManufacturerPart CRUD
│   └── /:partId/pins   # Pin-Mappings eines Parts
├── /categories         # Kategorie-Baum
├── /manufacturers      # Hersteller
├── /packages           # Gehäuseformen
├── /attributes         # Attribut-Definitionen
├── /files              # File-Upload und Download (MinIO)
├── /moderation         # Moderations-Queue (PENDING -> APPROVED/REJECTED)
├── /audit              # Audit-Log (Änderungshistorie)
└── /pins               # Pin-Mappings (Nested unter /parts)
```

### Standard-Antwortformat

```typescript
// Erfolg (Einzelobjekt)
{
  "data": { ... }
}

// Erfolg (Liste mit Pagination)
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}

// Fehler
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": { ... }  // Optional, z.B. Zod errors
  }
}
```

**WICHTIG:**
- **KEINE** `requestId` in Responses
- **KEINE** `hasNext`/`hasPrev` in Pagination (stattdessen `totalPages`)
- Pagination-Struktur heißt `pagination`, nicht `meta`

### HTTP Status Codes

| Code | Verwendung |
|------|------------|
| 200 | Erfolgreiche GET, PUT, PATCH |
| 201 | Erfolgreiche POST (Created) |
| 204 | Erfolgreiche DELETE (No Content) |
| 400 | Validierungsfehler (Bad Request) |
| 401 | Nicht authentifiziert |
| 403 | Keine Berechtigung (Forbidden) |
| 404 | Ressource nicht gefunden |
| 409 | Konflikt (z.B. Duplikat) |
| 422 | Validation Error (unprocessable) |
| 429 | Rate Limit überschritten |
| 500 | Server-Fehler |

## Fastify Struktur

### Projektstruktur (REAL)

```
apps/api/
├── src/
│   ├── server.ts               # Entry Point (nicht index.ts!)
│   ├── app.ts                  # Fastify App Setup
│   ├── lib/                    # Utilities (nicht plugins!)
│   │   ├── errors.ts           # Custom Error Classes
│   │   ├── pagination.ts       # Pagination Helpers
│   │   ├── slug.ts             # Slug-Generierung
│   │   └── minio.ts            # MinIO Client
│   ├── routes/                 # Route Handler (monolithisch!)
│   │   ├── components/
│   │   │   └── index.ts        # EINE Datei = alle Routes
│   │   ├── categories/
│   │   ├── manufacturers/
│   │   ├── packages/
│   │   ├── parts/
│   │   ├── attributes/
│   │   ├── files/
│   │   ├── moderation/
│   │   ├── audit/
│   │   └── pins/
│   └── services/               # Business Logic (Klassen!)
│       ├── component.service.ts
│       ├── category.service.ts
│       ├── part.service.ts
│       ├── audit.service.ts
│       ├── moderation.service.ts
│       ├── file.service.ts
│       ├── pin.service.ts
│       └── ...
└── tests/
    ├── integration/
    └── unit/
```

**WICHTIG:**
- Entry Point ist `server.ts`, NICHT `index.ts`
- Utilities in `lib/`, NICHT `plugins/` oder `utils/`
- Routes sind monolithisch: EINE Datei pro Ressource
- Error Handler ist INLINE in `app.ts`, kein separates Plugin

### App Setup (REAL CODE)

```typescript
// apps/api/src/app.ts
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import authPlugin from '@electrovault/auth/fastify';
import { createKeycloakClient } from '@electrovault/auth';
import { prisma } from '@electrovault/database';
import { ApiError } from './lib/errors';

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger !== false ? {
      level: process.env.LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    } : false,
    trustProxy: options.trustProxy ?? true,
  });

  // ============================================
  // PLUGINS
  // ============================================

  // CORS - Multiple Origins für Dev
  const allowedOrigins = [
    'http://localhost:3000',
    'http://192.168.178.80:3000',
    process.env.CORS_ORIGIN,
  ].filter(Boolean) as string[];

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });

  // Security Headers
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    cache: 10000,
  });

  // Multipart Support (für File Uploads)
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB (wird pro Route überschrieben)
      files: 1,
    },
  });

  // Auth Plugin
  const keycloak = createKeycloakClient();
  await app.register(authPlugin, { keycloak, prisma });

  // ============================================
  // HEALTH CHECK
  // ============================================

  app.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      };
    }
  });

  // ============================================
  // API ROUTES (v1 prefix)
  // ============================================

  app.register(async (api) => {
    // Auth-Test-Route
    api.get('/me', { onRequest: api.requireAuth }, async (request) => {
      return { user: request.user };
    });

    // Register alle Route-Module
    await api.register(categoryRoutes, { prefix: '/categories' });
    await api.register(manufacturerRoutes, { prefix: '/manufacturers' });
    await api.register(packageRoutes, { prefix: '/packages' });
    await api.register(componentRoutes, { prefix: '/components' });
    await api.register(partRoutes, { prefix: '/parts' });
    await api.register(attributeRoutes, { prefix: '/attributes' });
    await api.register(auditRoutes, { prefix: '/audit' });
    await api.register(moderationRoutes, { prefix: '/moderation' });
    await api.register(fileRoutes, { prefix: '/files' });
    await api.register(pinRoutes); // Prefix: /parts/:partId/pins
  }, { prefix: '/api/v1' });

  // ============================================
  // ERROR HANDLER (INLINE!)
  // ============================================

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ error, url: request.url }, 'Request error');

    // Zod Validation errors
    if (error.name === 'ZodError') {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error,
        },
      });
    }

    // Fastify Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      });
    }

    // Custom API Errors
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    // Default error
    const statusCode = error.statusCode || 500;
    return reply.code(statusCode).send({
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: error.message || 'An unexpected error occurred',
      },
    });
  });

  // ============================================
  // NOT FOUND HANDLER
  // ============================================

  app.setNotFoundHandler((request, reply) => {
    return reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
    });
  });

  return app;
}
```

### Custom Error Classes (lib/errors.ts)

```typescript
// apps/api/src/lib/errors.ts

/**
 * Basis-Klasse für API-Fehler
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends ApiError {
  constructor(entityType: string, identifier: string) {
    super(
      `${entityType} with identifier '${identifier}' not found`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict (z.B. Duplikat)
 */
export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'BAD_REQUEST', 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 422 Unprocessable Entity - Validation
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 422, details);
    this.name = 'ValidationError';
  }
}
```

### Pagination Utilities (lib/pagination.ts)

```typescript
// apps/api/src/lib/pagination.ts

import type { PaginationInput } from '@electrovault/schemas';

/**
 * Berechnet skip und take für Prisma
 */
export function getPrismaOffsets(pagination: PaginationInput): {
  skip: number;
  take: number;
} {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  };
}

/**
 * Erstellt Pagination-Metadaten
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Erstellt eine paginierte Antwort
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
}
```

### Route Beispiel (REAL CODE)

```typescript
// apps/api/src/routes/components/index.ts
import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { componentService } from '../../services/component.service';
import { partService } from '../../services/part.service';
import {
  ComponentListQuerySchema,
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
   */
  app.get('/', async (request, reply) => {
    const query = ComponentListQuerySchema.parse(request.query);
    const result = await componentService.list(query);
    return reply.send(result);
  });

  /**
   * GET /components/:id
   * Einzelnes Component nach ID oder Slug
   */
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;

    // UUID oder Slug?
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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
   * Component löschen (Soft-Delete, Moderator required)
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
   * GET /components/:id/parts
   * Alle ManufacturerParts eines Components
   */
  app.get<{ Params: { id: string } }>('/:id/parts', async (request, reply) => {
    const { id } = request.params;
    const parts = await partService.getByComponentId(id);
    return reply.send({ data: parts });
  });
}
```

**WICHTIG:**
- Manuelle Zod-Validierung mit `.parse()`
- Kein Fastify Type Provider
- Eine Datei = alle Routes einer Ressource
- Auth mit `app.requireRole()` oder `app.requireAuth`
- Fehler werden automatisch vom Error Handler gefangen

### Service Layer Beispiel (REAL CODE)

```typescript
// apps/api/src/services/component.service.ts
import { prisma } from '@electrovault/database';
import type {
  ComponentListQuery,
  CreateComponentInput,
  UpdateComponentInput,
  ComponentFull,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { generateSlug, generateUniqueSlug, getSlugSourceText } from '../lib/slug';
import { categoryService } from './category.service';

/**
 * Component Service (Klasse!)
 */
export class ComponentService {
  /**
   * Gibt eine paginierte Liste von Components zurück
   */
  async list(query: ComponentListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    // Wenn includeSubcategories, alle Unterkategorie-IDs ermitteln
    let categoryIds: string[] | undefined;
    if (query.categoryId) {
      if (query.includeSubcategories) {
        const descendants = await categoryService.getDescendantIds(query.categoryId);
        categoryIds = [query.categoryId, ...descendants];
      } else {
        categoryIds = [query.categoryId];
      }
    }

    const where = {
      deletedAt: null, // Soft-Delete beachten
      ...(query.status && { status: query.status }),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(query.search && {
        OR: [
          { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' as const } },
          { series: { contains: query.search, mode: 'insensitive' as const } },
          // JSON-Suche für lokalisierte Namen
          { name: { path: ['de'], string_contains: query.search } },
          { name: { path: ['en'], string_contains: query.search } },
        ],
      }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { updatedAt: 'desc' as const };

    const [components, total] = await Promise.all([
      prisma.coreComponent.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { manufacturerParts: true } },
        },
      }),
      prisma.coreComponent.count({ where }),
    ]);

    // Transform zu ComponentListItem
    const items = components.map((c) => ({
      id: c.id,
      name: c.name as LocalizedString,
      slug: c.slug,
      series: c.series,
      shortDescription: c.shortDescription as LocalizedString | null,
      status: c.status,
      category: {
        id: c.category.id,
        name: c.category.name as LocalizedString,
        slug: c.category.slug,
      },
      manufacturerPartsCount: c._count.manufacturerParts,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return createPaginatedResponse(items, query.page, query.limit, total);
  }

  /**
   * Gibt ein Component nach ID zurück
   */
  async getById(id: string): Promise<ComponentFull> {
    const component = await prisma.coreComponent.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        attributeValues: { include: { definition: true } },
        conceptRelations: { include: { target: true } },
        relatedFromConcepts: { include: { source: true } },
        _count: { select: { manufacturerParts: true } },
      },
    });

    if (!component) {
      throw new NotFoundError('Component', id);
    }

    return component as unknown as ComponentFull;
  }

  /**
   * Erstellt ein neues Component
   */
  async create(data: CreateComponentInput, userId?: string): Promise<ComponentWithCategory> {
    // Prüfen ob Kategorie existiert
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new BadRequestError(`Category '${data.categoryId}' not found`);
    }

    // Slug generieren falls nicht angegeben
    let slug = data.slug;
    if (!slug) {
      const sourceText = getSlugSourceText(data.name as Record<string, string | undefined>);
      const baseSlug = generateSlug(sourceText);
      const existingSlugs = await this.getExistingSlugs();
      slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Prüfen ob Slug bereits existiert
    const existing = await prisma.coreComponent.findUnique({ where: { slug } });
    if (existing) {
      throw new ConflictError(`Component with slug '${slug}' already exists`);
    }

    // Transaktion für Component + AttributeValues
    const component = await prisma.$transaction(async (tx) => {
      const newComponent = await tx.coreComponent.create({
        data: {
          name: data.name as object,
          slug,
          series: data.series,
          categoryId: data.categoryId,
          shortDescription: (data.shortDescription as object) || undefined,
          fullDescription: (data.fullDescription as object) || undefined,
          commonAttributes: (data.commonAttributes as object) ?? {},
          status: data.status,
          createdById: userId,
          lastEditedById: userId,
        },
        include: { category: true },
      });

      // Attributwerte erstellen falls angegeben
      if (data.attributeValues && data.attributeValues.length > 0) {
        await this.createAttributeValues(tx, newComponent.id, data.attributeValues);
      }

      return newComponent;
    });

    return component as unknown as ComponentWithCategory;
  }

  /**
   * Löscht ein Component (Soft-Delete)
   * Löscht auch alle zugehörigen ManufacturerParts kaskadierend
   */
  async delete(id: string, userId?: string): Promise<void> {
    const component = await prisma.coreComponent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('Component', id);
    }

    const now = new Date();

    // Transaktion: Component und alle Parts soft-deleten
    await prisma.$transaction(async (tx) => {
      // Alle zugehörigen ManufacturerParts soft-deleten
      await tx.manufacturerPart.updateMany({
        where: { coreComponentId: id, deletedAt: null },
        data: { deletedAt: now, deletedById: userId },
      });

      // Component soft-deleten
      await tx.coreComponent.update({
        where: { id },
        data: { deletedAt: now, deletedById: userId },
      });
    });
  }

  // ... weitere Methoden
}

// Singleton-Export
export const componentService = new ComponentService();
```

**WICHTIG:**
- Services sind Klassen, NICHT Plain Objects
- Singleton-Export am Ende
- Fehler mit Custom Error Classes werfen
- Prisma Transactions für atomare Operationen
- Soft-Delete immer beachten (`deletedAt: null`)

### Audit Service (REAL CODE)

```typescript
// apps/api/src/services/audit.service.ts
import { prisma } from '@electrovault/database';
import type {
  AuditLogQuery,
  CreateAuditLogInput,
  AuditAction,
} from '@electrovault/schemas';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';

/**
 * Audit Service - Änderungstracking
 */
export class AuditService {
  /**
   * Protokolliert eine CREATE-Aktion
   */
  async logCreate(
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'CREATE',
      entityType,
      entityId,
      changes: { created: data },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Protokolliert eine UPDATE-Aktion
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const diff = calculateDiff(oldData, newData);

    // Nur loggen wenn es tatsächlich Änderungen gibt
    if (diff.length === 0) return;

    await this.log({
      action: 'UPDATE',
      entityType,
      entityId,
      changes: { diff },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Protokolliert eine DELETE-Aktion (Soft-Delete)
   */
  async logDelete(
    entityType: string,
    entityId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'DELETE',
      entityType,
      entityId,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Gibt eine paginierte Liste von Audit-Logs zurück
   */
  async list(query: AuditLogQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where = {
      ...(query.userId && { userId: query.userId }),
      ...(query.action && { action: query.action }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.fromDate && { createdAt: { gte: query.fromDate } }),
      ...(query.toDate && { createdAt: { lte: query.toDate } }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: 'desc' as const };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResponse(logs, query.page, query.limit, total);
  }

  // ... weitere Methoden
}

export const auditService = new AuditService();
```

**Verwendung im Service:**

```typescript
// Nach Component-Erstellung
await auditService.logCreate('CoreComponent', component.id, component, userId);

// Nach Component-Update
await auditService.logUpdate('CoreComponent', id, oldData, newData, userId);

// Nach Component-Löschung
await auditService.logDelete('CoreComponent', id, userId);
```

### File Upload mit MinIO (REAL CODE)

```typescript
// apps/api/src/routes/files/index.ts

/**
 * POST /files/datasheet
 * Upload eines Datasheets (PDF)
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
      { partId, componentId, version, language, description }
    );

    return reply.code(201).send({ data: fileMetadata });
  }
);

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
```

**MinIO Client (lib/minio.ts):**

```typescript
// apps/api/src/lib/minio.ts
import * as Minio from 'minio';
import { ApiError } from './errors';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'electrovault-files';

export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

export const BUCKET_NAME = MINIO_BUCKET;

/**
 * Prüft ob der Bucket existiert, erstellt ihn falls nicht
 */
export async function ensureBucketExists(): Promise<void> {
  const exists = await minioClient.bucketExists(BUCKET_NAME);
  if (!exists) {
    await minioClient.makeBucket(BUCKET_NAME, 'eu-west-1');
  }
}

/**
 * Generiert eine Presigned URL für den Download
 */
export async function getPresignedUrl(
  bucketPath: string,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> {
  return await minioClient.presignedGetObject(BUCKET_NAME, bucketPath, expirySeconds);
}

/**
 * Lädt eine Datei in MinIO hoch
 */
export async function uploadFile(
  bucketPath: string,
  buffer: Buffer,
  metadata?: Minio.ItemBucketMetadata
): Promise<void> {
  await minioClient.putObject(BUCKET_NAME, bucketPath, buffer, buffer.length, metadata);
}
```

### Moderation Routes (REAL CODE)

```typescript
// apps/api/src/routes/moderation/index.ts

/**
 * GET /moderation/queue
 * Kombinierte Queue (Components + Parts)
 * Nur für MODERATOR und ADMIN
 */
app.get(
  '/queue',
  {
    onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
  },
  async (request, reply) => {
    const query = PaginationSchema.parse(request.query);
    const result = await moderationService.getCombinedQueue(query);
    return reply.send(result);
  }
);

/**
 * POST /moderation/component/:id/approve
 * Component freigeben
 */
app.post<{ Params: { id: string } }>(
  '/component/:id/approve',
  {
    onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
  },
  async (request, reply) => {
    const { id } = request.params;
    const userId = request.user?.dbId;

    if (!userId) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found',
        },
      });
    }

    const component = await moderationService.moderateComponent({
      componentId: id,
      action: 'APPROVE',
      moderatorId: userId,
    });

    return reply.send({ data: component });
  }
);

/**
 * POST /moderation/batch/approve
 * Mehrere Components freigeben
 */
app.post<{ Body: { componentIds: string[] } }>(
  '/batch/approve',
  {
    onRequest: app.requireRole(['MODERATOR', 'ADMIN']),
  },
  async (request, reply) => {
    const { componentIds } = request.body;
    const userId = request.user?.dbId;

    if (!userId) {
      return reply.code(401).send({
        error: { code: 'UNAUTHORIZED', message: 'User ID not found' },
      });
    }

    if (!componentIds || !Array.isArray(componentIds) || componentIds.length === 0) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'componentIds must be a non-empty array',
        },
      });
    }

    const count = await moderationService.batchApprove(componentIds, userId);

    return reply.send({
      data: {
        approved: count,
        total: componentIds.length,
      },
    });
  }
);
```

### Pin Routes (REAL CODE)

```typescript
// apps/api/src/routes/pins/index.ts

/**
 * GET /parts/:partId/pins
 * Alle Pins eines ManufacturerPart
 */
app.get<{ Params: { partId: string } }>(
  '/parts/:partId/pins',
  async (request, reply) => {
    const { partId } = request.params;
    const pins = await pinService.getPinsByPartId(partId);
    return reply.send({ data: pins });
  }
);

/**
 * POST /parts/:partId/pins
 * Neuen Pin erstellen (Auth required)
 */
app.post<{ Params: { partId: string } }>(
  '/parts/:partId/pins',
  {
    onRequest: app.requireRole('CONTRIBUTOR'),
  },
  async (request, reply) => {
    const { partId } = request.params;
    const data = CreatePinSchema.parse(request.body);
    const userId = request.user?.dbId;

    const pin = await pinService.createPin(partId, data, userId);
    return reply.code(201).send({ data: pin });
  }
);

/**
 * POST /parts/:partId/pins/bulk
 * Mehrere Pins auf einmal erstellen (Auth required)
 */
app.post<{ Params: { partId: string } }>(
  '/parts/:partId/pins/bulk',
  {
    onRequest: app.requireRole('CONTRIBUTOR'),
  },
  async (request, reply) => {
    const { partId } = request.params;
    const data = BulkCreatePinsSchema.parse(request.body);
    const userId = request.user?.dbId;

    const pins = await pinService.bulkCreatePins(partId, data, userId);
    return reply.code(201).send({ data: pins });
  }
);
```

## Auth Middleware (von @electrovault/auth)

```typescript
// Verwendet im Auth-Plugin, verfügbar als Decorators:

// Erfordert Authentifizierung
app.requireAuth

// Erfordert eine bestimmte Rolle
app.requireRole('CONTRIBUTOR')
app.requireRole(['MODERATOR', 'ADMIN'])
```

**User Object im Request:**

```typescript
request.user = {
  userId: string;      // Keycloak User ID
  dbId: string;        // Database User ID
  dbRole: UserRole;    // VIEWER | CONTRIBUTOR | MODERATOR | ADMIN
  username: string;
  email: string;
}
```

## Implementierte Features

### Core Ressourcen
- Components (CRUD, Relations, Restore)
- Parts (CRUD, kaskadierendes Delete)
- Categories (Hierarchie, Descendants)
- Manufacturers (CRUD)
- Packages (CRUD)
- Attributes (CRUD, Scope-Validierung)

### Community Features
- Moderation Queue (PENDING -> APPROVED/REJECTED)
- Batch-Moderation
- Audit Logging (CREATE/UPDATE/DELETE/RESTORE/APPROVE)
- Audit Stats & History

### Advanced Features
- File Uploads (MinIO/S3: Datasheet, Image, Pinout)
- Presigned URLs für Downloads
- Pin Mappings (CRUD, Bulk-Create, Reorder)
- Soft-Delete mit Restore
- JSON-Suche für LocalizedStrings

## Kontext-Dateien

Bei API-Aufgaben diese Dateien beachten:

```
apps/api/src/                    # Backend-Code
apps/api/src/app.ts              # App Setup
apps/api/src/server.ts           # Entry Point
apps/api/src/lib/                # Utilities
apps/api/src/routes/             # Route Handler (monolithisch!)
apps/api/src/services/           # Business Logic (Klassen!)
packages/schemas/src/            # Zod Schemas
packages/auth/src/fastify/       # Auth Middleware
docs/phases/phase-2-component-api.md   # API-Design Details
docs/phases/phase-4-community.md       # Community Features
```

## Best Practices

1. **Manuelle Zod-Validierung** - `.parse()` in Route Handler, kein Type Provider
2. **Service Layer Klassen** - Business-Logik in Klassen, Singleton-Export
3. **Custom Error Classes** - NotFoundError, ConflictError, BadRequestError
4. **Einheitliche Responses** - `{ data }` oder `{ data, pagination }`
5. **Audit Service** - Jede Mutation über `auditService.logCreate/Update/Delete`
6. **Soft-Delete** - `deletedAt: null` in Queries, Restore-Endpunkte
7. **Prisma Transactions** - Für atomare Multi-Entity-Operationen
8. **MinIO für Files** - Presigned URLs für Downloads

---

*Aktiviere diesen Agenten für REST-API Entwicklung, Services und Backend-Logik.*
