/**
 * Moderation Service - Verwaltung der Moderations-Queue
 */

import { prisma } from '@electrovault/database';
import type { PaginationInput } from '@electrovault/schemas';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';

// ============================================
// INTERFACES
// ============================================

export interface ModerationAction {
  componentId: string;
  action: 'APPROVE' | 'REJECT';
  comment?: string;
  moderatorId: string;
}

export interface PartModerationAction {
  partId: string;
  action: 'APPROVE' | 'REJECT';
  comment?: string;
  moderatorId: string;
}

export interface QueueStats {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface PendingItem {
  id: string;
  type: 'COMPONENT' | 'PART';
  name: unknown; // JsonValue from Prisma
  status: string;
  createdAt: Date;
  createdBy: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
}

// ============================================
// MODERATION SERVICE
// ============================================

export class ModerationService {
  /**
   * Gibt alle PENDING Components zurück
   */
  async getPendingComponents(query: PaginationInput) {
    const { skip, take } = getPrismaOffsets(query);

    const [components, total] = await Promise.all([
      prisma.coreComponent.findMany({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' }, // Älteste zuerst
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.coreComponent.count({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
      }),
    ]);

    return createPaginatedResponse(components, query.page, query.limit, total);
  }

  /**
   * Gibt alle PENDING Parts zurück
   */
  async getPendingParts(query: PaginationInput) {
    const { skip, take } = getPrismaOffsets(query);

    const [parts, total] = await Promise.all([
      prisma.manufacturerPart.findMany({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
        skip,
        take,
        orderBy: { createdAt: 'asc' }, // Älteste zuerst
        include: {
          coreComponent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          manufacturer: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          package: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.manufacturerPart.count({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
      }),
    ]);

    return createPaginatedResponse(parts, query.page, query.limit, total);
  }

  /**
   * Gibt eine kombinierte Queue zurück (Components + Parts)
   */
  async getCombinedQueue(query: PaginationInput) {
    // Alle PENDING Items holen (ohne Paginierung für Sortierung)
    const [components, parts] = await Promise.all([
      prisma.coreComponent.findMany({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
      prisma.manufacturerPart.findMany({
        where: {
          status: 'PENDING',
          deletedAt: null,
        },
        orderBy: { createdAt: 'asc' },
        include: {
          coreComponent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          manufacturer: {
            select: {
              id: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
        },
      }),
    ]);

    // In einheitliches Format transformieren
    const items: PendingItem[] = [
      ...components.map((c) => ({
        id: c.id,
        type: 'COMPONENT' as const,
        name: c.name,
        status: c.status,
        createdAt: c.createdAt,
        createdBy: c.createdBy,
        category: c.category,
      })),
      ...parts.map((p) => ({
        id: p.id,
        type: 'PART' as const,
        name: p.mpn,
        status: p.status,
        createdAt: p.createdAt,
        createdBy: p.createdBy,
        coreComponent: p.coreComponent,
        manufacturer: p.manufacturer,
      })),
    ];

    // Nach Datum sortieren
    items.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Manuell paginieren
    const { skip, take } = getPrismaOffsets(query);
    const paginatedItems = items.slice(skip, skip + take);

    return createPaginatedResponse(paginatedItems, query.page, query.limit, items.length);
  }

  /**
   * Moderiert ein Component (Approve/Reject)
   */
  async moderateComponent(action: ModerationAction) {
    const { componentId, action: actionType, comment, moderatorId } = action;

    // Component holen
    const component = await prisma.coreComponent.findUnique({
      where: { id: componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundError('Component', componentId);
    }

    if (component.status !== 'PENDING') {
      throw new BadRequestError(
        `Component must be in PENDING status (current: ${component.status})`
      );
    }

    const newStatus = actionType === 'APPROVE' ? 'PUBLISHED' : 'ARCHIVED';

    // Transaktion: Component aktualisieren + ModerationLog erstellen
    const result = await prisma.$transaction(async (tx) => {
      // Component-Status aktualisieren
      const updated = await tx.coreComponent.update({
        where: { id: componentId },
        data: {
          status: newStatus,
          lastEditedById: moderatorId,
        },
        include: {
          category: true,
        },
      });

      // ModerationLog erstellen
      await tx.moderationLog.create({
        data: {
          entityType: 'COMPONENT',
          entityId: componentId,
          action: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          previousStatus: 'PENDING',
          newStatus,
          comment: comment || null,
          moderatorId,
        },
      });

      // AuditLog erstellen
      await tx.auditLog.create({
        data: {
          userId: moderatorId,
          action: actionType === 'APPROVE' ? 'APPROVE' : 'REJECT',
          entityType: 'CoreComponent',
          entityId: componentId,
          changes: {
            status: { from: 'PENDING', to: newStatus },
            comment,
          },
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Moderiert ein Part (Approve/Reject)
   */
  async moderatePart(action: PartModerationAction) {
    const { partId, action: actionType, comment, moderatorId } = action;

    // Part holen
    const part = await prisma.manufacturerPart.findUnique({
      where: { id: partId, deletedAt: null },
    });

    if (!part) {
      throw new NotFoundError('Part', partId);
    }

    if (part.status !== 'PENDING') {
      throw new BadRequestError(`Part must be in PENDING status (current: ${part.status})`);
    }

    const newStatus = actionType === 'APPROVE' ? 'PUBLISHED' : 'ARCHIVED';

    // Transaktion: Part aktualisieren + ModerationLog erstellen
    const result = await prisma.$transaction(async (tx) => {
      // Part-Status aktualisieren
      const updated = await tx.manufacturerPart.update({
        where: { id: partId },
        data: {
          status: newStatus,
          lastEditedById: moderatorId,
        },
        include: {
          coreComponent: true,
          manufacturer: true,
          package: true,
        },
      });

      // ModerationLog erstellen
      await tx.moderationLog.create({
        data: {
          entityType: 'PART',
          entityId: partId,
          action: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          previousStatus: 'PENDING',
          newStatus,
          comment: comment || null,
          moderatorId,
        },
      });

      // AuditLog erstellen
      await tx.auditLog.create({
        data: {
          userId: moderatorId,
          action: actionType === 'APPROVE' ? 'APPROVE' : 'REJECT',
          entityType: 'ManufacturerPart',
          entityId: partId,
          changes: {
            status: { from: 'PENDING', to: newStatus },
            comment,
          },
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * Batch-Approve für mehrere Components
   */
  async batchApprove(componentIds: string[], moderatorId: string): Promise<number> {
    let count = 0;

    for (const componentId of componentIds) {
      try {
        await this.moderateComponent({
          componentId,
          action: 'APPROVE',
          moderatorId,
        });
        count++;
      } catch (error) {
        // Fehler loggen aber weitermachen
        console.error(`Failed to approve component ${componentId}:`, error);
      }
    }

    return count;
  }

  /**
   * Batch-Reject für mehrere Components
   */
  async batchReject(
    componentIds: string[],
    comment: string,
    moderatorId: string
  ): Promise<number> {
    let count = 0;

    for (const componentId of componentIds) {
      try {
        await this.moderateComponent({
          componentId,
          action: 'REJECT',
          comment,
          moderatorId,
        });
        count++;
      } catch (error) {
        // Fehler loggen aber weitermachen
        console.error(`Failed to reject component ${componentId}:`, error);
      }
    }

    return count;
  }

  /**
   * Statistiken für die Queue
   */
  async getQueueStats(): Promise<QueueStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, approvedToday, rejectedToday] = await Promise.all([
      // Pending: Components + Parts
      prisma.coreComponent
        .count({
          where: { status: 'PENDING', deletedAt: null },
        })
        .then(
          async (componentCount) =>
            componentCount +
            (await prisma.manufacturerPart.count({
              where: { status: 'PENDING', deletedAt: null },
            }))
        ),

      // Approved today
      prisma.moderationLog.count({
        where: {
          action: 'APPROVED',
          createdAt: { gte: today },
        },
      }),

      // Rejected today
      prisma.moderationLog.count({
        where: {
          action: 'REJECTED',
          createdAt: { gte: today },
        },
      }),
    ]);

    return {
      pending,
      approvedToday,
      rejectedToday,
    };
  }
}

// Singleton-Export
export const moderationService = new ModerationService();
