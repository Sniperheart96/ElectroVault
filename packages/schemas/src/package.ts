/**
 * Package Schemas - Bauformen/Gehäuse API Schemas
 */
import { z } from 'zod';
import {
  UUIDSchema,
  SlugSchema,
  PaginationSchema,
  SortSchema,
  MountingTypeSchema,
  LocalizedStringSchema,
  LocalizedStringNullableSchema,
  LocalizedStringNullableOptionalSchema,
} from './common';

// ============================================
// PACKAGE GROUP SCHEMAS
// ============================================

/**
 * Basis-PackageGroup
 */
export const PackageGroupBaseSchema = z.object({
  id: UUIDSchema,
  name: LocalizedStringSchema,
  slug: z.string(),
  description: LocalizedStringNullableSchema,
  sortOrder: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PackageGroupBase = z.infer<typeof PackageGroupBaseSchema>;

/**
 * PackageGroup mit Package-Count (für Sidebar)
 */
export const PackageGroupWithCountSchema = PackageGroupBaseSchema.extend({
  _count: z
    .object({
      packages: z.number(),
    })
    .optional(),
});

export type PackageGroupWithCount = z.infer<typeof PackageGroupWithCountSchema>;

/**
 * Input für neue PackageGroup
 */
export const CreatePackageGroupSchema = z.object({
  name: LocalizedStringSchema,
  slug: SlugSchema.optional(),
  description: LocalizedStringNullableOptionalSchema,
  sortOrder: z.number().int().optional(),
});

export type CreatePackageGroupInput = z.infer<typeof CreatePackageGroupSchema>;

/**
 * Input für PackageGroup-Update
 */
export const UpdatePackageGroupSchema = CreatePackageGroupSchema.partial();

export type UpdatePackageGroupInput = z.infer<typeof UpdatePackageGroupSchema>;

/**
 * Query-Parameter für PackageGroup-Liste
 */
export const PackageGroupListQuerySchema = PaginationSchema.merge(SortSchema);

export type PackageGroupListQuery = z.infer<typeof PackageGroupListQuerySchema>;

// ============================================
// PACKAGE RESPONSE SCHEMAS
// ============================================

/**
 * Basis-Package
 */
export const PackageBaseSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  slug: z.string(),
  groupId: z.string().uuid().nullable(),
  group: PackageGroupBaseSchema.optional(),
  lengthMm: z.number().nullable(),
  widthMm: z.number().nullable(),
  heightMm: z.number().nullable(),
  pitchMm: z.number().nullable(),
  mountingType: MountingTypeSchema,
  pinCount: z.number().nullable(),
  pinCountMin: z.number().nullable(),
  pinCountMax: z.number().nullable(),
  jedecStandard: z.string().nullable(),
  eiaStandard: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PackageBase = z.infer<typeof PackageBaseSchema>;

/**
 * ECAD Footprint
 */
export const EcadFootprintSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  ecadFormat: z.enum(['KICAD', 'EAGLE', 'ALTIUM', 'ORCAD', 'STEP', 'OTHER']),
  fileUrl: z.string(),
  ipcName: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type EcadFootprint = z.infer<typeof EcadFootprintSchema>;

/**
 * Package mit ECAD Footprints
 */
export const PackageWithFootprintsSchema = PackageBaseSchema.extend({
  ecadFootprints: z.array(EcadFootprintSchema),
});

export type PackageWithFootprints = z.infer<typeof PackageWithFootprintsSchema>;

// ============================================
// PACKAGE INPUT SCHEMAS
// ============================================

/**
 * Input für neues Package
 */
export const CreatePackageSchema = z.object({
  name: z.string().min(1).max(255),
  slug: SlugSchema.optional(), // Auto-generiert wenn nicht angegeben
  groupId: z.string().uuid().optional().nullable(),
  lengthMm: z.number().positive().optional(),
  widthMm: z.number().positive().optional(),
  heightMm: z.number().positive().optional(),
  pitchMm: z.number().positive().optional(),
  mountingType: MountingTypeSchema,
  pinCount: z.number().int().positive().optional(),
  pinCountMin: z.number().int().positive().optional(),
  pinCountMax: z.number().int().positive().optional(),
  jedecStandard: z.string().max(100).optional(),
  eiaStandard: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

export type CreatePackageInput = z.infer<typeof CreatePackageSchema>;

/**
 * Input für Package-Update
 */
export const UpdatePackageSchema = CreatePackageSchema.partial();

export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>;

/**
 * Input für ECAD Footprint
 */
export const CreateFootprintSchema = z.object({
  name: z.string().min(1).max(255),
  ecadFormat: z.enum(['KICAD', 'EAGLE', 'ALTIUM', 'ORCAD', 'STEP', 'OTHER']),
  fileUrl: z.string().url().max(512),
  ipcName: z.string().max(255).optional(),
});

export type CreateFootprintInput = z.infer<typeof CreateFootprintSchema>;

// ============================================
// PACKAGE QUERY SCHEMAS
// ============================================

/**
 * Query-Parameter für Package-Liste
 */
export const PackageListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  groupId: z.string().uuid().optional(),
  mountingType: MountingTypeSchema.optional(),
  pinCount: z.coerce.number().int().positive().optional(),
  minPinCount: z.coerce.number().int().positive().optional(),
  maxPinCount: z.coerce.number().int().positive().optional(),
  search: z.string().max(100).optional(),
});

export type PackageListQuery = z.infer<typeof PackageListQuerySchema>;
