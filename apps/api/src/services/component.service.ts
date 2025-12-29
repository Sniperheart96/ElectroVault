/**
 * Component Service - CoreComponent-Verwaltung (CRUD)
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  ComponentListQuery,
  CreateComponentInput,
  UpdateComponentInput,
  CreateAttributeValueInput,
  CreateConceptRelationInput,
  ComponentBase,
  ComponentWithCategory,
  ComponentFull,
  ComponentListItem,
  LocalizedString,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { generateSlug, generateUniqueSlug, getSlugSourceText } from '../lib/slug';
import { toJsonValue } from '../lib/json-helpers';
import { categoryService } from './category.service';

/**
 * Helper: Prüft ob ein LocalizedString mindestens eine Sprache mit Inhalt hat
 */
function hasLocalizedContent(value: LocalizedString | null | undefined): boolean {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).some((v) => typeof v === 'string' && v.trim().length > 0);
}

/**
 * Component Service
 */
export class ComponentService {
  /**
   * Prüft ob eine Kategorie (inkl. Elternkategorien) Label-Attribute hat
   */
  private async categoryHasLabelAttributes(categoryId: string): Promise<boolean> {
    // Alle Kategorie-IDs (inkl. Eltern) sammeln
    const categoryIds: string[] = [];
    let currentCategoryId: string | null = categoryId;

    while (currentCategoryId) {
      categoryIds.push(currentCategoryId);
      const category: { parentId: string | null } | null = await prisma.categoryTaxonomy.findUnique({
        where: { id: currentCategoryId },
        select: { parentId: true },
      });
      currentCategoryId = category?.parentId ?? null;
    }

    // Prüfen ob es Label-Attribute in diesen Kategorien gibt
    const labelAttribute = await prisma.attributeDefinition.findFirst({
      where: {
        categoryId: { in: categoryIds },
        isLabel: true,
      },
    });

    return labelAttribute !== null;
  }
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

    // Kategorie-Slug zu ID auflösen falls angegeben
    if (query.categorySlug && !query.categoryId) {
      const category = await categoryService.getBySlug(query.categorySlug);
      if (query.includeSubcategories) {
        const descendants = await categoryService.getDescendantIds(category.id);
        categoryIds = [category.id, ...descendants];
      } else {
        categoryIds = [category.id];
      }
    }

    const where = {
      deletedAt: null, // Soft-Delete beachten
      ...(query.status && { status: query.status }),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
      ...(query.createdById && { createdById: query.createdById }),
      ...(query.search && {
        OR: [
          { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' as const } },
          { series: { contains: query.search, mode: 'insensitive' as const } },
          // JSON-Suche für lokalisierte Namen
          {
            name: {
              path: ['de'],
              string_contains: query.search,
            },
          },
          {
            name: {
              path: ['en'],
              string_contains: query.search,
            },
          },
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
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          attributeValues: {
            include: {
              definition: true,
            },
            orderBy: {
              definition: { sortOrder: 'asc' },
            },
          },
          _count: {
            select: { manufacturerParts: true },
          },
        },
      }),
      prisma.coreComponent.count({ where }),
    ]);

    // Transform zu ComponentListItem
    const items: ComponentListItem[] = components.map((c) => ({
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
      attributeValues: c.attributeValues.map((av) => ({
        id: av.id,
        definitionId: av.definitionId,
        normalizedValue: av.normalizedValue ? Number(av.normalizedValue) : null,
        normalizedMin: av.normalizedMin ? Number(av.normalizedMin) : null,
        normalizedMax: av.normalizedMax ? Number(av.normalizedMax) : null,
        prefix: av.prefix,
        stringValue: av.stringValue,
        definition: {
          id: av.definition.id,
          name: av.definition.name,
          displayName: av.definition.displayName as LocalizedString,
          unit: av.definition.unit,
          dataType: av.definition.dataType,
          scope: av.definition.scope,
          isLabel: av.definition.isLabel,
        },
      })),
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
        attributeValues: {
          include: {
            definition: true,
          },
        },
        conceptRelations: {
          include: {
            target: true,
          },
        },
        relatedFromConcepts: {
          include: {
            source: true,
          },
        },
        _count: {
          select: { manufacturerParts: true },
        },
      },
    });

    if (!component) {
      throw new NotFoundError('Component', id);
    }

