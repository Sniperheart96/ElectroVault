/**
 * PackageGroup Service - Bauformen-Gruppen Verwaltung (CRUD)
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  PackageGroupListQuery,
  CreatePackageGroupInput,
  UpdatePackageGroupInput,
  PackageGroupBase,
  PackageGroupWithCount,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { generateSlug, generateUniqueSlug } from '../lib/slug';

/**
 * PackageGroup Service
 */
export class PackageGroupService {
  /**
   * Gibt eine paginierte Liste von PackageGroups zurück
   */
  async list(query: PackageGroupListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { sortOrder: 'asc' as const };

    const [groups, total] = await Promise.all([
      prisma.packageGroup.findMany({
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { packages: true },
          },
        },
      }),
      prisma.packageGroup.count(),
    ]);

    return createPaginatedResponse(
      groups as PackageGroupWithCount[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt alle PackageGroups zurück (ohne Paginierung, für Sidebar)
   */
  async listAll(): Promise<PackageGroupWithCount[]> {
    const groups = await prisma.packageGroup.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { packages: true },
        },
      },
    });

    return groups as PackageGroupWithCount[];
  }

  /**
   * Gibt eine PackageGroup nach ID zurück
   */
  async getById(id: string): Promise<PackageGroupWithCount> {
    const group = await prisma.packageGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: { packages: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('PackageGroup', id);
    }

    return group as PackageGroupWithCount;
  }

  /**
   * Gibt eine PackageGroup nach Slug zurück
   */
  async getBySlug(slug: string): Promise<PackageGroupWithCount> {
    const group = await prisma.packageGroup.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { packages: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('PackageGroup', slug);
    }

    return group as PackageGroupWithCount;
  }

  /**
   * Erstellt eine neue PackageGroup
   */
  async create(data: CreatePackageGroupInput): Promise<PackageGroupBase> {
    // Slug generieren falls nicht angegeben
    let slug = data.slug;
    if (!slug) {
      const nameValue =
        data.name.en || data.name.de || Object.values(data.name).find((v) => v) || 'group';
      const baseSlug = generateSlug(nameValue);
      const existingSlugs = await this.getExistingSlugs();
      slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Max sortOrder ermitteln
    const maxSortOrder = await prisma.packageGroup.aggregate({
      _max: { sortOrder: true },
    });

    try {
      const group = await prisma.packageGroup.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          sortOrder: data.sortOrder ?? (maxSortOrder._max.sortOrder ?? 0) + 1,
        },
      });

      return group as unknown as PackageGroupBase;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(`PackageGroup with slug '${slug}' already exists`);
      }
      throw error;
    }
  }

  /**
   * Aktualisiert eine PackageGroup
   */
  async update(id: string, data: UpdatePackageGroupInput): Promise<PackageGroupBase> {
    const existing = await prisma.packageGroup.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('PackageGroup', id);
    }

    // Slug-Konflikt prüfen falls geändert
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.packageGroup.findUnique({
        where: { slug: data.slug },
      });

      if (slugConflict) {
        throw new ConflictError(`PackageGroup with slug '${data.slug}' already exists`);
      }
    }

    const group = await prisma.packageGroup.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return group as unknown as PackageGroupBase;
  }

  /**
   * Löscht eine PackageGroup (nur wenn keine Packages zugeordnet)
   */
  async delete(id: string): Promise<void> {
    const group = await prisma.packageGroup.findUnique({
      where: { id },
      include: {
        _count: {
          select: { packages: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundError('PackageGroup', id);
    }

    if (group._count.packages > 0) {
      throw new ConflictError(
        `Cannot delete group with ${group._count.packages} packages. Remove or reassign packages first.`
      );
    }

    await prisma.packageGroup.delete({
      where: { id },
    });
  }

  /**
   * Sortierung der Gruppen ändern
   */
  async reorder(groups: Array<{ id: string; sortOrder: number }>): Promise<void> {
    await prisma.$transaction(
      groups.map((g) =>
        prisma.packageGroup.update({
          where: { id: g.id },
          data: { sortOrder: g.sortOrder },
        })
      )
    );
  }

  /**
   * Hilfsmethode: Alle existierenden Slugs abrufen
   */
  private async getExistingSlugs(): Promise<string[]> {
    const groups = await prisma.packageGroup.findMany({
      select: { slug: true },
    });
    return groups.map((g) => g.slug);
  }
}

// Singleton-Export
export const packageGroupService = new PackageGroupService();
