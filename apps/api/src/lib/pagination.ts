/**
 * Pagination Utilities - Hilfsfunktionen für Paginierung
 */

import type { PaginationInput } from '@electrovault/schemas';

/**
 * Berechnet skip und take für Prisma aus Pagination-Input
 */
export function getPrismaOffsets(pagination: PaginationInput): {
  skip: number;
  take: number;
} {
  return {
    skip: (pagination.page - 1) * pagination.limit,
    take: pagination.limit,
  };
}

/**
 * Erstellt Pagination-Metadaten für die Antwort
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Erstellt eine paginierte Antwort
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
}
