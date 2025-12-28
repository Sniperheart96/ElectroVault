/**
 * Package Service - Bauformen/Gehäuse-Verwaltung (CRUD)
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  PackageListQuery,
  CreatePackageInput,
  UpdatePackageInput,
  CreateFootprintInput,
  PackageBase,
  PackageWithFootprints,
  EcadFootprint,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { generateSlug, generateUniqueSlug } from '../lib/slug';

/**
 * Package Service
 */
export class PackageService {
  /**
   * Gibt eine paginierte Liste von Packages zurück
   */
  async list(query: PackageListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where = {
      ...(query.mountingType && { mountingType: query.mountingType }),
      ...(query.pinCount && { pinCount: query.pinCount }),
      ...(query.minPinCount && { pinCount: { gte: query.minPinCount } }),
      ...(query.maxPinCount && { pinCount: { lte: query.maxPinCount } }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' as const } },
          { jedecStandard: { contains: query.search, mode: 'insensitive' as const } },
          { eiaStandard: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { name: 'asc' as const };

    const [packages, total] = await Promise.all([
      prisma.packageMaster.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      prisma.packageMaster.count({ where }),
    ]);

    return createPaginatedResponse(
      packages as PackageBase[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt ein Package nach ID zurück
   */
  async getById(id: string): Promise<PackageWithFootprints> {
    const pkg = await prisma.packageMaster.findUnique({
      where: { id },
      include: {
        ecadFootprints: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundError('Package', id);
    }

    return pkg as unknown as PackageWithFootprints;
  }

  /**
   * Gibt ein Package nach Slug zurück
   */
  async getBySlug(slug: string): Promise<PackageWithFootprints> {
    const pkg = await prisma.packageMaster.findUnique({
      where: { slug },
      include: {
        ecadFootprints: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundError('Package', slug);
    }

    return pkg as unknown as PackageWithFootprints;
  }

  /**
   * Erstellt ein neues Package
   */
  async create(data: CreatePackageInput): Promise<PackageBase> {
    // Slug generieren falls nicht angegeben
    let slug = data.slug;
    if (!slug) {
      const baseSlug = generateSlug(data.name);
      const existingSlugs = await this.getExistingSlugs();
      slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Race Condition Fix: Prisma P2002 Error fangen statt Check-Then-Act
    try {
      const pkg = await prisma.packageMaster.create({
        data: {
          name: data.name,
          slug,
          lengthMm: data.lengthMm,
          widthMm: data.widthMm,
          heightMm: data.heightMm,
          pitchMm: data.pitchMm,
          mountingType: data.mountingType,
          pinCount: data.pinCount,
          pinCountMin: data.pinCountMin,
          pinCountMax: data.pinCountMax,
          jedecStandard: data.jedecStandard,
          eiaStandard: data.eiaStandard,
          drawingUrl: data.drawingUrl,
          description: data.description,
        },
      });

      return pkg as PackageBase;
    } catch (error) {
      // Race Condition: Unique Constraint Violation für Slug
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictError(`Package with slug '${slug}' already exists`);
      }
      throw error;
    }
  }

  /**
   * Aktualisiert ein Package
   */
  async update(id: string, data: UpdatePackageInput): Promise<PackageBase> {
    // Prüfen ob Package existiert
    const existing = await prisma.packageMaster.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Package', id);
    }

    // Slug-Konflikt prüfen falls geändert
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.packageMaster.findUnique({
        where: { slug: data.slug },
      });

      if (slugConflict) {
        throw new ConflictError(`Package with slug '${data.slug}' already exists`);
      }
    }

    const pkg = await prisma.packageMaster.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        lengthMm: data.lengthMm,
        widthMm: data.widthMm,
        heightMm: data.heightMm,
        pitchMm: data.pitchMm,
        mountingType: data.mountingType,
        pinCount: data.pinCount,
        pinCountMin: data.pinCountMin,
        pinCountMax: data.pinCountMax,
        jedecStandard: data.jedecStandard,
        eiaStandard: data.eiaStandard,
        drawingUrl: data.drawingUrl,
        description: data.description,
      },
    });

    return pkg as PackageBase;
  }

  /**
   * Löscht ein Package (nur wenn keine Parts zugeordnet)
   */
  async delete(id: string): Promise<void> {
    const pkg = await prisma.packageMaster.findUnique({
      where: { id },
      include: {
        _count: {
          select: { parts: true },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundError('Package', id);
    }

    if (pkg._count.parts > 0) {
      throw new ConflictError(
        `Cannot delete package with ${pkg._count.parts} associated parts. Remove or reassign parts first.`
      );
    }

    await prisma.packageMaster.delete({
      where: { id },
    });
  }

  /**
   * Fügt einen ECAD-Footprint zu einem Package hinzu
   */
  async addFootprint(
    packageId: string,
    data: CreateFootprintInput,
    userId?: string
  ): Promise<EcadFootprint> {
    // Prüfen ob Package existiert
    const pkg = await prisma.packageMaster.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      throw new NotFoundError('Package', packageId);
    }

    const footprint = await prisma.ecadFootprint.create({
      data: {
        packageId,
        name: data.name,
        ecadFormat: data.ecadFormat,
        fileUrl: data.fileUrl,
        ipcName: data.ipcName,
        createdById: userId,
      },
    });

    return footprint as EcadFootprint;
  }

  /**
   * Entfernt einen ECAD-Footprint
   */
  async removeFootprint(packageId: string, footprintId: string): Promise<void> {
    const footprint = await prisma.ecadFootprint.findFirst({
      where: {
        id: footprintId,
        packageId,
      },
    });

    if (!footprint) {
      throw new NotFoundError('Footprint', footprintId);
    }

    await prisma.ecadFootprint.delete({
      where: { id: footprintId },
    });
  }

  /**
   * Sucht Packages nach Name
   */
  async search(searchTerm: string, limit = 10): Promise<PackageBase[]> {
    const packages = await prisma.packageMaster.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { jedecStandard: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return packages as PackageBase[];
  }

  /**
   * Hilfsmethode: Alle existierenden Slugs abrufen
   */
  private async getExistingSlugs(): Promise<string[]> {
    const packages = await prisma.packageMaster.findMany({
      select: { slug: true },
    });
    return packages.map((p) => p.slug);
  }
}

// Singleton-Export
export const packageService = new PackageService();
