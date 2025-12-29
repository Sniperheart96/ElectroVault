/**
 * Attribute Service - Verwaltung von AttributeDefinition
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  AttributeListQuery,
  AttributeDefinition,
  AttributeWithCategory,
  CreateAttributeDefinitionInput,
  UpdateAttributeDefinitionInput,
  CategoryAttributesQuery,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { auditService } from './audit.service';

/**
 * Attribute Service
 */
export class AttributeService {
  /**
   * Gibt eine paginierte Liste von Attribut-Definitionen zurück
   */
  async list(query: AttributeListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where: Prisma.AttributeDefinitionWhereInput = {
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.scope && { scope: query.scope }),
      ...(query.dataType && { dataType: query.dataType }),
      ...(query.isFilterable !== undefined && { isFilterable: query.isFilterable }),
      ...(query.search && {
        OR: [
          {
            name: { contains: query.search.toLowerCase(), mode: 'insensitive' },
          },
          // JSON-Suche für lokalisierte Display-Namen
          {
            displayName: {
              path: ['de'],
              string_contains: query.search,
            },
          },
          {
            displayName: {
              path: ['en'],
              string_contains: query.search,
            },
          },
        ],
      }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { sortOrder: 'asc' as const };

    const [attributes, total] = await Promise.all([
      prisma.attributeDefinition.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.attributeDefinition.count({ where }),
    ]);

    return createPaginatedResponse(
      attributes as AttributeDefinition[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt eine Attribut-Definition nach ID zurück
   */
  async getById(id: string): Promise<AttributeWithCategory> {
    const attribute = await prisma.attributeDefinition.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            level: true,
          },
        },
      },
    });

    if (!attribute) {
      throw new NotFoundError('AttributeDefinition', id);
    }

    return attribute as unknown as AttributeWithCategory;
  }

  /**
   * Gibt alle Attribute einer Kategorie zurück (inkl. vererbter)
   */
  async getByCategory(
    categoryId: string,
    query: CategoryAttributesQuery = { includeInherited: true }
  ): Promise<AttributeDefinition[]> {
    // Prüfe ob Kategorie existiert
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { id: categoryId },
      select: { id: true, parentId: true },
    });

    if (!category) {
      throw new NotFoundError('Category', categoryId);
    }

    // Sammle alle relevanten Kategorie-IDs (eigene + Parents)
    const categoryIds = await this.collectCategoryHierarchy(categoryId, query.includeInherited);

    // Hole Attribute aller relevanten Kategorien
    // Wenn ein spezifischer Scope angefragt wird, auch BOTH einschließen
    const attributes = await prisma.attributeDefinition.findMany({
      where: {
        categoryId: { in: categoryIds },
        ...(query.scope && {
          scope: { in: [query.scope, 'BOTH' as const] },
        }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return attributes as AttributeDefinition[];
  }

  /**
   * Sammelt alle Kategorie-IDs in der Hierarchie (bottom-up)
   */
  private async collectCategoryHierarchy(
    categoryId: string,
    includeParents: boolean
  ): Promise<string[]> {
    const ids: string[] = [categoryId];

    if (!includeParents) {
      return ids;
    }

    // Rekursiv Parents sammeln
    let currentId: string | null = categoryId;
    while (currentId) {
      const category: { parentId: string | null } | null =
        await prisma.categoryTaxonomy.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

      if (!category || !category.parentId) {
        break;
      }

      ids.push(category.parentId);
      currentId = category.parentId;
    }

    return ids;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Erstellt eine neue Attribut-Definition
   */
  async create(
    data: CreateAttributeDefinitionInput,
    userId?: string
  ): Promise<AttributeDefinition> {
    // Prüfe ob Kategorie existiert
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { id: data.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundError('Category', data.categoryId);
    }

    // Race Condition Fix: Prisma P2002 Error fangen statt Check-Then-Act
    try {
      // Erstelle Attribut
      const attribute = await prisma.attributeDefinition.create({
        data: {
          categoryId: data.categoryId,
          name: data.name,
          displayName: data.displayName,
          unit: data.unit || null,
          dataType: data.dataType,
          scope: data.scope ?? 'PART',
          isFilterable: data.isFilterable ?? true,
          isRequired: data.isRequired ?? false,
          isLabel: data.isLabel ?? false,
          allowedPrefixes: data.allowedPrefixes ?? [],
          siUnit: data.siUnit || null,
          siMultiplier: data.siMultiplier || null,
          sortOrder: data.sortOrder ?? 0,
        },
      });

      // Audit Log
      if (userId) {
        await auditService.logCreate(
          'ATTRIBUTE_DEFINITION',
          attribute.id,
          attribute as unknown as Record<string, unknown>,
          userId
        );
      }

      return attribute as AttributeDefinition;
    } catch (error) {
      // Race Condition: Unique Constraint Violation für name + categoryId
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(
          `Attribute with name '${data.name}' already exists in this category`
        );
      }
      throw error;
    }
  }

  /**
   * Aktualisiert eine Attribut-Definition
   */
  async update(
    id: string,
    data: UpdateAttributeDefinitionInput,
    userId?: string
  ): Promise<AttributeDefinition> {
    const existing = await prisma.attributeDefinition.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('AttributeDefinition', id);
    }

    // Validierung: isLabel nur wenn isRequired
    const newIsRequired = data.isRequired ?? existing.isRequired;
    const newIsLabel = data.isLabel ?? existing.isLabel;
    if (newIsLabel && !newIsRequired) {
      throw new ConflictError('Label erfordert Pflichtfeld (isRequired)');
    }

    // Aktualisiere Attribut
    const attribute = await prisma.attributeDefinition.update({
      where: { id },
      data: {
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.scope && { scope: data.scope }),
        ...(data.isFilterable !== undefined && { isFilterable: data.isFilterable }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.isLabel !== undefined && { isLabel: data.isLabel }),
        ...(data.allowedPrefixes !== undefined && { allowedPrefixes: data.allowedPrefixes }),
        ...(data.siUnit !== undefined && { siUnit: data.siUnit }),
        ...(data.siMultiplier !== undefined && { siMultiplier: data.siMultiplier }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    // Audit Log
    if (userId) {
      await auditService.logUpdate(
        'ATTRIBUTE_DEFINITION',
        attribute.id,
        existing as unknown as Record<string, unknown>,
        attribute as unknown as Record<string, unknown>,
        userId
      );
    }

    return attribute as AttributeDefinition;
  }

  /**
   * Löscht eine Attribut-Definition
   * WICHTIG: Nur wenn keine Werte mehr zugeordnet sind
   */
  async delete(id: string, userId?: string): Promise<void> {
    const existing = await prisma.attributeDefinition.findUnique({
      where: { id },
      include: {
        componentValues: { select: { id: true }, take: 1 },
        partValues: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      throw new NotFoundError('AttributeDefinition', id);
    }

    // Prüfe auf zugeordnete Werte
    if (existing.componentValues.length > 0 || existing.partValues.length > 0) {
      throw new ConflictError(
        'Cannot delete attribute definition with assigned values. Remove all values first.'
      );
    }

    // Lösche Attribut (hard delete, da keine Werte zugeordnet)
    await prisma.attributeDefinition.delete({
      where: { id },
    });

    // Audit Log
    if (userId) {
      await auditService.logDelete('ATTRIBUTE_DEFINITION', id, userId);
    }
  }
}

// Singleton-Export
export const attributeService = new AttributeService();
