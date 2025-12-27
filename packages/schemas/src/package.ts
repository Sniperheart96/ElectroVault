/**
 * Package Schemas - Bauformen/Gehäuse API Schemas
 */
import { z } from 'zod';
import { UUIDSchema, SlugSchema, PaginationSchema, SortSchema, MountingTypeSchema } from './common';

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
  drawingUrl: z.string().nullable(),
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
  drawingUrl: z.string().url().max(512).optional(),
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
  mountingType: MountingTypeSchema.optional(),
  pinCount: z.coerce.number().int().positive().optional(),
  minPinCount: z.coerce.number().int().positive().optional(),
  maxPinCount: z.coerce.number().int().positive().optional(),
  search: z.string().max(100).optional(),
});

export type PackageListQuery = z.infer<typeof PackageListQuerySchema>;
