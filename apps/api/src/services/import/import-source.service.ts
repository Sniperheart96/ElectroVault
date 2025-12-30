/**
 * Import Source Service - Distributor-Quellen verwalten
 */

import { prisma, Prisma, type ImportSourceType } from '@electrovault/database';
import type {
  ImportSourceListQuery,
  CreateImportSourceInput,
  UpdateImportSourceInput,
  ImportSource,
  ImportSourceWithStats,
} from '@electrovault/schemas';
import { NotFoundError, ConflictError } from '../../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../../lib/pagination';
import { generateSlug } from '../../lib/slug';
import { encrypt, decrypt } from '../../lib/crypto';

/**
 * Generiert einen einzigartigen Slug mit DB-Check
 */
async function generateUniqueSlugForSource(
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.importSource.findFirst({
      where: {
        slug,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Import Source Service
 */
export class ImportSourceService {
  /**
   * Gibt eine paginierte Liste von Import-Quellen zurück
   */
  async list(query: ImportSourceListQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where: Prisma.ImportSourceWhereInput = {
      ...(query.sourceType && { sourceType: query.sourceType }),
      ...(query.isActive !== undefined && { isActive: query.isActive }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [sources, total] = await Promise.all([
      prisma.importSource.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: {
              mappings: true,
              jobs: true,
              unmappedAttributes: true,
            },
          },
        },
      }),
      prisma.importSource.count({ where }),
    ]);

    // API-Keys NICHT zurückgeben
    const sanitized = sources.map((s) => ({
      ...s,
      apiKeyEncrypted: null,
      apiSecretEncrypted: null,
    }));

    return createPaginatedResponse(
      sanitized as ImportSourceWithStats[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt eine Import-Quelle nach ID zurück
   */
  async getById(id: string): Promise<ImportSourceWithStats> {
    const source = await prisma.importSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            mappings: true,
            jobs: true,
            unmappedAttributes: true,
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundError('ImportSource', id);
    }

    // API-Keys NICHT zurückgeben
    return {
      ...source,
      apiKeyEncrypted: null,
      apiSecretEncrypted: null,
    } as ImportSourceWithStats;
  }

  /**
   * Gibt eine Import-Quelle nach Slug zurück
   */
  async getBySlug(slug: string): Promise<ImportSourceWithStats> {
    const source = await prisma.importSource.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            mappings: true,
            jobs: true,
            unmappedAttributes: true,
          },
        },
      },
    });

    if (!source) {
      throw new NotFoundError('ImportSource', slug);
    }

    return {
      ...source,
      apiKeyEncrypted: null,
      apiSecretEncrypted: null,
    } as ImportSourceWithStats;
  }

  /**
   * Erstellt eine neue Import-Quelle
   */
  async create(input: CreateImportSourceInput, userId?: string): Promise<ImportSource> {
    // Slug generieren falls nicht angegeben
    const baseSlug = input.slug || generateSlug(input.name);
    const slug = await generateUniqueSlugForSource(baseSlug);

    // API-Keys verschlüsseln
    const apiKeyEncrypted = input.apiKey ? encrypt(input.apiKey) : null;
    const apiSecretEncrypted = input.apiSecret ? encrypt(input.apiSecret) : null;

    try {
      const source = await prisma.importSource.create({
        data: {
          name: input.name,
          slug,
          sourceType: input.sourceType,
          apiBaseUrl: input.apiBaseUrl || null,
          apiKeyEncrypted,
          apiSecretEncrypted,
          // Rate Limiting
          rateLimitPerSecond: input.rateLimitPerSecond || null,
          rateLimitPerMinute: input.rateLimitPerMinute ?? 60,
          rateLimitPerDay: input.rateLimitPerDay || null,
          maxResultsPerRequest: input.maxResultsPerRequest || null,
          description: input.description || null,
          isActive: input.isActive ?? true,
          createdById: userId || null,
        },
      });

      return {
        ...source,
        apiKeyEncrypted: null,
        apiSecretEncrypted: null,
      } as ImportSource;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(`Import-Quelle mit Slug "${slug}" existiert bereits`);
      }
      throw error;
    }
  }

  /**
   * Aktualisiert eine Import-Quelle
   */
  async update(
    id: string,
    input: UpdateImportSourceInput,
    userId?: string
  ): Promise<ImportSource> {
    const existing = await prisma.importSource.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('ImportSource', id);
    }

    // Slug aktualisieren falls angegeben
    let slug = existing.slug;
    if (input.slug && input.slug !== existing.slug) {
      slug = await generateUniqueSlugForSource(input.slug, id);
    } else if (input.name && input.name !== existing.name && !input.slug) {
      // Slug basierend auf neuem Namen generieren
      slug = await generateUniqueSlugForSource(generateSlug(input.name), id);
    }

    // API-Keys behandeln
    let apiKeyEncrypted = existing.apiKeyEncrypted;
    let apiSecretEncrypted = existing.apiSecretEncrypted;

    if (input.apiKey !== undefined) {
      apiKeyEncrypted = input.apiKey ? encrypt(input.apiKey) : null;
    }
    if (input.apiSecret !== undefined) {
      apiSecretEncrypted = input.apiSecret ? encrypt(input.apiSecret) : null;
    }

    try {
      const source = await prisma.importSource.update({
        where: { id },
        data: {
          ...(input.name && { name: input.name }),
          slug,
          ...(input.sourceType && { sourceType: input.sourceType }),
          ...(input.apiBaseUrl !== undefined && { apiBaseUrl: input.apiBaseUrl || null }),
          apiKeyEncrypted,
          apiSecretEncrypted,
          // Rate Limiting
          ...(input.rateLimitPerSecond !== undefined && { rateLimitPerSecond: input.rateLimitPerSecond || null }),
          ...(input.rateLimitPerMinute !== undefined && { rateLimitPerMinute: input.rateLimitPerMinute }),
          ...(input.rateLimitPerDay !== undefined && { rateLimitPerDay: input.rateLimitPerDay || null }),
          ...(input.maxResultsPerRequest !== undefined && { maxResultsPerRequest: input.maxResultsPerRequest || null }),
          ...(input.description !== undefined && { description: input.description || null }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
      });

      return {
        ...source,
        apiKeyEncrypted: null,
        apiSecretEncrypted: null,
      } as ImportSource;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError(`Import-Quelle mit Slug "${slug}" existiert bereits`);
      }
      throw error;
    }
  }

  /**
   * Löscht eine Import-Quelle
   */
  async delete(id: string): Promise<void> {
    const existing = await prisma.importSource.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('ImportSource', id);
    }

    // Prüfen ob Jobs existieren
    if (existing._count.jobs > 0) {
      throw new ConflictError(
        `Import-Quelle kann nicht gelöscht werden, da ${existing._count.jobs} Import-Jobs existieren. ` +
        `Bitte erst die Jobs löschen oder die Quelle deaktivieren.`
      );
    }

    await prisma.importSource.delete({
      where: { id },
    });
  }

  /**
   * Testet die Verbindung zu einer API-Quelle
   */
  async testConnection(id: string): Promise<{ success: boolean; message: string; details?: unknown }> {
    const source = await prisma.importSource.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundError('ImportSource', id);
    }

    // Nur API-Quellen können getestet werden
    if (!source.sourceType.startsWith('API_')) {
      return {
        success: true,
        message: 'Datei-Import-Quellen benötigen keinen Verbindungstest',
      };
    }

    // API-Key entschlüsseln
    const apiKey = source.apiKeyEncrypted ? decrypt(source.apiKeyEncrypted) : null;
    const apiSecret = source.apiSecretEncrypted ? decrypt(source.apiSecretEncrypted) : null;

    if (!source.apiBaseUrl) {
      return {
        success: false,
        message: 'Keine API-URL konfiguriert',
      };
    }

    if (!apiKey) {
      return {
        success: false,
        message: 'Kein API-Key konfiguriert',
      };
    }

    // TODO: Implementiere tatsächliche API-Tests je nach sourceType
    // Für jetzt: Einfacher HTTP-Test
    try {
      const response = await fetch(source.apiBaseUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(10000), // 10 Sekunden Timeout
      });

      if (response.ok || response.status === 401 || response.status === 403) {
        // 401/403 bedeutet zumindest dass der Server erreichbar ist
        return {
          success: response.ok,
          message: response.ok
            ? 'Verbindung erfolgreich'
            : `Server erreichbar, aber Authentifizierung fehlgeschlagen (${response.status})`,
          details: {
            status: response.status,
            statusText: response.statusText,
          },
        };
      }

      return {
        success: false,
        message: `Server-Fehler: ${response.status} ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Verbindungsfehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
      };
    }
  }

  /**
   * Gibt die entschlüsselten API-Credentials zurück (nur für internen Gebrauch!)
   */
  async getCredentials(id: string): Promise<{ apiKey: string | null; apiSecret: string | null }> {
    const source = await prisma.importSource.findUnique({
      where: { id },
      select: {
        apiKeyEncrypted: true,
        apiSecretEncrypted: true,
      },
    });

    if (!source) {
      throw new NotFoundError('ImportSource', id);
    }

    return {
      apiKey: source.apiKeyEncrypted ? decrypt(source.apiKeyEncrypted) : null,
      apiSecret: source.apiSecretEncrypted ? decrypt(source.apiSecretEncrypted) : null,
    };
  }
}

// Singleton-Instanz
export const importSourceService = new ImportSourceService();
