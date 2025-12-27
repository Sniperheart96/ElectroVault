/**
 * Category Service - Kategorie-Verwaltung (Read-Only)
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
} from '@electrovault/schemas';
import { NotFoundError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';

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
      ...(query.isActive !== undefined && { isActive: query.isActive }),
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
    // Alle relevanten Kategorien abrufen
    const where = {
      ...(query.rootId && { id: query.rootId }),
      ...(!query.includeInactive && { isActive: true }),
    };

    // Wenn rootId angegeben, nur ab dieser Kategorie
    if (query.rootId) {
      return this.buildTreeFromRoot(query.rootId, query.maxDepth, query.includeInactive);
    }

    // Ansonsten alle Root-Kategorien (Level 1)
    const rootCategories = await prisma.categoryTaxonomy.findMany({
      where: {
        parentId: null,
        ...(!query.includeInactive && { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Rekursiv Kinder laden
    const tree = await Promise.all(
      rootCategories.map((cat) =>
        this.buildCategoryNode(cat, 1, query.maxDepth, query.includeInactive)
      )
    );

    return tree;
  }

  /**
   * Baut den Baum ab einer bestimmten Root-Kategorie
   */
  private async buildTreeFromRoot(
    rootId: string,
    maxDepth: number,
    includeInactive: boolean
  ): Promise<CategoryTreeNode[]> {
    const root = await prisma.categoryTaxonomy.findUnique({
      where: { id: rootId },
    });

    if (!root) {
      throw new NotFoundError('Category', rootId);
    }

    const node = await this.buildCategoryNode(root, 1, maxDepth, includeInactive);
    return [node];
  }

  /**
   * Rekursive Funktion zum Aufbau eines Kategorie-Knotens
   */
  private async buildCategoryNode(
    category: PrismaCategory,
    currentDepth: number,
    maxDepth: number,
    includeInactive: boolean
  ): Promise<CategoryTreeNode> {
    const children: PrismaCategory[] =
      currentDepth < maxDepth
        ? await prisma.categoryTaxonomy.findMany({
            where: {
              parentId: category.id,
              ...(!includeInactive && { isActive: true }),
            },
            orderBy: { sortOrder: 'asc' },
          })
        : [];

    const childNodes = await Promise.all(
      children.map((child) =>
        this.buildCategoryNode(child, currentDepth + 1, maxDepth, includeInactive)
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
      isActive: category.isActive,
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
        where: { parentId, isActive: true },
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
}

// Singleton-Export
export const categoryService = new CategoryService();
