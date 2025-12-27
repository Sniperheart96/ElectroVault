/**
 * Part Service - ManufacturerPart-Verwaltung (CRUD)
 */

import { prisma } from '@electrovault/database';
import type {
  PartListQuery,
  CreatePartInput,
  UpdatePartInput,
  CreatePartRelationshipInput,
  CreateDatasheetInput,
  CreatePartImageInput,
  PartBase,
  PartWithRelations,
  PartFull,
  PartListItem,
  LocalizedString,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError, BadRequestError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';
import { categoryService } from './category.service';

/**
 * Part Service
 */
export class PartService {
  /**
   * Gibt eine paginierte Liste von Parts zurück
   */
  async list(query: PartListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    // Kategorie-Filter inklusive Unterkategorien
    let categoryIds: string[] | undefined;
    if (query.categoryId) {
      const descendants = await categoryService.getDescendantIds(query.categoryId);
      categoryIds = [query.categoryId, ...descendants];
    }

    const where = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.lifecycleStatus && { lifecycleStatus: query.lifecycleStatus }),
      ...(query.coreComponentId && { coreComponentId: query.coreComponentId }),
      ...(query.manufacturerId && { manufacturerId: query.manufacturerId }),
      ...(query.packageId && { packageId: query.packageId }),
      ...(query.rohsCompliant !== undefined && { rohsCompliant: query.rohsCompliant }),
      ...(categoryIds && {
        coreComponent: { categoryId: { in: categoryIds } },
      }),
      ...(query.mpn && {
        mpn: { contains: query.mpn, mode: 'insensitive' as const },
      }),
      ...(query.search && {
        OR: [
          { mpn: { contains: query.search, mode: 'insensitive' as const } },
          { orderingCode: { contains: query.search, mode: 'insensitive' as const } },
          { nsn: { contains: query.search, mode: 'insensitive' as const } },
          { milSpec: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { updatedAt: 'desc' as const };

    const [parts, total] = await Promise.all([
      prisma.manufacturerPart.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          coreComponent: {
            select: { id: true, name: true, slug: true },
          },
          manufacturer: {
            select: { id: true, name: true, slug: true },
          },
          package: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      }),
      prisma.manufacturerPart.count({ where }),
    ]);

    // Transform zu PartListItem
    const items: PartListItem[] = parts.map((p) => ({
      id: p.id,
      mpn: p.mpn,
      orderingCode: p.orderingCode,
      status: p.status,
      lifecycleStatus: p.lifecycleStatus,
      manufacturer: p.manufacturer,
      coreComponent: {
        id: p.coreComponent.id,
        name: p.coreComponent.name as LocalizedString,
        slug: p.coreComponent.slug,
      },
      package: p.package,
      primaryImage: p.images[0] || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return createPaginatedResponse(items, query.page, query.limit, total);
  }

  /**
   * Gibt ein Part nach ID zurück
   */
  async getById(id: string): Promise<PartFull> {
    const part = await prisma.manufacturerPart.findUnique({
      where: { id, deletedAt: null },
      include: {
        coreComponent: true,
        manufacturer: true,
        package: true,
        hazardousMaterials: true,
        pinMappings: {
          orderBy: { pinNumber: 'asc' },
        },
        datasheets: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        attributeValues: {
          include: { definition: true },
        },
        relationships: {
          include: { target: true },
        },
        relatedTo: {
          include: { source: true },
        },
      },
    });

    if (!part) {
      throw new NotFoundError('Part', id);
    }

    return part as unknown as PartFull;
  }

  /**
   * Gibt ein Part nach Hersteller-ID und MPN zurück
   */
  async getByMpn(manufacturerId: string, mpn: string): Promise<PartFull> {
    const part = await prisma.manufacturerPart.findFirst({
      where: {
        manufacturerId,
        mpn: { equals: mpn, mode: 'insensitive' },
        deletedAt: null,
      },
      include: {
        coreComponent: true,
        manufacturer: true,
        package: true,
        hazardousMaterials: true,
        pinMappings: {
          orderBy: { pinNumber: 'asc' },
        },
        datasheets: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
        attributeValues: {
          include: { definition: true },
        },
        relationships: {
          include: { target: true },
        },
        relatedTo: {
          include: { source: true },
        },
      },
    });

    if (!part) {
      throw new NotFoundError('Part', `${manufacturerId}/${mpn}`);
    }

    return part as unknown as PartFull;
  }

  /**
   * Erstellt ein neues Part
   */
  async create(data: CreatePartInput, userId?: string): Promise<PartWithRelations> {
    // Prüfen ob CoreComponent existiert
    const component = await prisma.coreComponent.findUnique({
      where: { id: data.coreComponentId, deletedAt: null },
    });

    if (!component) {
      throw new BadRequestError(`CoreComponent '${data.coreComponentId}' not found`);
    }

    // Prüfen ob Manufacturer existiert
    const manufacturer = await prisma.manufacturerMaster.findUnique({
      where: { id: data.manufacturerId },
    });

    if (!manufacturer) {
      throw new BadRequestError(`Manufacturer '${data.manufacturerId}' not found`);
    }

    // Prüfen ob Package existiert (falls angegeben)
    if (data.packageId) {
      const pkg = await prisma.packageMaster.findUnique({
        where: { id: data.packageId },
      });

      if (!pkg) {
        throw new BadRequestError(`Package '${data.packageId}' not found`);
      }
    }

    // Prüfen ob MPN bereits existiert für diesen Hersteller
    const existing = await prisma.manufacturerPart.findFirst({
      where: {
        manufacturerId: data.manufacturerId,
        mpn: data.mpn,
      },
    });

    if (existing) {
      throw new ConflictError(
        `Part with MPN '${data.mpn}' already exists for manufacturer '${manufacturer.name}'`
      );
    }

    // Transaktion für Part + Sub-Entitäten
    const part = await prisma.$transaction(async (tx) => {
      // Part erstellen
      const newPart = await tx.manufacturerPart.create({
        data: {
          coreComponentId: data.coreComponentId,
          manufacturerId: data.manufacturerId,
          mpn: data.mpn,
          orderingCode: data.orderingCode,
          packageId: data.packageId,
          weightGrams: data.weightGrams,
          dateCodeFormat: data.dateCodeFormat,
          introductionYear: data.introductionYear,
          discontinuedYear: data.discontinuedYear,
          rohsCompliant: data.rohsCompliant,
          reachCompliant: data.reachCompliant,
          nsn: data.nsn,
          milSpec: data.milSpec,
          status: data.status,
          lifecycleStatus: data.lifecycleStatus,
          createdById: userId,
          lastEditedById: userId,
        },
        include: {
          coreComponent: true,
          manufacturer: true,
          package: true,
        },
      });

      // Pin-Mappings erstellen falls angegeben
      if (data.pinMappings && data.pinMappings.length > 0) {
        await tx.pinMapping.createMany({
          data: data.pinMappings.map((pin) => ({
            partId: newPart.id,
            pinNumber: pin.pinNumber,
            pinName: pin.pinName,
            pinFunction: pin.pinFunction,
            pinType: pin.pinType,
            maxVoltage: pin.maxVoltage,
            maxCurrent: pin.maxCurrent,
          })),
        });
      }

      // Gefahrstoffe erstellen falls angegeben
      if (data.hazardousMaterials && data.hazardousMaterials.length > 0) {
        await tx.hazardousMaterial.createMany({
          data: data.hazardousMaterials.map((haz) => ({
            partId: newPart.id,
            materialType: haz.materialType,
            details: haz.details,
          })),
        });
      }

      // Attributwerte erstellen falls angegeben
      if (data.attributeValues && data.attributeValues.length > 0) {
        for (const value of data.attributeValues) {
          // Prüfen ob Definition existiert und Scope passt
          const definition = await tx.attributeDefinition.findUnique({
            where: { id: value.definitionId },
          });

          if (!definition) {
            throw new BadRequestError(`Attribute definition '${value.definitionId}' not found`);
          }

          if (definition.scope === 'COMPONENT') {
            throw new BadRequestError(
              `Attribute '${definition.name}' is COMPONENT-scoped and cannot be assigned to a part`
            );
          }

          await tx.partAttributeValue.create({
            data: {
              partId: newPart.id,
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

      return newPart;
    });

    return part as unknown as PartWithRelations;
  }

  /**
   * Aktualisiert ein Part
   */
  async update(id: string, data: UpdatePartInput, userId?: string): Promise<PartWithRelations> {
    const existing = await prisma.manufacturerPart.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundError('Part', id);
    }

    // Package prüfen falls geändert
    if (data.packageId && data.packageId !== existing.packageId) {
      const pkg = await prisma.packageMaster.findUnique({
        where: { id: data.packageId },
      });

      if (!pkg) {
        throw new BadRequestError(`Package '${data.packageId}' not found`);
      }
    }

    // Transaktion für Update + Sub-Entitäten
    const part = await prisma.$transaction(async (tx) => {
      // Pin-Mappings aktualisieren falls angegeben
      if (data.pinMappings !== undefined) {
        await tx.pinMapping.deleteMany({ where: { partId: id } });

        if (data.pinMappings && data.pinMappings.length > 0) {
          await tx.pinMapping.createMany({
            data: data.pinMappings.map((pin) => ({
              partId: id,
              pinNumber: pin.pinNumber,
              pinName: pin.pinName,
              pinFunction: pin.pinFunction,
              pinType: pin.pinType,
              maxVoltage: pin.maxVoltage,
              maxCurrent: pin.maxCurrent,
            })),
          });
        }
      }

      // Gefahrstoffe aktualisieren falls angegeben
      if (data.hazardousMaterials !== undefined) {
        await tx.hazardousMaterial.deleteMany({ where: { partId: id } });

        if (data.hazardousMaterials && data.hazardousMaterials.length > 0) {
          await tx.hazardousMaterial.createMany({
            data: data.hazardousMaterials.map((haz) => ({
              partId: id,
              materialType: haz.materialType,
              details: haz.details,
            })),
          });
        }
      }

      // Part aktualisieren
      return tx.manufacturerPart.update({
        where: { id },
        data: {
          mpn: data.mpn,
          orderingCode: data.orderingCode,
          packageId: data.packageId,
          weightGrams: data.weightGrams,
          dateCodeFormat: data.dateCodeFormat,
          introductionYear: data.introductionYear,
          discontinuedYear: data.discontinuedYear,
          rohsCompliant: data.rohsCompliant,
          reachCompliant: data.reachCompliant,
          nsn: data.nsn,
          milSpec: data.milSpec,
          status: data.status,
          lifecycleStatus: data.lifecycleStatus,
          lastEditedById: userId,
        },
        include: {
          coreComponent: true,
          manufacturer: true,
          package: true,
        },
      });
    });

    return part as unknown as PartWithRelations;
  }

  /**
   * Löscht ein Part (Soft-Delete)
   */
  async delete(id: string, userId?: string): Promise<void> {
    const part = await prisma.manufacturerPart.findUnique({
      where: { id, deletedAt: null },
    });

    if (!part) {
      throw new NotFoundError('Part', id);
    }

    await prisma.manufacturerPart.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: userId,
      },
    });
  }

  /**
   * Fügt eine Part-Beziehung hinzu
   */
  async addRelationship(
    partId: string,
    data: CreatePartRelationshipInput,
    userId?: string
  ): Promise<void> {
    const [source, target] = await Promise.all([
      prisma.manufacturerPart.findUnique({ where: { id: partId, deletedAt: null } }),
      prisma.manufacturerPart.findUnique({ where: { id: data.targetId, deletedAt: null } }),
    ]);

    if (!source) {
      throw new NotFoundError('Part', partId);
    }

    if (!target) {
      throw new NotFoundError('Part', data.targetId);
    }

    const existing = await prisma.partRelationship.findFirst({
      where: {
        sourceId: partId,
        targetId: data.targetId,
        relationshipType: data.relationshipType,
      },
    });

    if (existing) {
      throw new ConflictError('This relationship already exists');
    }

    await prisma.partRelationship.create({
      data: {
        sourceId: partId,
        targetId: data.targetId,
        relationshipType: data.relationshipType,
        confidence: data.confidence,
        notes: data.notes,
        createdById: userId,
      },
    });
  }

  /**
   * Fügt ein Datasheet hinzu
   */
  async addDatasheet(
    partId: string,
    data: CreateDatasheetInput,
    userId?: string
  ): Promise<void> {
    const part = await prisma.manufacturerPart.findUnique({
      where: { id: partId, deletedAt: null },
    });

    if (!part) {
      throw new NotFoundError('Part', partId);
    }

    // Wenn neues Datasheet primär ist, andere auf nicht-primär setzen
    if (data.isPrimary) {
      await prisma.partDatasheet.updateMany({
        where: { partId },
        data: { isPrimary: false },
      });
    }

    await prisma.partDatasheet.create({
      data: {
        partId,
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        version: data.version,
        language: data.language,
        publishDate: data.publishDate,
        isPrimary: data.isPrimary,
        createdById: userId,
      },
    });
  }

  /**
   * Fügt ein Bild hinzu
   */
  async addImage(
    partId: string,
    data: CreatePartImageInput,
    userId?: string
  ): Promise<void> {
    const part = await prisma.manufacturerPart.findUnique({
      where: { id: partId, deletedAt: null },
    });

    if (!part) {
      throw new NotFoundError('Part', partId);
    }

    // Wenn neues Bild primär ist, andere auf nicht-primär setzen
    if (data.isPrimary) {
      await prisma.partImage.updateMany({
        where: { partId },
        data: { isPrimary: false },
      });
    }

    await prisma.partImage.create({
      data: {
        partId,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        altText: data.altText,
        imageType: data.imageType,
        sortOrder: data.sortOrder,
        isPrimary: data.isPrimary,
        createdById: userId,
      },
    });
  }

  /**
   * Sucht Parts nach MPN
   */
  async search(searchTerm: string, limit = 10): Promise<PartBase[]> {
    const parts = await prisma.manufacturerPart.findMany({
      where: {
        deletedAt: null,
        OR: [
          { mpn: { contains: searchTerm, mode: 'insensitive' } },
          { orderingCode: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { mpn: 'asc' },
    });

    return parts as PartBase[];
  }
}

// Singleton-Export
export const partService = new PartService();
