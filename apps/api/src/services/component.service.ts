/**
 * Component Service - CoreComponent-Verwaltung (CRUD)
 */

import { prisma } from '@electrovault/database';
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
import { categoryService } from './category.service';

/**
 * Component Service
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

    // Slug generieren falls nicht angegeben
    let slug = data.slug;
    if (!slug) {
      const sourceText = getSlugSourceText(data.name as Record<string, string | undefined>);
      const baseSlug = generateSlug(sourceText);
      const existingSlugs = await this.getExistingSlugs();
      slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Prüfen ob Slug bereits existiert
    const existing = await prisma.coreComponent.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictError(`Component with slug '${slug}' already exists`);
    }

    // Transaktion für Component + AttributeValues
    const component = await prisma.$transaction(async (tx) => {
      // Component erstellen
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
          shortDescription: data.shortDescription ? (data.shortDescription as object) : undefined,
          fullDescription: data.fullDescription ? (data.fullDescription as object) : undefined,
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
   */
  async delete(id: string, userId?: string): Promise<void> {
    const component = await prisma.coreComponent.findUnique({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: { manufacturerParts: { where: { deletedAt: null } } },
        },
      },
    });

    if (!component) {
      throw new NotFoundError('Component', id);
    }

    // Warnung wenn Parts vorhanden
    if (component._count.manufacturerParts > 0) {
      throw new ConflictError(
        `Component has ${component._count.manufacturerParts} active manufacturer parts. Delete or archive them first.`
      );
    }

    await prisma.coreComponent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
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
          displayValue: value.displayValue,
          normalizedValue: value.normalizedValue,
          normalizedMin: value.normalizedMin,
          normalizedMax: value.normalizedMax,
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
