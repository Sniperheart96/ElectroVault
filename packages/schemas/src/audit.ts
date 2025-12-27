/**
 * Audit Schemas - AuditLog API Schemas
 */
import { z } from 'zod';
import { UUIDSchema, PaginationSchema, SortSchema, AuditActionSchema } from './common';

// ============================================
// AUDIT LOG RESPONSE SCHEMAS
// ============================================

/**
 * AuditLog Entry
 */
export const AuditLogEntrySchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema.nullable(),
  user: z
    .object({
      id: UUIDSchema,
      username: z.string(),
      displayName: z.string().nullable(),
    })
    .nullable(),
  action: AuditActionSchema,
  entityType: z.string(),
  entityId: UUIDSchema,
  changes: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/**
 * Change Diff Schema
 */
export const ChangeDiffSchema = z.object({
  field: z.string(),
  oldValue: z.unknown(),
  newValue: z.unknown(),
});

export type ChangeDiff = z.infer<typeof ChangeDiffSchema>;

/**
 * Detaillierter AuditLog mit Changes
 */
export const AuditLogDetailSchema = AuditLogEntrySchema.extend({
  parsedChanges: z.array(ChangeDiffSchema).optional(),
});

export type AuditLogDetail = z.infer<typeof AuditLogDetailSchema>;

// ============================================
// AUDIT LOG INPUT SCHEMAS
// ============================================

/**
 * Input für AuditLog-Erstellung (intern)
 */
export const CreateAuditLogSchema = z.object({
  userId: UUIDSchema.optional(),
  action: AuditActionSchema,
  entityType: z.string().min(1).max(100),
  entityId: UUIDSchema,
  changes: z.record(z.unknown()).optional(),
  ipAddress: z.string().max(45).optional(),
  userAgent: z.string().max(512).optional(),
});

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>;

// ============================================
// AUDIT LOG QUERY SCHEMAS
// ============================================

/**
 * Query-Parameter für AuditLog-Liste
 */
export const AuditLogQuerySchema = PaginationSchema.merge(SortSchema).extend({
  userId: UUIDSchema.optional(),
  action: AuditActionSchema.optional(),
  entityType: z.string().optional(),
  entityId: UUIDSchema.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

/**
 * Entity History Query
 */
export const EntityHistoryQuerySchema = z.object({
  entityType: z.string(),
  entityId: UUIDSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type EntityHistoryQuery = z.infer<typeof EntityHistoryQuerySchema>;
