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
  ComponentStatusSchema,
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
  moderationStatus: ComponentStatusSchema, // Moderations-Workflow (DRAFT/PENDING/PUBLISHED)
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
  // logoUrl kann eine normale URL oder eine Data-URL (base64) sein
  logoUrl: z.string().refine(
    (val) => {
      if (!val) return true;
      // Erlaube Data-URLs (base64 encoded images)
      if (val.startsWith('data:image/')) return true;
      // Erlaube normale URLs
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Ungültige URL oder Data-URL' }
  ).optional(),
  status: ManufacturerStatusSchema.default('ACTIVE'),
  // moderationStatus wird vom Backend gesetzt, NICHT manuell
  saveAsDraft: z.boolean().optional(), // NEU: Als Entwurf speichern
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
  // NEU: Eigene Entwuerfe einbeziehen (nur fuer eingeloggte User)
  includeDrafts: z.coerce.boolean().optional(),
  // userId wird vom Backend gesetzt
  userId: UUIDSchema.optional(),
});

export type ManufacturerListQuery = z.infer<typeof ManufacturerListQuerySchema>;
