/**
 * Category Service - Kategorie-Verwaltung mit CRUD
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  CategoryListQuery,
  CategoryTreeQuery,
  CategoryBase,
  CategoryWithParent,
  CategoryTreeNode,
  CategoryWithAttributes,
  CategoryPath,
  CreateCategoryInput,
  UpdateCategoryInput,
  BulkReorderCategoriesInput,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { toJsonValue } from '../lib/json-helpers';
import { auditService } from './audit.service';

// Type für Kategorie aus Prisma
type PrismaCategory = Prisma.CategoryTaxonomyGetPayload<object>;

// Type für den Pfad-Query
type PathCategory = {
  id: string;
  name: unknown;
  slug: string;
  level: number;
  parentId: string | null;
} | null;

/**
 * Category Service
 */
export class CategoryService {
  /**
   * Gibt eine paginierte Liste von Kategorien zurück
   */
  async list(query: CategoryListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where = {
      ...(query.level !== undefined && { level: query.level }),
      ...(query.parentId !== undefined && { parentId: query.parentId }),
      ...(query.search && {
        OR: [
          {
            slug: { contains: query.search.toLowerCase(), mode: 'insensitive' as const },
          },
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
      : { sortOrder: 'asc' as const };

    const [categories, total] = await Promise.all([
      prisma.categoryTaxonomy.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.categoryTaxonomy.count({ where }),
    ]);

    return createPaginatedResponse(
      categories as CategoryBase[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt eine Kategorie nach ID zurück
   */
  async getById(id: string): Promise<CategoryWithParent> {
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { id },
      include: {
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Category', id);
    }

    return category as CategoryWithParent;
  }

  /**
   * Gibt eine Kategorie nach Slug zurück
   */
  async getBySlug(slug: string): Promise<CategoryWithParent> {
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { slug },
      include: {
        parent: true,
      },
    });

    if (!category) {
      throw new NotFoundError('Category', slug);
    }

    return category as CategoryWithParent;
  }

  /**
   * Gibt den Kategorie-Baum zurück
   */
  async getTree(query: CategoryTreeQuery): Promise<CategoryTreeNode[]> {
    // Wenn rootId angegeben, nur ab dieser Kategorie
    if (query.rootId) {
      return this.buildTreeFromRoot(query.rootId, query.maxDepth);
    }

    // Ansonsten alle Root-Kategorien (Level 1)
    const rootCategories = await prisma.categoryTaxonomy.findMany({
      where: {
        parentId: null,
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Rekursiv Kinder laden
    const tree = await Promise.all(
      rootCategories.map((cat) =>
        this.buildCategoryNode(cat, 1, query.maxDepth)
      )
    );

    return tree;
  }

  /**
   * Baut den Baum ab einer bestimmten Root-Kategorie
   */
  private async buildTreeFromRoot(
    rootId: string,
    maxDepth: number
  ): Promise<CategoryTreeNode[]> {
    const root = await prisma.categoryTaxonomy.findUnique({
      where: { id: rootId },
    });

    if (!root) {
      throw new NotFoundError('Category', rootId);
    }

    const node = await this.buildCategoryNode(root, 1, maxDepth);
    return [node];
  }

  /**
   * Rekursive Funktion zum Aufbau eines Kategorie-Knotens
   */
  private async buildCategoryNode(
    category: PrismaCategory,
    currentDepth: number,
    maxDepth: number
  ): Promise<CategoryTreeNode> {
    const children: PrismaCategory[] =
      currentDepth < maxDepth
        ? await prisma.categoryTaxonomy.findMany({
            where: {
              parentId: category.id,
            },
            orderBy: { sortOrder: 'asc' },
          })
        : [];

    const childNodes = await Promise.all(
      children.map((child) =>
        this.buildCategoryNode(child, currentDepth + 1, maxDepth)
      )
    );

    return {
      id: category.id,
      name: category.name as CategoryBase['name'],
      slug: category.slug,
      level: category.level,
      description: category.description as CategoryBase['description'],
      iconUrl: category.iconUrl,
      sortOrder: category.sortOrder,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      children: childNodes,
    };
  }

  /**
   * Gibt eine Kategorie mit ihren Attribut-Definitionen zurück
   */
  async getWithAttributes(id: string): Promise<CategoryWithAttributes> {
    const category = await prisma.categoryTaxonomy.findUnique({
      where: { id },
      include: {
        attributeDefinitions: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category', id);
    }

    return category as unknown as CategoryWithAttributes;
  }

  /**
   * Gibt den Pfad (Breadcrumb) zu einer Kategorie zurück
   */
  async getPath(id: string): Promise<CategoryPath> {
    const path: CategoryPath = [];
    let currentId: string | null = id;

    while (currentId) {
      const category: PathCategory = await prisma.categoryTaxonomy.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          parentId: true,
        },
      });

      if (!category) {
        break;
      }

      path.unshift({
        id: category.id,
        name: category.name as CategoryPath[0]['name'],
        slug: category.slug,
        level: category.level,
      });

      currentId = category.parentId;
    }

    return path;
  }

  /**
   * Gibt alle Unterkategorie-IDs einer Kategorie zurück (für Suche)
   */
  async getDescendantIds(id: string): Promise<string[]> {
    const descendants: string[] = [];

    const collectDescendants = async (parentId: string) => {
      const children = await prisma.categoryTaxonomy.findMany({
        where: { parentId },
        select: { id: true },
      });

      for (const child of children) {
        descendants.push(child.id);
        await collectDescendants(child.id);
      }
    };

    await collectDescendants(id);
    return descendants;
  }

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  /**
   * Erstellt eine neue Kategorie
   */
  async create(data: CreateCategoryInput, userId?: string): Promise<CategoryBase> {
    // Generiere Slug aus deutschem oder englischem Namen
    const nameForSlug = data.name.de || data.name.en || 'kategorie';
    const baseSlug = this.generateSlug(nameForSlug);

    // Bestimme Level basierend auf Parent
    let level = 0;
    if (data.parentId) {
      const parent = await prisma.categoryTaxonomy.findUnique({
        where: { id: data.parentId },
        select: { level: true },
      });
      if (!parent) {
        throw new NotFoundError('Parent Category', data.parentId);
      }
      level = parent.level + 1;
      if (level > 4) {
        throw new ConflictError('Maximum category depth (4 levels) exceeded');
      }
    }

    // Race Condition Fix: Prisma P2002 Error fangen, bei Konflikt mit Timestamp retry
    let slug = baseSlug;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Bestimme nächste sortOrder für Geschwister
        const maxSortOrder = await prisma.categoryTaxonomy.aggregate({
          where: { parentId: data.parentId || null },
          _max: { sortOrder: true },
        });
        const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

        const category = await prisma.categoryTaxonomy.create({
          data: {
            name: data.name,
            slug,
            level,
            parentId: data.parentId || null,
            description: toJsonValue(data.description),
            iconUrl: data.iconUrl || null,
            sortOrder: nextSortOrder,
          },
        });

        // Audit Log
        if (userId) {
          await auditService.logCreate(
            'CATEGORY',
            category.id,
            category as unknown as Record<string, unknown>,
            userId
          );
        }

        return category as CategoryBase;
      } catch (error) {
        // Race Condition: Unique Constraint Violation für Slug
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new ConflictError(`Category with slug '${baseSlug}' already exists`);
          }
          // Retry mit Timestamp
          slug = `${baseSlug}-${Date.now()}`;
        } else {
          throw error;
        }
      }
    }

    throw new ConflictError(`Failed to create category after ${maxRetries} attempts`);
  }

  /**
   * Aktualisiert eine Kategorie
   * Hinweis: parentId und sortOrder können nach Erstellung nicht mehr geändert werden
   */
  async update(id: string, data: UpdateCategoryInput, userId?: string): Promise<CategoryBase> {
    const existing = await prisma.categoryTaxonomy.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Category', id);
    }

    const category = await prisma.categoryTaxonomy.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: toJsonValue(data.description) }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
      },
    });

    // Audit Log
    if (userId) {
      await auditService.logUpdate(
        'CATEGORY',
        category.id,
        existing as unknown as Record<string, unknown>,
        category as unknown as Record<string, unknown>,
        userId
      );
    }

    return category as CategoryBase;
  }

  /**
   * Löscht eine Kategorie (Soft-Delete)
   */
  async delete(id: string, userId?: string): Promise<void> {
    const existing = await prisma.categoryTaxonomy.findUnique({
      where: { id },
      include: {
        children: { select: { id: true } },
        coreComponents: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      throw new NotFoundError('Category', id);
    }

    // Prüfe auf Unterkategorien
    if (existing.children.length > 0) {
      throw new ConflictError('Cannot delete category with child categories');
    }

    // Prüfe auf zugeordnete Komponenten
    if (existing.coreComponents.length > 0) {
      throw new ConflictError('Cannot delete category with assigned components');
    }

    // Kategorie löschen (hard delete, da keine Komponenten zugeordnet)
    await prisma.categoryTaxonomy.delete({
      where: { id },
    });

    // Audit Log
    if (userId) {
      await auditService.logDelete(
        'CATEGORY',
        id,
        userId
      );
    }
  }

  /**
   * Sortiert Kategorien innerhalb einer Eltern-Kategorie neu
   */
  async reorderCategories(data: BulkReorderCategoriesInput, userId?: string): Promise<void> {
    const { parentId, categories } = data;

    console.log('[CategoryService.reorderCategories] Starting with:', {
      parentId,
      categoriesCount: categories.length,
      userId,
    });

    // Normalisiere parentId: null und undefined werden gleich behandelt
    const normalizedParentId = parentId ?? null;

    // Prüfe ob alle Kategorien zum gleichen Parent gehören
    const categoryIds = categories.map((c) => c.id);
    console.log('[CategoryService.reorderCategories] Looking for categories:', categoryIds);

    const existingCategories = await prisma.categoryTaxonomy.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, parentId: true },
    });

    console.log('[CategoryService.reorderCategories] Found categories:', existingCategories);

    if (existingCategories.length !== categoryIds.length) {
      const foundIds = new Set(existingCategories.map((c) => c.id));
      const missingIds = categoryIds.filter((id) => !foundIds.has(id));
      console.error('[CategoryService.reorderCategories] Missing categories:', missingIds);
      throw new NotFoundError('Categories', missingIds.join(', '));
    }

    // Prüfe ob alle Kategorien den gleichen Parent haben
    const wrongParentCategories = existingCategories.filter((c) => {
      const catParentId = c.parentId ?? null;
      return catParentId !== normalizedParentId;
    });
    if (wrongParentCategories.length > 0) {
      console.error('[CategoryService.reorderCategories] Wrong parent categories:', wrongParentCategories);
      throw new ConflictError('All categories must belong to the same parent');
    }

    // Bulk-Update in Transaktion
    console.log('[CategoryService.reorderCategories] Updating sort orders...');
    await prisma.$transaction(
      categories.map((cat) =>
        prisma.categoryTaxonomy.update({
          where: { id: cat.id },
          data: { sortOrder: cat.sortOrder },
        })
      )
    );

    console.log('[CategoryService.reorderCategories] Sort orders updated successfully');

    // Audit Log - nur wenn parentId eine gültige UUID ist
    // Bei Root-Level (parentId === null) verwenden wir die erste Kategorie-ID als Referenz
    if (userId) {
      const auditEntityId = normalizedParentId || categories[0]?.id;
      if (auditEntityId) {
        console.log('[CategoryService.reorderCategories] Creating audit log for entityId:', auditEntityId);
        await auditService.log({
          action: 'UPDATE',
          entityType: 'CATEGORY',
          entityId: auditEntityId,
          newData: {
            reorderedCategories: categories,
            parentId: normalizedParentId,
          },
          userId,
        });
      }
    }

    console.log('[CategoryService.reorderCategories] Completed successfully');
  }

  /**
   * Generiert einen URL-freundlichen Slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
}

// Singleton-Export
export const categoryService = new CategoryService();
