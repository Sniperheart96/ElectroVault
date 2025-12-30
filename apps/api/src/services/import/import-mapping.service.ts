/**
 * Import Mapping Service - Attribut/Kategorie/Hersteller-Mappings verwalten
 */

import { prisma, Prisma, type ImportMappingType } from '@electrovault/database';
import type {
  ImportMappingListQuery,
  CreateImportMappingInput,
  UpdateImportMappingInput,
  BulkCreateMappingsInput,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../../lib/pagination';

// Typen für die internen Prisma-Ergebnisse (mit Decimal)
type PrismaMappingResult = Awaited<ReturnType<typeof prisma.importMapping.findUnique>>;
type PrismaMappingWithRelationsResult = Awaited<ReturnType<typeof prisma.importMapping.findMany>>[number];

// API-Response-Typen (mit number statt Decimal)
interface ImportMappingResponse {
  id: string;
  sourceId: string | null;
  mappingType: ImportMappingType;
  sourceKey: string;
  sourceValue: string | null;
  targetAttributeId: string | null;
  targetCategoryId: string | null;
  targetManufacturerId: string | null;
  conversionFactor: number | null;
  conversionOffset: number | null;
  parsePattern: string | null;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
}

/**
 * Konvertiert ein Prisma-Mapping für die API-Response (Decimal -> number)
 */
function toApiResponse(mapping: NonNullable<PrismaMappingResult>): ImportMappingResponse {
  return {
    ...mapping,
    conversionFactor: mapping.conversionFactor ? Number(mapping.conversionFactor) : null,
    conversionOffset: mapping.conversionOffset ? Number(mapping.conversionOffset) : null,
  };
}

/**
 * Konvertiert ein Prisma-Mapping mit Relationen für die API-Response
 */
function toApiResponseWithRelations(mapping: PrismaMappingWithRelationsResult): unknown {
  return {
    ...mapping,
    conversionFactor: mapping.conversionFactor ? Number(mapping.conversionFactor) : null,
    conversionOffset: mapping.conversionOffset ? Number(mapping.conversionOffset) : null,
  };
}

/**
 * Import Mapping Service
 */
export class ImportMappingService {
  /**
   * Gibt eine paginierte Liste von Mappings zurück
   */
  async list(query: ImportMappingListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where: Prisma.ImportMappingWhereInput = {
      ...(query.sourceId !== undefined && {
        sourceId: query.sourceId || null, // null für globale Mappings
      }),
      ...(query.mappingType && { mappingType: query.mappingType }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { sourceKey: { contains: query.search, mode: 'insensitive' } },
          { sourceValue: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Wenn includeGlobal=true und sourceId gesetzt, dann auch globale Mappings mitladen
    if (query.includeGlobal && query.sourceId) {
      where.OR = [
        { sourceId: query.sourceId },
        { sourceId: null }, // Globale Mappings
      ];
      delete where.sourceId;
    }

    const [mappings, total] = await Promise.all([
      prisma.importMapping.findMany({
        where,
        skip,
        take,
        orderBy: [
          { priority: 'desc' },
          { sourceKey: 'asc' },
        ],
        include: {
          source: {
            select: {
              id: true,
              name: true,
              slug: true,
              sourceType: true,
            },
          },
          targetAttribute: {
            select: {
              id: true,
              name: true,
              displayName: true,
              unit: true,
            },
          },
          targetCategory: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          targetManufacturer: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.importMapping.count({ where }),
    ]);

    return createPaginatedResponse(
      mappings.map(toApiResponseWithRelations),
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt nur globale Mappings zurück
   */
  async listGlobal(query: Omit<ImportMappingListQuery, 'sourceId' | 'includeGlobal'>) {
    return this.list({
      ...query,
      sourceId: undefined,
      includeGlobal: false,
    });
  }

  /**
   * Gibt ein Mapping nach ID zurück
   */
  async getById(id: string): Promise<unknown> {
    const mapping = await prisma.importMapping.findUnique({
      where: { id },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            slug: true,
            sourceType: true,
          },
        },
        targetAttribute: {
          select: {
            id: true,
            name: true,
            displayName: true,
            unit: true,
          },
        },
        targetCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        targetManufacturer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!mapping) {
      throw new NotFoundError('ImportMapping', id);
    }

    return toApiResponseWithRelations(mapping);
  }

  /**
   * Erstellt ein neues Mapping
   */
  async create(input: CreateImportMappingInput, userId?: string): Promise<ImportMappingResponse> {
    // Validierung: Prüfe ob Target existiert
    await this.validateTargets(input);

    try {
      const mapping = await prisma.importMapping.create({
        data: {
          sourceId: input.sourceId || null,
          mappingType: input.mappingType,
          sourceKey: input.sourceKey,
          sourceValue: input.sourceValue || null,
          targetAttributeId: input.targetAttributeId || null,
          targetCategoryId: input.targetCategoryId || null,
          targetManufacturerId: input.targetManufacturerId || null,
          conversionFactor: input.conversionFactor ?? null,
          conversionOffset: input.conversionOffset ?? null,
          parsePattern: input.parsePattern || null,
          priority: input.priority ?? 0,
          isActive: input.isActive ?? true,
          createdById: userId || null,
        },
      });

      return toApiResponse(mapping);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          `Ein Mapping für "${input.sourceKey}" mit gleichem Typ und Wert existiert bereits`
        );
      }
      throw error;
    }
  }

  /**
   * Erstellt mehrere Mappings auf einmal
   */
  async bulkCreate(input: BulkCreateMappingsInput, userId?: string): Promise<{ created: number; errors: string[] }> {
    const errors: string[] = [];
    let created = 0;

    // Validiere alle Targets zuerst
    for (const mapping of input.mappings) {
      try {
        await this.validateTargets(mapping);
      } catch (error) {
        errors.push(`${mapping.sourceKey}: ${error instanceof Error ? error.message : 'Validierungsfehler'}`);
      }
    }

    // Erstelle Mappings in Transaktion
    await prisma.$transaction(async (tx) => {
      for (const mappingInput of input.mappings) {
        try {
          await tx.importMapping.create({
            data: {
              sourceId: mappingInput.sourceId || null,
              mappingType: mappingInput.mappingType,
              sourceKey: mappingInput.sourceKey,
              sourceValue: mappingInput.sourceValue || null,
              targetAttributeId: mappingInput.targetAttributeId || null,
              targetCategoryId: mappingInput.targetCategoryId || null,
              targetManufacturerId: mappingInput.targetManufacturerId || null,
              conversionFactor: mappingInput.conversionFactor ?? null,
              conversionOffset: mappingInput.conversionOffset ?? null,
              parsePattern: mappingInput.parsePattern || null,
              priority: mappingInput.priority ?? 0,
              isActive: mappingInput.isActive ?? true,
              createdById: userId || null,
            },
          });
          created++;
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            errors.push(`${mappingInput.sourceKey}: Existiert bereits`);
          } else {
            throw error; // Bei anderen Fehlern Transaktion abbrechen
          }
        }
      }
    });

    return { created, errors };
  }

  /**
   * Aktualisiert ein Mapping
   */
  async update(id: string, input: UpdateImportMappingInput, _userId?: string): Promise<ImportMappingResponse> {
    const existing = await prisma.importMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('ImportMapping', id);
    }

    // Validierung falls Targets geändert werden
    if (input.targetAttributeId || input.targetCategoryId || input.targetManufacturerId) {
      await this.validateTargets({
        ...existing,
        ...input,
        mappingType: input.mappingType || existing.mappingType,
      } as CreateImportMappingInput);
    }

    try {
      const mapping = await prisma.importMapping.update({
        where: { id },
        data: {
          ...(input.sourceId !== undefined && { sourceId: input.sourceId || null }),
          ...(input.mappingType && { mappingType: input.mappingType }),
          ...(input.sourceKey && { sourceKey: input.sourceKey }),
          ...(input.sourceValue !== undefined && { sourceValue: input.sourceValue || null }),
          ...(input.targetAttributeId !== undefined && { targetAttributeId: input.targetAttributeId || null }),
          ...(input.targetCategoryId !== undefined && { targetCategoryId: input.targetCategoryId || null }),
          ...(input.targetManufacturerId !== undefined && { targetManufacturerId: input.targetManufacturerId || null }),
          ...(input.conversionFactor !== undefined && { conversionFactor: input.conversionFactor ?? null }),
          ...(input.conversionOffset !== undefined && { conversionOffset: input.conversionOffset ?? null }),
          ...(input.parsePattern !== undefined && { parsePattern: input.parsePattern || null }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      return toApiResponse(mapping);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(
          `Ein Mapping mit diesem Schlüssel und Typ existiert bereits`
        );
      }
      throw error;
    }
  }

  /**
   * Löscht ein Mapping
   */
  async delete(id: string): Promise<void> {
    const existing = await prisma.importMapping.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('ImportMapping', id);
    }

    await prisma.importMapping.delete({
      where: { id },
    });
  }

  /**
   * Findet das passende Mapping für einen Source-Key
   * Berücksichtigt Priorität und Source-spezifische vs. globale Mappings
   */
  async findMapping(
    sourceId: string | null,
    mappingType: ImportMappingType,
    sourceKey: string,
    sourceValue?: string
  ): Promise<unknown | null> {
    // Suche Mapping: Source-spezifisch hat Vorrang vor global
    const mappings = await prisma.importMapping.findMany({
      where: {
        mappingType,
        sourceKey: { equals: sourceKey, mode: 'insensitive' },
        ...(sourceValue && { sourceValue: { equals: sourceValue, mode: 'insensitive' } }),
        isActive: true,
        OR: sourceId ? [
          { sourceId }, // Source-spezifisch
          { sourceId: null }, // Global
        ] : [
          { sourceId: null }, // Nur global wenn keine Source angegeben
        ],
      },
      include: {
        source: true,
        targetAttribute: {
          select: {
            id: true,
            name: true,
            displayName: true,
            unit: true,
          },
        },
        targetCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        targetManufacturer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        // Source-spezifische Mappings zuerst
        { sourceId: { sort: 'desc', nulls: 'last' } },
        // Dann nach Priorität
        { priority: 'desc' },
      ],
      take: 1,
    });

    return mappings.length > 0 ? toApiResponseWithRelations(mappings[0]) : null;
  }

  /**
   * Gibt alle aktiven Mappings für eine Source zurück (inkl. globale)
   */
  async getActiveMappingsForSource(sourceId: string): Promise<unknown[]> {
    const mappings = await prisma.importMapping.findMany({
      where: {
        isActive: true,
        OR: [
          { sourceId },
          { sourceId: null },
        ],
      },
      include: {
        source: true,
        targetAttribute: {
          select: {
            id: true,
            name: true,
            displayName: true,
            unit: true,
          },
        },
        targetCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        targetManufacturer: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [
        { mappingType: 'asc' },
        { sourceId: { sort: 'desc', nulls: 'last' } },
        { priority: 'desc' },
        { sourceKey: 'asc' },
      ],
    });

    return mappings.map(toApiResponseWithRelations);
  }

  /**
   * Validiert die Target-Referenzen
   */
  private async validateTargets(input: CreateImportMappingInput): Promise<void> {
    // Prüfe ob Source existiert (falls angegeben)
    if (input.sourceId) {
      const source = await prisma.importSource.findUnique({
        where: { id: input.sourceId },
      });
      if (!source) {
        throw new ValidationError(`Import-Quelle mit ID "${input.sourceId}" nicht gefunden`);
      }
    }

    // Prüfe Targets basierend auf Mapping-Typ
    switch (input.mappingType) {
      case 'ATTRIBUTE':
        if (input.targetAttributeId) {
          const attr = await prisma.attributeDefinition.findUnique({
            where: { id: input.targetAttributeId },
          });
          if (!attr) {
            throw new ValidationError(`Attribut mit ID "${input.targetAttributeId}" nicht gefunden`);
          }
        }
        break;

      case 'CATEGORY':
        if (input.targetCategoryId) {
          const cat = await prisma.categoryTaxonomy.findUnique({
            where: { id: input.targetCategoryId },
          });
          if (!cat) {
            throw new ValidationError(`Kategorie mit ID "${input.targetCategoryId}" nicht gefunden`);
          }
        }
        break;

      case 'MANUFACTURER':
        if (input.targetManufacturerId) {
          const mfr = await prisma.manufacturerMaster.findUnique({
            where: { id: input.targetManufacturerId },
          });
          if (!mfr) {
            throw new ValidationError(`Hersteller mit ID "${input.targetManufacturerId}" nicht gefunden`);
          }
        }
        break;

      case 'UNIT':
        // Einheiten-Mappings benötigen keine Referenz-Validierung
        break;
    }
  }
}

// Singleton-Instanz
export const importMappingService = new ImportMappingService();
