/**
 * Manufacturer Schemas - Hersteller API Schemas
 */
import { z } from 'zod';
import {
  LocalizedStringNullableSchema,
  LocalizedStringNullableOptionalSchema,
  UUIDSchema,
  SlugSchema,
  PaginationSchema,
  SortSchema,
  ManufacturerStatusSchema,
} from './common';

// ============================================
// MANUFACTURER RESPONSE SCHEMAS
// ============================================

/**
 * Manufacturer Alias
 */
export const ManufacturerAliasSchema = z.object({
  id: UUIDSchema,
  aliasName: z.string(),
  aliasType: z.string().nullable(),
});

export type ManufacturerAlias = z.infer<typeof ManufacturerAliasSchema>;

/**
 * Basis-Hersteller
 */
export const ManufacturerBaseSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  slug: z.string(),
  cageCode: z.string().nullable(),
  countryCode: z.string().nullable(),
  website: z.string().nullable(),
  logoUrl: z.string().nullable(),
  status: ManufacturerStatusSchema,
  foundedYear: z.number().nullable(),
  defunctYear: z.number().nullable(),
  description: LocalizedStringNullableSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ManufacturerBase = z.infer<typeof ManufacturerBaseSchema>;

/**
 * Hersteller mit Aliassen
 */
export const ManufacturerWithAliasesSchema = ManufacturerBaseSchema.extend({
  aliases: z.array(ManufacturerAliasSchema),
});

export type ManufacturerWithAliases = z.infer<typeof ManufacturerWithAliasesSchema>;

/**
 * Hersteller mit Akquisitionshistorie
 */
export const ManufacturerFullSchema = ManufacturerWithAliasesSchema.extend({
  acquiredById: UUIDSchema.nullable(),
  acquiredBy: ManufacturerBaseSchema.nullable(),
  acquisitions: z.array(ManufacturerBaseSchema),
  acquisitionDate: z.coerce.date().nullable(),
});

export type ManufacturerFull = z.infer<typeof ManufacturerFullSchema>;

// ============================================
// MANUFACTURER INPUT SCHEMAS
// ============================================

/**
 * Input für neuen Hersteller
 */
export const CreateManufacturerSchema = z.object({
  name: z.string().min(1).max(255),
  slug: SlugSchema.optional(), // Auto-generiert wenn nicht angegeben
  cageCode: z.string().max(5).optional(),
  countryCode: z.string().length(2).optional(),
  website: z.string().url().max(512).optional(),
  logoUrl: z.string().url().max(512).optional(),
  status: ManufacturerStatusSchema.default('ACTIVE'),
  foundedYear: z.number().int().min(1800).max(2100).optional(),
  defunctYear: z.number().int().min(1800).max(2100).optional(),
  description: LocalizedStringNullableOptionalSchema,
  aliases: z
    .array(
      z.object({
        aliasName: z.string().min(1).max(255),
        aliasType: z.string().max(50).optional(),
      })
    )
    .optional(),
});

export type CreateManufacturerInput = z.infer<typeof CreateManufacturerSchema>;

/**
 * Input für Hersteller-Update
 */
export const UpdateManufacturerSchema = CreateManufacturerSchema.partial().extend({
  acquiredById: UUIDSchema.optional(),
  acquisitionDate: z.coerce.date().optional(),
});

export type UpdateManufacturerInput = z.infer<typeof UpdateManufacturerSchema>;

// ============================================
// MANUFACTURER QUERY SCHEMAS
// ============================================

/**
 * Query-Parameter für Hersteller-Liste
 */
export const ManufacturerListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  status: ManufacturerStatusSchema.optional(),
  countryCode: z.string().length(2).optional(),
  search: z.string().max(100).optional(),
  includeAcquired: z.coerce.boolean().default(true),
});

export type ManufacturerListQuery = z.infer<typeof ManufacturerListQuerySchema>;