    return {
      ...component,
      name: component.name as LocalizedString,
      shortDescription: component.shortDescription as LocalizedString | null,
      fullDescription: component.fullDescription as LocalizedString | null,
      commonAttributes: component.commonAttributes as Record<string, unknown>,
      manufacturerPartsCount: component._count.manufacturerParts,
      category: {
        ...component.category,
        name: component.category.name as LocalizedString,
        description: component.category.description as LocalizedString | null,
      },
      attributeValues: component.attributeValues.map((av) => ({
        id: av.id,
        definitionId: av.definitionId,
        normalizedValue: av.normalizedValue ? Number(av.normalizedValue) : null,
        normalizedMin: av.normalizedMin ? Number(av.normalizedMin) : null,
        normalizedMax: av.normalizedMax ? Number(av.normalizedMax) : null,
        prefix: av.prefix,
        stringValue: av.stringValue,
        definition: {
          id: av.definition.id,
          name: av.definition.name,
          displayName: av.definition.displayName as LocalizedString,
          unit: av.definition.unit,
          dataType: av.definition.dataType,
          scope: av.definition.scope,
        },
      })),
    } as unknown as ComponentFull;
  }

  /**
   * Gibt ein Component nach Slug zurück
   */
  async getBySlug(slug: string): Promise<ComponentFull> {
    const component = await prisma.coreComponent.findUnique({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        attributeValues: {
          include: {
            definition: true,
          },
          orderBy: {
            definition: { sortOrder: 'asc' },
          },
        },
        conceptRelations: {
          include: {
            target: true,
          },
        },
        relatedFromConcepts: {
          include: {
            source: true,
          },
        },
        _count: {
          select: { manufacturerParts: true },
        },
      },
    });

    if (!component) {
      throw new NotFoundError('Component', slug);
    }

    return {
      ...component,
      name: component.name as LocalizedString,
      shortDescription: component.shortDescription as LocalizedString | null,
      fullDescription: component.fullDescription as LocalizedString | null,
      commonAttributes: component.commonAttributes as Record<string, unknown>,
      manufacturerPartsCount: component._count.manufacturerParts,
      attributeValues: component.attributeValues.map((av) => ({
        id: av.id,
        definitionId: av.definitionId,
        normalizedValue: av.normalizedValue ? Number(av.normalizedValue) : null,
        normalizedMin: av.normalizedMin ? Number(av.normalizedMin) : null,
        normalizedMax: av.normalizedMax ? Number(av.normalizedMax) : null,
        prefix: av.prefix,
        stringValue: av.stringValue,
        definition: {
          id: av.definition.id,
          name: av.definition.name,
          displayName: av.definition.displayName as LocalizedString,
          unit: av.definition.unit,
          dataType: av.definition.dataType,
          scope: av.definition.scope,
        },
      })),
    } as unknown as ComponentFull;
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

    // Validierung: name ist Pflicht wenn keine Label-Attribute in der Kategorie
    const hasLabelAttrs = await this.categoryHasLabelAttributes(data.categoryId);
    if (!hasLabelAttrs && !hasLocalizedContent(data.name as LocalizedString)) {
      throw new BadRequestError(
        'Name is required with at least one language when category has no label attributes'
      );
    }

    // Slug generieren falls nicht angegeben
    let slug = data.slug;
    if (!slug) {
      // Wenn name vorhanden, daraus generieren, sonst aus series oder Fallback
      const nameValue = data.name as Record<string, string | undefined> | undefined;
      const sourceText = hasLocalizedContent(nameValue as LocalizedString)
        ? getSlugSourceText(nameValue ?? {})
        : data.series || 'component';
      const baseSlug = generateSlug(sourceText);
      const existingSlugs = await this.getExistingSlugs();
      slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Transaktion für Component + AttributeValues
    // Race Condition Fix: Prisma P2002 Error fangen statt Check-Then-Act
    try {
      const component = await prisma.$transaction(async (tx) => {
        // Component erstellen
        // name kann leer sein wenn Label-Attribute vorhanden (wird dann aus Attributen generiert)
        const newComponent = await tx.coreComponent.create({
          data: {
            name: (data.name as object) ?? {}, // Leeres Objekt falls nicht angegeben
            slug,
            series: data.series,
            categoryId: data.categoryId,
            shortDescription: toJsonValue(data.shortDescription),
            fullDescription: toJsonValue(data.fullDescription),
            commonAttributes: (data.commonAttributes as object) ?? {},
            status: data.status,
            createdById: userId,
            lastEditedById: userId,
          },
          include: {
            category: true,
          },
        });

        // Attributwerte erstellen falls angegeben
        if (data.attributeValues && data.attributeValues.length > 0) {
          await this.createAttributeValues(tx, newComponent.id, data.attributeValues);
        }

        return newComponent;
      });

      return component as unknown as ComponentWithCategory;
    } catch (error) {
      // Race Condition: Unique Constraint Violation für Slug
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(`Component with slug '${slug}' already exists`);
      }
      throw error;
    }
  }

  /**
   * Aktualisiert ein Component
   */
  async update(
    id: string,
    data: UpdateComponentInput,
    userId?: string
  ): Promise<ComponentWithCategory> {
    // Prüfen ob Component existiert
    const existing = await prisma.coreComponent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Component', id);
    }

    // Validierung: Wenn name explizit auf leer gesetzt wird, muss Kategorie Label-Attribute haben
    if (data.name !== undefined && !hasLocalizedContent(data.name as LocalizedString)) {
      const hasLabelAttrs = await this.categoryHasLabelAttributes(existing.categoryId);
      if (!hasLabelAttrs) {
        throw new BadRequestError(
          'Name is required with at least one language when category has no label attributes'
        );
      }
    }

    // Slug-Konflikt prüfen falls geändert
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.coreComponent.findUnique({
        where: { slug: data.slug },
      });

      if (slugConflict) {
        throw new ConflictError(`Component with slug '${data.slug}' already exists`);
      }
    }

    // Transaktion für Update + AttributeValues
    const component = await prisma.$transaction(async (tx) => {
      // Attributwerte aktualisieren falls angegeben
      if (data.attributeValues !== undefined) {
        // Alle alten Attributwerte löschen
        await tx.componentAttributeValue.deleteMany({
          where: { componentId: id },
        });

        // Neue Attributwerte erstellen
        if (data.attributeValues && data.attributeValues.length > 0) {
          await this.createAttributeValues(tx, id, data.attributeValues);
        }
      }

      // Component aktualisieren
      return tx.coreComponent.update({
        where: { id },
        data: {
          name: data.name ? (data.name as object) : undefined,
          slug: data.slug,
          series: data.series,
          shortDescription: toJsonValue(data.shortDescription),
          fullDescription: toJsonValue(data.fullDescription),
          commonAttributes: data.commonAttributes ? (data.commonAttributes as object) : undefined,
          status: data.status,
          lastEditedById: userId,
        },
        include: {
          category: true,
        },
      });
    });

    return component as unknown as ComponentWithCategory;
  }

  /**
   * Löscht ein Component (Soft-Delete)
   * Löscht auch alle zugehörigen ManufacturerParts (kaskadierend)
   */
  async delete(id: string, userId?: string): Promise<void> {
    const component = await prisma.coreComponent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('Component', id);
    }

    const now = new Date();

    // Transaktion: Component und alle zugehörigen Parts soft-deleten
    await prisma.$transaction(async (tx) => {
      // Alle zugehörigen ManufacturerParts soft-deleten
      await tx.manufacturerPart.updateMany({
        where: {
          coreComponentId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      });

      // Component soft-deleten
      await tx.coreComponent.update({
        where: { id },
        data: {
          deletedAt: now,
          deletedById: userId,
        },
      });
    });
  }

  /**
   * Stellt ein gelöschtes Component wieder her
   */
  async restore(id: string, userId?: string): Promise<ComponentWithCategory> {
    const component = await prisma.coreComponent.findUnique({
      where: { id },
    });

    if (!component) {
      throw new NotFoundError('Component', id);
    }

    if (!component.deletedAt) {
      throw new BadRequestError('Component is not deleted');
    }

    const restored = await prisma.coreComponent.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedById: null,
        lastEditedById: userId,
      },
      include: {
        category: true,
      },
    });

    return restored as unknown as ComponentWithCategory;
  }

  /**
   * Fügt eine Konzept-Beziehung hinzu
   */
  async addConceptRelation(
    componentId: string,
    data: CreateConceptRelationInput,
    userId?: string
  ): Promise<void> {
    // Prüfen ob beide Components existieren
    const [source, target] = await Promise.all([
      prisma.coreComponent.findUnique({ where: { id: componentId, deletedAt: null } }),
      prisma.coreComponent.findUnique({ where: { id: data.targetId, deletedAt: null } }),
    ]);

    if (!source) {
      throw new NotFoundError('Component', componentId);
    }

    if (!target) {
      throw new NotFoundError('Component', data.targetId);
    }

    // Prüfen ob Beziehung bereits existiert
    const existing = await prisma.componentConceptRelation.findFirst({
      where: {
        sourceId: componentId,
        targetId: data.targetId,
        relationType: data.relationType,
      },
    });

    if (existing) {
      throw new ConflictError('This concept relation already exists');
    }

    await prisma.componentConceptRelation.create({
      data: {
        sourceId: componentId,
        targetId: data.targetId,
        relationType: data.relationType,
        notes: data.notes,
        createdById: userId,
      },
    });
  }

  /**
   * Gibt alle Konzept-Beziehungen eines Components zurück
   */
  async getConceptRelations(componentId: string) {
    // Prüfen ob Component existiert
    const component = await prisma.coreComponent.findUnique({
      where: { id: componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('Component', componentId);
    }

    // Beide Richtungen laden
    const [outgoing, incoming] = await Promise.all([
      prisma.componentConceptRelation.findMany({
        where: { sourceId: componentId },
        include: {
          target: {
            select: {
              id: true,
              name: true,
              slug: true,
              series: true,
              shortDescription: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.componentConceptRelation.findMany({
        where: { targetId: componentId },
        include: {
          source: {
            select: {
              id: true,
              name: true,
              slug: true,
              series: true,
              shortDescription: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      outgoing: outgoing.map((r) => ({
        ...r,
        target: {
          ...r.target,
          name: r.target.name as LocalizedString,
          shortDescription: r.target.shortDescription as LocalizedString | null,
        },
        notes: r.notes as LocalizedString | null,
      })),
      incoming: incoming.map((r) => ({
        ...r,
        source: {
          ...r.source,
          name: r.source.name as LocalizedString,
          shortDescription: r.source.shortDescription as LocalizedString | null,
        },
        notes: r.notes as LocalizedString | null,
      })),
    };
  }

  /**
   * Aktualisiert eine Konzept-Beziehung
   */
  async updateConceptRelation(
    componentId: string,
    relationId: string,
    data: { notes?: LocalizedString },
    userId?: string
  ): Promise<void> {
    const relation = await prisma.componentConceptRelation.findFirst({
      where: {
        id: relationId,
        sourceId: componentId,
      },
    });

    if (!relation) {
      throw new NotFoundError('ConceptRelation', relationId);
    }

    await prisma.componentConceptRelation.update({
      where: { id: relationId },
      data: {
        notes: data.notes ? (data.notes as object) : undefined,
      },
    });
  }

  /**
   * Entfernt eine Konzept-Beziehung
   */
  async removeConceptRelation(componentId: string, relationId: string): Promise<void> {
    const relation = await prisma.componentConceptRelation.findFirst({
      where: {
        id: relationId,
        sourceId: componentId,
      },
    });

    if (!relation) {
      throw new NotFoundError('ConceptRelation', relationId);
    }

    await prisma.componentConceptRelation.delete({
      where: { id: relationId },
    });
  }

  /**
   * Hilfsmethode: Attributwerte erstellen
   */
  private async createAttributeValues(
    tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
    componentId: string,
    values: CreateAttributeValueInput[]
  ): Promise<void> {
    for (const value of values) {
      // Prüfen ob Definition existiert und Scope passt
      const definition = await tx.attributeDefinition.findUnique({
        where: { id: value.definitionId },
      });

      if (!definition) {
        throw new BadRequestError(`Attribute definition '${value.definitionId}' not found`);
      }

      if (definition.scope === 'PART') {
        throw new BadRequestError(
          `Attribute '${definition.name}' is PART-scoped and cannot be assigned to a component`
        );
      }

      await tx.componentAttributeValue.create({
        data: {
          componentId,
          definitionId: value.definitionId,
          normalizedValue: value.normalizedValue,
          normalizedMin: value.normalizedMin,
          normalizedMax: value.normalizedMax,
          prefix: value.prefix,
          stringValue: value.stringValue,
        },
      });
    }
  }

  /**
   * Hilfsmethode: Alle existierenden Slugs abrufen
   */
  private async getExistingSlugs(): Promise<string[]> {
    const components = await prisma.coreComponent.findMany({
      select: { slug: true },
    });
    return components.map((c) => c.slug);
  }
}

// Singleton-Export
export const componentService = new ComponentService();
