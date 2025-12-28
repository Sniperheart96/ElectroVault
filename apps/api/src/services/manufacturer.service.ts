/**
 * Manufacturer Service - Hersteller-Verwaltung (CRUD)
 */

import { prisma, Prisma } from '@electrovault/database';
import type {
  ManufacturerListQuery,
  CreateManufacturerInput,
  UpdateManufacturerInput,
  ManufacturerBase,
  ManufacturerWithAliases,
  ManufacturerFull,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { generateSlug, generateUniqueSlug } from '../lib/slug';

/**
 * Manufacturer Service
 */
export class ManufacturerService {
  /**
   * Gibt eine paginierte Liste von Herstellern zurück
   */
  async list(query: ManufacturerListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where = {
      ...(query.status && { status: query.status }),
      ...(query.countryCode && { countryCode: query.countryCode }),
      ...(!query.includeAcquired && { status: { not: 'ACQUIRED' as const } }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' as const } },
          { cageCode: { contains: query.search, mode: 'insensitive' as const } },
          {
            aliases: {
              some: {
                aliasName: { contains: query.search, mode: 'insensitive' as const },
              },
            },
          },
        ],
      }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { name: 'asc' as const };

    const [manufacturers, total] = await Promise.all([
      prisma.manufacturerMaster.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          aliases: true,
        },
      }),
      prisma.manufacturerMaster.count({ where }),
    ]);

    return createPaginatedResponse(
      manufacturers as ManufacturerWithAliases[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt einen Hersteller nach ID zurück
   */
  async getById(id: string): Promise<ManufacturerFull> {
    const manufacturer = await prisma.manufacturerMaster.findUnique({
      where: { id },
      include: {
        aliases: true,
        acquiredBy: true,
        acquisitions: {
          orderBy: { acquisitionDate: 'desc' },
        },
      },
    });

    if (!manufacturer) {
      throw new NotFoundError('Manufacturer', id);
    }

    return manufacturer as unknown as ManufacturerFull;
  }

  /**
   * Gibt einen Hersteller nach Slug zurück
   */
  async getBySlug(slug: string): Promise<ManufacturerFull> {
    const manufacturer = await prisma.manufacturerMaster.findUnique({
      where: { slug },
      include: {
        aliases: true,
        acquiredBy: true,
        acquisitions: {
          orderBy: { acquisitionDate: 'desc' },
        },
      },
    });

    if (!manufacturer) {
      throw new NotFoundError('Manufacturer', slug);
    }

    return manufacturer as unknown as ManufacturerFull;
  }

  /**
   * Erstellt einen neuen Hersteller
   */
  async create(
    data: CreateManufacturerInput,
    userId?: string
  ): Promise<ManufacturerWithAliases> {
    // Slug generieren falls nicht angegeben
    let slug = data.slug;
    if (!slug) {
      const baseSlug = generateSlug(data.name);
      const existingSlugs = await this.getExistingSlugs();
      slug = generateUniqueSlug(baseSlug, existingSlugs);
    }

    // Race Condition Fix: Prisma P2002 Error fangen statt Check-Then-Act
    try {
      const manufacturer = await prisma.manufacturerMaster.create({
        data: {
          name: data.name,
          slug,
          cageCode: data.cageCode,
          countryCode: data.countryCode,
          website: data.website,
          logoUrl: data.logoUrl,
          status: data.status,
          foundedYear: data.foundedYear,
          defunctYear: data.defunctYear,
          description: data.description,
          createdById: userId,
          aliases: data.aliases
            ? {
                create: data.aliases.map((alias) => ({
                  aliasName: alias.aliasName,
                  aliasType: alias.aliasType,
                })),
              }
            : undefined,
        },
        include: {
          aliases: true,
        },
      });

      return manufacturer as ManufacturerWithAliases;
    } catch (error) {
      // Race Condition: Unique Constraint Violation
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Prisma meta.target enthält das betroffene Feld
        const field = (error.meta as { target?: string[] })?.target?.[0];
        if (field === 'slug') {
          throw new ConflictError(`Manufacturer with slug '${slug}' already exists`);
        } else if (field === 'cageCode') {
          throw new ConflictError(
            `CAGE code '${data.cageCode}' is already assigned to another manufacturer`
          );
        }
        throw new ConflictError('Duplicate entry detected');
      }
      throw error;
    }
  }

  /**
   * Aktualisiert einen Hersteller
   */
  async update(
    id: string,
    data: UpdateManufacturerInput,
    _userId?: string
  ): Promise<ManufacturerWithAliases> {
    // Prüfen ob Hersteller existiert
    const existing = await prisma.manufacturerMaster.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Manufacturer', id);
    }

    // Slug-Konflikt prüfen falls geändert
    if (data.slug && data.slug !== existing.slug) {
      const slugConflict = await prisma.manufacturerMaster.findUnique({
        where: { slug: data.slug },
      });

      if (slugConflict) {
        throw new ConflictError(`Manufacturer with slug '${data.slug}' already exists`);
      }
    }

    // CAGE-Code-Konflikt prüfen falls geändert
    if (data.cageCode && data.cageCode !== existing.cageCode) {
      const cageConflict = await prisma.manufacturerMaster.findFirst({
        where: { cageCode: data.cageCode, NOT: { id } },
      });

      if (cageConflict) {
        throw new ConflictError(
          `CAGE code '${data.cageCode}' is already assigned to another manufacturer`
        );
      }
    }

    // Transaktion für Update + Aliase
    const manufacturer = await prisma.$transaction(async (tx) => {
      // Aliase aktualisieren falls angegeben
      if (data.aliases !== undefined) {
        // Alle alten Aliase löschen
        await tx.manufacturerAlias.deleteMany({
          where: { manufacturerId: id },
        });

        // Neue Aliase erstellen
        if (data.aliases && data.aliases.length > 0) {
          await tx.manufacturerAlias.createMany({
            data: data.aliases.map((alias) => ({
              manufacturerId: id,
              aliasName: alias.aliasName,
              aliasType: alias.aliasType,
            })),
          });
        }
      }

      // Hersteller aktualisieren
      return tx.manufacturerMaster.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          cageCode: data.cageCode,
          countryCode: data.countryCode,
          website: data.website,
          logoUrl: data.logoUrl,
          status: data.status,
          foundedYear: data.foundedYear,
          defunctYear: data.defunctYear,
          description: data.description,
          acquiredById: data.acquiredById,
          acquisitionDate: data.acquisitionDate,
        },
        include: {
          aliases: true,
        },
      });
    });

    return manufacturer as ManufacturerWithAliases;
  }

  /**
   * Löscht einen Hersteller (Hard-Delete, da Stammdaten)
   * Nur möglich wenn keine Parts zugeordnet sind
   */
  async delete(id: string): Promise<void> {
    const manufacturer = await prisma.manufacturerMaster.findUnique({
      where: { id },
      include: {
        _count: {
          select: { parts: true },
        },
      },
    });

    if (!manufacturer) {
      throw new NotFoundError('Manufacturer', id);
    }

    if (manufacturer._count.parts > 0) {
      throw new ConflictError(
        `Cannot delete manufacturer with ${manufacturer._count.parts} associated parts. Remove or reassign parts first.`
      );
    }

    await prisma.manufacturerMaster.delete({
      where: { id },
    });
  }

  /**
   * Sucht Hersteller nach Name oder Alias
   */
  async search(searchTerm: string, limit = 10): Promise<ManufacturerBase[]> {
    const manufacturers = await prisma.manufacturerMaster.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          {
            aliases: {
              some: {
                aliasName: { contains: searchTerm, mode: 'insensitive' },
              },
            },
          },
        ],
        status: { not: 'DEFUNCT' },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return manufacturers as ManufacturerBase[];
  }

  /**
   * Hilfsmethode: Alle existierenden Slugs abrufen
   */
  private async getExistingSlugs(): Promise<string[]> {
    const manufacturers = await prisma.manufacturerMaster.findMany({
      select: { slug: true },
    });
    return manufacturers.map((m) => m.slug);
  }
}

// Singleton-Export
export const manufacturerService = new ManufacturerService();
