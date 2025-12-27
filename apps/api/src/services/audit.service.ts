/**
 * Audit Service - Änderungstracking für alle Entitäten
 */

import { prisma } from '@electrovault/database';
import type {
  AuditLogQuery,
  EntityHistoryQuery,
  AuditLogEntry,
  AuditLogDetail,
  CreateAuditLogInput,
  AuditAction,
  ChangeDiff,
} from '@electrovault/schemas';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';

/**
 * Berechnet die Differenz zwischen zwei Objekten
 */
function calculateDiff(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): ChangeDiff[] {
  const changes: ChangeDiff[] = [];
  const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Ignoriere Metadaten-Felder
    if (['updatedAt', 'lastEditedById'].includes(key)) {
      continue;
    }

    // Vergleiche JSON-stringified Werte für Deep-Comparison
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
      });
    }
  }

  return changes;
}

/**
 * Audit Service
 */
export class AuditService {
  /**
   * Protokolliert eine Aktion
   */
  async log(input: CreateAuditLogInput): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes ? (input.changes as object) : undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Protokolliert eine CREATE-Aktion
   */
  async logCreate(
    entityType: string,
    entityId: string,
    data: Record<string, unknown>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'CREATE',
      entityType,
      entityId,
      changes: { created: data },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Protokolliert eine UPDATE-Aktion
   */
  async logUpdate(
    entityType: string,
    entityId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const diff = calculateDiff(oldData, newData);

    // Nur loggen wenn es tatsächlich Änderungen gibt
    if (diff.length === 0) {
      return;
    }

    await this.log({
      action: 'UPDATE',
      entityType,
      entityId,
      changes: { diff },
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Protokolliert eine DELETE-Aktion (Soft-Delete)
   */
  async logDelete(
    entityType: string,
    entityId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'DELETE',
      entityType,
      entityId,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Protokolliert eine RESTORE-Aktion
   */
  async logRestore(
    entityType: string,
    entityId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'RESTORE',
      entityType,
      entityId,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Protokolliert eine APPROVE-Aktion
   */
  async logApprove(
    entityType: string,
    entityId: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action: 'APPROVE',
      entityType,
      entityId,
      userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Gibt eine paginierte Liste von Audit-Logs zurück
   */
  async list(query: AuditLogQuery) {
    const { skip, take } = getPrismaOffsets(query);

    const where = {
      ...(query.userId && { userId: query.userId }),
      ...(query.action && { action: query.action }),
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.fromDate && { createdAt: { gte: query.fromDate } }),
      ...(query.toDate && { createdAt: { lte: query.toDate } }),
    };

    const orderBy = query.sortBy
      ? { [query.sortBy]: query.sortOrder }
      : { createdAt: 'desc' as const };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return createPaginatedResponse(
      logs as unknown as AuditLogEntry[],
      query.page,
      query.limit,
      total
    );
  }

  /**
   * Gibt die History einer einzelnen Entität zurück
   */
  async getEntityHistory(query: EntityHistoryQuery): Promise<AuditLogDetail[]> {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: query.entityType,
        entityId: query.entityId,
      },
      take: query.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    // Parse changes und füge parsedChanges hinzu
    return logs.map((log) => {
      const changes = log.changes as Record<string, unknown> | null;
      let parsedChanges: ChangeDiff[] | undefined;

      if (changes && 'diff' in changes && Array.isArray(changes.diff)) {
        parsedChanges = changes.diff as ChangeDiff[];
      }

      return {
        ...log,
        parsedChanges,
      } as unknown as AuditLogDetail;
    });
  }

  /**
   * Gibt die letzten Aktivitäten eines Users zurück
   */
  async getUserActivity(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return logs as unknown as AuditLogEntry[];
  }

  /**
   * Gibt Statistiken für eine Zeitperiode zurück
   */
  async getStats(fromDate?: Date, toDate?: Date): Promise<{
    totalActions: number;
    byAction: Record<AuditAction, number>;
    byEntityType: Record<string, number>;
    topContributors: Array<{ userId: string; username: string; count: number }>;
  }> {
    const where = {
      ...(fromDate && { createdAt: { gte: fromDate } }),
      ...(toDate && { createdAt: { lte: toDate } }),
    };

    // Gesamtanzahl
    const totalActions = await prisma.auditLog.count({ where });

    // Nach Aktion gruppieren
    const byActionRaw = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    });

    const byAction = byActionRaw.reduce(
      (acc, item) => {
        acc[item.action as AuditAction] = item._count;
        return acc;
      },
      {} as Record<AuditAction, number>
    );

    // Nach Entity-Type gruppieren
    const byEntityTypeRaw = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
    });

    const byEntityType = byEntityTypeRaw.reduce(
      (acc, item) => {
        acc[item.entityType] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Top Contributors
    const topContributorsRaw = await prisma.auditLog.groupBy({
      by: ['userId'],
      where: {
        ...where,
        userId: { not: null },
      },
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    });

    // User-Details laden
    const userIds = topContributorsRaw
      .map((c) => c.userId)
      .filter((id): id is string => id !== null);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.username]));

    const topContributors = topContributorsRaw
      .filter((c) => c.userId !== null)
      .map((c) => ({
        userId: c.userId!,
        username: userMap.get(c.userId!) || 'Unknown',
        count: c._count,
      }));

    return {
      totalActions,
      byAction,
      byEntityType,
      topContributors,
    };
  }
}

// Singleton-Export
export const auditService = new AuditService();
