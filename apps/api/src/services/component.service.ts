/**
 * Component Service - CoreComponent-Verwaltung (CRUD)
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  ComponentListQuery,
  ComponentSearchQuery,
  CreateComponentInput,
  UpdateComponentInput,
  CreateAttributeValueInput,
  CreateConceptRelationInput,
  ComponentBase,
  ComponentWithCategory,
  ComponentFull,
  ComponentListItem,
  LocalizedString,
  AttributeFilter,
  MultiSelectMode,
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

    // Status-Filter bauen:
    // - Wenn expliziter Status gesetzt: nur diesen Status zeigen
    // - Wenn includeDrafts=true und userId gesetzt: eigene Entwuerfe + nicht-Entwuerfe zeigen
    // - Sonst: keine Entwuerfe zeigen (Standard)
    let statusCondition: object | undefined;
    if (query.status) {
      // Expliziter Status-Filter
      statusCondition = { status: query.status };
    } else if (query.includeDrafts && query.userId) {
      // Zeige: alle nicht-DRAFT Komponenten ODER eigene DRAFTs
      statusCondition = {
        OR: [
          { status: { not: 'DRAFT' } },
          { status: 'DRAFT', createdById: query.userId },
        ],
      };
    } else {
      // Standard: keine Entwuerfe anzeigen
      statusCondition = { status: { not: 'DRAFT' } };
    }

    const where = {
      deletedAt: null, // Soft-Delete beachten
      ...statusCondition,
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
        package: true,
        pinMappings: {
          orderBy: { pinNumber: 'asc' },
        },
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
      package: component.package ? {
        ...component.package,
        description: component.package.description as LocalizedString | null,
      } : null,
      pinMappings: component.pinMappings.map((pin) => ({
        id: pin.id,
        pinNumber: pin.pinNumber,
        pinName: pin.pinName,
        pinFunction: pin.pinFunction as LocalizedString | null,
        pinType: pin.pinType,
        maxVoltage: pin.maxVoltage ? Number(pin.maxVoltage) : null,
        maxCurrent: pin.maxCurrent ? Number(pin.maxCurrent) : null,
      })),
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
        package: true,
        pinMappings: {
          orderBy: { pinNumber: 'asc' },
        },
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
      category: {
        ...component.category,
        name: component.category.name as LocalizedString,
        description: component.category.description as LocalizedString | null,
      },
      package: component.package ? {
        ...component.package,
        description: component.package.description as LocalizedString | null,
      } : null,
      pinMappings: component.pinMappings.map((pin) => ({
        id: pin.id,
        pinNumber: pin.pinNumber,
        pinName: pin.pinName,
        pinFunction: pin.pinFunction as LocalizedString | null,
        pinType: pin.pinType,
        maxVoltage: pin.maxVoltage ? Number(pin.maxVoltage) : null,
        maxCurrent: pin.maxCurrent ? Number(pin.maxCurrent) : null,
      })),
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
   *
   * Status-Logik:
   * - saveAsDraft=true -> Status = DRAFT (Entwurf, nur fuer Ersteller sichtbar)
   * - saveAsDraft=false -> Status = PENDING (zur Moderation eingereicht)
   */
  async create(data: CreateComponentInput, userId?: string): Promise<ComponentWithCategory> {
    // Prüfen ob Kategorie existiert
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new BadRequestError(`Category '${data.categoryId}' not found`);
    }

    // Prüfen ob Package existiert falls angegeben
    if (data.packageId) {
      const pkg = await prisma.packageMaster.findUnique({
        where: { id: data.packageId },
      });

      if (!pkg) {
        throw new BadRequestError(`Package '${data.packageId}' not found`);
      }
    }

    // Status wird automatisch gesetzt basierend auf saveAsDraft
    const status = data.saveAsDraft ? 'DRAFT' : 'PENDING';

    // Validierung: name ist Pflicht wenn keine Label-Attribute in der Kategorie
    // Bei Entwuerfen (DRAFT) ist Name nicht zwingend erforderlich
    const hasLabelAttrs = await this.categoryHasLabelAttributes(data.categoryId);
    if (!data.saveAsDraft && !hasLabelAttrs && !hasLocalizedContent(data.name as LocalizedString)) {
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
            packageId: data.packageId,
            shortDescription: toJsonValue(data.shortDescription),
            fullDescription: toJsonValue(data.fullDescription),
            commonAttributes: (data.commonAttributes as object) ?? {},
            status, // Automatisch gesetzt: DRAFT oder PENDING
            createdById: userId,
            lastEditedById: userId,
          },
          include: {
            category: true,
            package: true,
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
   *
   * Status-Logik:
   * - saveAsDraft=true -> Status = DRAFT
   * - saveAsDraft=false -> Status = PENDING (nur wenn aktuell DRAFT)
   * - Status aendert sich nicht bei bereits PENDING/PUBLISHED/ARCHIVED
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

    // Status-Logik: Nur DRAFT -> PENDING oder zurueck ist erlaubt
    let newStatus: string | undefined;
    if (data.saveAsDraft !== undefined) {
      if (data.saveAsDraft) {
        // Als Entwurf speichern -> immer DRAFT
        newStatus = 'DRAFT';
      } else if (existing.status === 'DRAFT') {
        // Regulaer speichern und aktuell DRAFT -> PENDING
        newStatus = 'PENDING';
      }
      // Bei PENDING/PUBLISHED/ARCHIVED bleibt der Status unveraendert
    }

    // Validierung: Wenn name explizit auf leer gesetzt wird, muss Kategorie Label-Attribute haben
    // Bei Entwuerfen ist Name nicht zwingend
    const isOrWillBeDraft = newStatus === 'DRAFT' || (newStatus === undefined && existing.status === 'DRAFT');
    if (!isOrWillBeDraft && data.name !== undefined && !hasLocalizedContent(data.name as LocalizedString)) {
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

    // Prüfen ob Package existiert falls angegeben
    if (data.packageId) {
      const pkg = await prisma.packageMaster.findUnique({
        where: { id: data.packageId },
      });

      if (!pkg) {
        throw new BadRequestError(`Package '${data.packageId}' not found`);
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
          packageId: data.packageId,
          shortDescription: toJsonValue(data.shortDescription),
          fullDescription: toJsonValue(data.fullDescription),
          commonAttributes: data.commonAttributes ? (data.commonAttributes as object) : undefined,
          status: newStatus, // Automatisch gesetzt basierend auf saveAsDraft
          lastEditedById: userId,
        },
        include: {
          category: true,
          package: true,
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

  // ============================================
  // USER DASHBOARD METHODS
  // ============================================

  /**
   * Gibt Statistiken fuer einen User zurueck
   */
  async getUserStats(userId: string) {
    const [
      totalComponents,
      draftComponents,
      pendingComponents,
      publishedComponents,
      archivedComponents,
      totalParts,
    ] = await Promise.all([
      prisma.coreComponent.count({
        where: { createdById: userId, deletedAt: null },
      }),
      prisma.coreComponent.count({
        where: { createdById: userId, status: 'DRAFT', deletedAt: null },
      }),
      prisma.coreComponent.count({
        where: { createdById: userId, status: 'PENDING', deletedAt: null },
      }),
      prisma.coreComponent.count({
        where: { createdById: userId, status: 'PUBLISHED', deletedAt: null },
      }),
      prisma.coreComponent.count({
        where: { createdById: userId, status: 'ARCHIVED', deletedAt: null },
      }),
      prisma.manufacturerPart.count({
        where: { createdById: userId, deletedAt: null },
      }),
    ]);

    return {
      components: {
        total: totalComponents,
        draft: draftComponents,
        pending: pendingComponents,
        published: publishedComponents,
        archived: archivedComponents,
      },
      parts: totalParts,
    };
  }

  /**
   * Gibt Components eines Users zurueck (gefiltert nach Status)
   */
  async getUserComponents(userId: string, query: { status?: string; limit?: number }) {
    const components = await prisma.coreComponent.findMany({
      where: {
        createdById: userId,
        deletedAt: null,
        ...(query.status && { status: query.status }),
      },
      take: query.limit || 20,
      orderBy: { updatedAt: 'desc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { manufacturerParts: true },
        },
      },
    });

    return components.map((c) => ({
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
  }

  /**
   * Gibt Entwuerfe (DRAFT) eines Users zurueck
   */
  async getUserDrafts(userId: string, limit = 10) {
    return this.getUserComponents(userId, { status: 'DRAFT', limit });
  }

  // ============================================
  // ATTRIBUTE-BASIERTE FILTERUNG
  // ============================================

  /**
   * Baut Prisma-Filterbedingungen für ein AttributeFilter
   * Wird für beide Tabellen verwendet (ComponentAttributeValue und PartAttributeValue)
   */
  private buildAttributeValueCondition(
    filter: AttributeFilter
  ): Record<string, unknown> | null {
    console.log('[FilterDebug] Building condition for filter:', JSON.stringify(filter, null, 2));

    const baseCondition = { definitionId: filter.definitionId };

    // Null-Checks für numerische Operatoren
    const numericOperators = ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'withinRange'];
    if (numericOperators.includes(filter.operator)) {
      if (filter.value === undefined || filter.value === null) {
        console.error('[ComponentService] Numeric filter missing value', { filter });
        return null;
      }
      if (filter.operator === 'between' && (filter.valueTo === undefined || filter.valueTo === null)) {
        console.error('[ComponentService] "between" filter missing valueTo', { filter });
        return null;
      }
    }

    switch (filter.operator) {
      // Numerische Operatoren
      case 'eq':
        return {
          ...baseCondition,
          normalizedValue: { equals: filter.value as number },
        };
      case 'ne':
        return {
          ...baseCondition,
          normalizedValue: { not: filter.value as number },
        };
      case 'gt':
        return {
          ...baseCondition,
          normalizedValue: { gt: filter.value as number },
        };
      case 'gte':
        return {
          ...baseCondition,
          normalizedValue: { gte: filter.value as number },
        };
      case 'lt':
        return {
          ...baseCondition,
          normalizedValue: { lt: filter.value as number },
        };
      case 'lte':
        return {
          ...baseCondition,
          normalizedValue: { lte: filter.value as number },
        };
      case 'between':
        if (filter.valueTo === undefined) return null;
        return {
          ...baseCondition,
          normalizedValue: {
            gte: filter.value as number,
            lte: filter.valueTo as number,
          },
        };

      // String-Operator
      case 'contains':
        return {
          ...baseCondition,
          stringValue: {
            contains: filter.value as string,
            mode: 'insensitive',
          },
        };

      // Boolean-Operatoren (normalizedValue: 1 = true, 0 = false)
      case 'isTrue':
        return {
          ...baseCondition,
          normalizedValue: { equals: 1 },
        };
      case 'isFalse':
        return {
          ...baseCondition,
          normalizedValue: { equals: 0 },
        };

      // Range-Operator: Benutzer-Wert muss im gespeicherten Bereich liegen
      case 'withinRange':
        return {
          ...baseCondition,
          normalizedMin: { lte: filter.value as number },
          normalizedMax: { gte: filter.value as number },
        };

      // SELECT-Operatoren: stringValue enthält genau einen der Werte
      case 'in': {
        if (!Array.isArray(filter.value)) {
          console.error('[ComponentService] "in" operator requires array', { filter });
          return null;
        }
        return {
          ...baseCondition,
          stringValue: { in: filter.value },
        };
      }
      case 'notIn': {
        if (!Array.isArray(filter.value)) {
          console.error('[ComponentService] "notIn" operator requires array', { filter });
          return null;
        }
        return {
          ...baseCondition,
          stringValue: { notIn: filter.value },
        };
      }

      // MULTISELECT-Operatoren: stringValue ist kommasepariert (z.B. "NPN,PNP,BJT")
      // hasAny: mindestens einer der Werte muss enthalten sein
      case 'hasAny': {
        const values = filter.value as string[];
        if (!Array.isArray(values) || values.length === 0) {
          console.error('[ComponentService] "hasAny" requires non-empty array', { filter });
          return null;
        }
        // Exakter Match: Wert allein, am Anfang, am Ende oder zwischen Kommas
        return {
          ...baseCondition,
          OR: values.map((v) => ({
            OR: [
              { stringValue: { equals: v } },              // Exakt (nur dieser Wert)
              { stringValue: { startsWith: `${v},` } },    // Am Anfang: "NPN,..."
              { stringValue: { endsWith: `,${v}` } },      // Am Ende: "...,NPN"
              { stringValue: { contains: `,${v},` } },     // In der Mitte: "...,NPN,..."
            ],
          })),
        };
      }

      // hasAll: alle Werte müssen enthalten sein
      case 'hasAll': {
        const values = filter.value as string[];
        if (!Array.isArray(values) || values.length === 0) {
          console.error('[ComponentService] "hasAll" requires non-empty array', { filter });
          return null;
        }
        // Jeder Wert muss exakt vorhanden sein (nicht als Teilstring)
        return {
          ...baseCondition,
          AND: values.map((v) => ({
            OR: [
              { stringValue: { equals: v } },
              { stringValue: { startsWith: `${v},` } },
              { stringValue: { endsWith: `,${v}` } },
              { stringValue: { contains: `,${v},` } },
            ],
          })),
        };
      }

      default:
        console.log('[FilterDebug] Unknown operator:', filter.operator);
        return null;
    }
  }

  /**
   * Gruppiert Filter nach Scope der AttributeDefinition
   */
  private async groupFiltersByScope(filters: AttributeFilter[]): Promise<{
    componentFilters: AttributeFilter[];
    partFilters: AttributeFilter[];
    bothFilters: AttributeFilter[];
  }> {
    // Alle Definition-IDs sammeln
    const definitionIds = filters.map(f => f.definitionId);

    // Scope für jede Definition laden
    const definitions = await prisma.attributeDefinition.findMany({
      where: { id: { in: definitionIds } },
      select: { id: true, scope: true, name: true },
    });

    const scopeMap = new Map(definitions.map(d => [d.id, d.scope]));

    console.log('[FilterDebug] Definition scopes:', definitions.map(d => ({
      id: d.id,
      name: d.name,
      scope: d.scope,
    })));

    const componentFilters: AttributeFilter[] = [];
    const partFilters: AttributeFilter[] = [];
    const bothFilters: AttributeFilter[] = [];

    for (const filter of filters) {
      const scope = scopeMap.get(filter.definitionId);
      switch (scope) {
        case 'COMPONENT':
          componentFilters.push(filter);
          break;
        case 'PART':
          partFilters.push(filter);
          break;
        case 'BOTH':
          bothFilters.push(filter);
          break;
        default:
          // Unbekannter Scope - als PART behandeln (sicherer Default)
          console.warn('[FilterDebug] Unknown scope for definition', filter.definitionId);
          partFilters.push(filter);
      }
    }

    console.log('[FilterDebug] Grouped filters:', {
      componentFilters: componentFilters.length,
      partFilters: partFilters.length,
      bothFilters: bothFilters.length,
    });

    return { componentFilters, partFilters, bothFilters };
  }

  /**
   * 2-Ebenen-Filterlogik:
   *
   * 1. COMPONENT-Scope: Filtert auf CoreComponent.attributeValues
   * 2. PART-Scope: Filtert auf ManufacturerPart.attributeValues
   * 3. BOTH-Scope: Part-Wert überschreibt Component-Wert
   *    - Wenn Part den Wert hat → Part-Wert wird geprüft
   *    - Wenn Part den Wert NICHT hat → Component-Wert wird geprüft
   *
   * Ein Component wird angezeigt wenn:
   * - Alle COMPONENT-Filter erfüllt sind UND
   * - Mindestens 1 Part alle PART-Filter UND alle BOTH-Filter erfüllt
   *   (wobei BOTH vom Part oder Component kommen kann)
   */
  private async findMatchingComponents(
    filters: AttributeFilter[],
    categoryIds?: string[]
  ): Promise<string[]> {
    console.log('[FilterDebug] findMatchingComponents called with:', {
      filterCount: filters.length,
      filters: filters.map(f => ({ definitionId: f.definitionId, operator: f.operator, value: f.value })),
      categoryIds,
    });

    if (filters.length === 0) {
      return [];
    }

    // Filter nach Scope gruppieren
    const { componentFilters, partFilters, bothFilters } = await this.groupFiltersByScope(filters);

    // Phase 1: Component-Filter anwenden (COMPONENT scope)
    let componentCandidates: string[] | null = null;

    if (componentFilters.length > 0) {
      const componentConditions = componentFilters
        .map(f => this.buildAttributeValueCondition(f))
        .filter((c): c is Record<string, unknown> => c !== null);

      if (componentConditions.length > 0) {
        const matchingComponents = await prisma.coreComponent.findMany({
          where: {
            deletedAt: null,
            ...(categoryIds && { categoryId: { in: categoryIds } }),
            AND: componentConditions.map(condition => ({
              attributeValues: {
                some: condition as Prisma.ComponentAttributeValueWhereInput,
              },
            })),
          },
          select: { id: true },
        });
        componentCandidates = matchingComponents.map(c => c.id);

        console.log('[FilterDebug] Phase 1 - Component filter results:', componentCandidates.length);

        if (componentCandidates.length === 0) {
          return []; // Keine Components erfüllen die Component-Filter
        }
      }
    }

    // Phase 2: Part-Filter + Both-Filter anwenden
    if (partFilters.length === 0 && bothFilters.length === 0) {
      // Nur Component-Filter vorhanden
      if (componentCandidates) {
        return componentCandidates;
      }
      // Keine Filter überhaupt - sollte nicht passieren, aber sicherheitshalber
      return [];
    }

    // Part-Filter Bedingungen bauen
    const partConditions = partFilters
      .map(f => this.buildAttributeValueCondition(f))
      .filter((c): c is Record<string, unknown> => c !== null);

    // BOTH-Filter: Komplex - entweder Part hat Wert, oder Component hat Wert
    // Für jeden BOTH-Filter erstellen wir eine OR-Bedingung
    const bothConditionsForPart = bothFilters
      .map(f => this.buildAttributeValueCondition(f))
      .filter((c): c is Record<string, unknown> => c !== null);

    // Parts finden die ALLE Part-Filter UND ALLE Both-Filter erfüllen
    // Bei BOTH: Part muss den Wert haben ODER Component muss ihn haben (Fallback)
    const partWhereClause: Prisma.ManufacturerPartWhereInput = {
      deletedAt: null,
      coreComponent: {
        deletedAt: null,
        ...(categoryIds && { categoryId: { in: categoryIds } }),
        ...(componentCandidates && { id: { in: componentCandidates } }),
      },
    };

    // Part-Filter: Part muss alle erfüllen
    if (partConditions.length > 0) {
      partWhereClause.AND = partConditions.map(condition => ({
        attributeValues: {
          some: condition as Prisma.PartAttributeValueWhereInput,
        },
      }));
    }

    // BOTH-Filter: Komplexe Logik mit Vererbung
    // Für jeden BOTH-Filter: Part hat Wert ODER (Part hat keinen Wert UND Component hat Wert)
    if (bothConditionsForPart.length > 0) {
      const bothAndConditions = bothFilters.map((filter, index) => {
        const condition = bothConditionsForPart[index];
        if (!condition) return null;

        // Part hat den Wert direkt
        // ODER: Component hat den Wert (Fallback wenn Part nicht)
        return {
          OR: [
            // Option 1: Part hat den Attributwert
            {
              attributeValues: {
                some: condition as Prisma.PartAttributeValueWhereInput,
              },
            },
            // Option 2: Part hat KEINEN Wert für dieses Attribut,
            // aber Component hat passenden Wert
            {
              AND: [
                {
                  attributeValues: {
                    none: { definitionId: filter.definitionId },
                  },
                },
                {
                  coreComponent: {
                    attributeValues: {
                      some: condition as Prisma.ComponentAttributeValueWhereInput,
                    },
                  },
                },
              ],
            },
          ],
        };
      }).filter((c): c is NonNullable<typeof c> => c !== null);

      if (bothAndConditions.length > 0) {
        partWhereClause.AND = [
          ...(partWhereClause.AND || []),
          ...bothAndConditions,
        ];
      }
    }

    console.log('[FilterDebug] Phase 2 - Part WHERE clause:', JSON.stringify(partWhereClause, null, 2));

    // Parts finden und Component-IDs extrahieren
    const matchingParts = await prisma.manufacturerPart.findMany({
      where: partWhereClause,
      select: { coreComponentId: true },
      distinct: ['coreComponentId'],
    });

    const resultIds = matchingParts.map(p => p.coreComponentId);

    console.log('[FilterDebug] Phase 2 - Matching parts count:', matchingParts.length);
    console.log('[FilterDebug] Final result component IDs:', resultIds);

    return resultIds;
  }

  /**
   * Erweiterte Suche mit Attribut-Filtern
   * Filtert auf ManufacturerPart-Ebene, gibt aber CoreComponents zurück
   */
  async searchWithFilters(query: ComponentSearchQuery) {
    console.log('[FilterDebug] searchWithFilters called with query:', {
      attributeFilters: query.attributeFilters,
      categoryId: query.categoryId,
      categorySlug: query.categorySlug,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });

    // Wenn keine Attribut-Filter, normale list() verwenden
    if (!query.attributeFilters || query.attributeFilters.length === 0) {
      console.log('[FilterDebug] No attribute filters - using normal list()');
      return this.list(query);
    }

    const { skip, take } = getPrismaOffsets(query);

    // Kategorie-IDs ermitteln (wie in list())
    let categoryIds: string[] | undefined;
    if (query.categoryId) {
      if (query.includeSubcategories) {
        const descendants = await categoryService.getDescendantIds(query.categoryId);
        categoryIds = [query.categoryId, ...descendants];
      } else {
        categoryIds = [query.categoryId];
      }
    }

    if (query.categorySlug && !query.categoryId) {
      const category = await categoryService.getBySlug(query.categorySlug);
      if (query.includeSubcategories) {
        const descendants = await categoryService.getDescendantIds(category.id);
        categoryIds = [category.id, ...descendants];
      } else {
        categoryIds = [category.id];
      }
    }

    // Finde Components mit 2-Ebenen-Filterlogik (Component + Part + BOTH mit Vererbung)
    const matchingComponentIds = await this.findMatchingComponents(
      query.attributeFilters,
      categoryIds
    );

    if (matchingComponentIds.length === 0) {
      return createPaginatedResponse([], query.page, query.limit, 0);
    }

    // Status-Filter bauen (wie in list())
    let statusCondition: object | undefined;
    if (query.status) {
      statusCondition = { status: query.status };
    } else if (query.includeDrafts && query.userId) {
      statusCondition = {
        OR: [
          { status: { not: 'DRAFT' } },
          { status: 'DRAFT', createdById: query.userId },
        ],
      };
    } else {
      statusCondition = { status: { not: 'DRAFT' } };
    }

    const where = {
      id: { in: matchingComponentIds },
      deletedAt: null,
      ...statusCondition,
      ...(query.search && {
        OR: [
          { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' as const } },
          { series: { contains: query.search, mode: 'insensitive' as const } },
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

    // Transform zu ComponentListItem (wie in list())
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
}

// Singleton-Export
export const componentService = new ComponentService();
