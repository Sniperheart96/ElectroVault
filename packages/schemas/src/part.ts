/**
 * Part Schemas - ManufacturerPart API Schemas
 */
import { z } from 'zod';
import {
  LocalizedStringSchema,
  LocalizedStringNullableSchema,
  LocalizedStringNullableOptionalSchema,
  UUIDSchema,
  PaginationSchema,
  SortSchema,
  PartStatusSchema,
  LifecycleStatusSchema,
  RelationshipTypeSchema,
  HazardousMaterialTypeSchema,
  PinTypeSchema,
} from './common';
import { ManufacturerBaseSchema } from './manufacturer';
import { PackageBaseSchema } from './package';
import { ComponentBaseSchema, CreateAttributeValueSchema, SIPrefixSchema } from './component';

// ============================================
// PART SUB-SCHEMAS
// ============================================

/**
 * Gefahrstoff
 */
export const HazardousMaterialSchema = z.object({
  id: UUIDSchema,
  materialType: HazardousMaterialTypeSchema,
  details: LocalizedStringNullableSchema,
});

export type HazardousMaterial = z.infer<typeof HazardousMaterialSchema>;

/**
 * Pin-Mapping
 */
export const PinMappingSchema = z.object({
  id: UUIDSchema,
  pinNumber: z.string(),
  pinName: z.string(),
  pinFunction: LocalizedStringNullableSchema,
  pinType: PinTypeSchema.nullable(),
  maxVoltage: z.number().nullable(),
  maxCurrent: z.number().nullable(),
});

export type PinMapping = z.infer<typeof PinMappingSchema>;

/**
 * Part Attribute Value
 */
export const PartAttributeValueSchema = z.object({
  id: UUIDSchema,
  definitionId: UUIDSchema,
  // Numerische Werte (immer in SI-Basiseinheit)
  normalizedValue: z.number().nullable(),
  normalizedMin: z.number().nullable(),
  normalizedMax: z.number().nullable(),
  // SI-Präfix für Anzeige
  prefix: SIPrefixSchema.nullable(),
  // Für STRING-Typ
  stringValue: z.string().nullable(),
  isDeviation: z.boolean(),
});

export type PartAttributeValue = z.infer<typeof PartAttributeValueSchema>;

/**
 * Part-Beziehung
 */
export const PartRelationshipSchema = z.object({
  id: UUIDSchema,
  sourceId: UUIDSchema,
  targetId: UUIDSchema,
  relationshipType: RelationshipTypeSchema,
  confidence: z.number().int().min(0).max(100),
  notes: LocalizedStringNullableSchema,
  createdAt: z.coerce.date(),
});

export type PartRelationship = z.infer<typeof PartRelationshipSchema>;

/**
 * Datasheet
 */
export const DatasheetSchema = z.object({
  id: UUIDSchema,
  url: z.string(),
  fileName: z.string().nullable(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
  version: z.string().nullable(),
  language: z.string().nullable(),
  publishDate: z.coerce.date().nullable(),
  isPrimary: z.boolean(),
  createdAt: z.coerce.date(),
});

export type Datasheet = z.infer<typeof DatasheetSchema>;

/**
 * Part Image
 */
export const PartImageSchema = z.object({
  id: UUIDSchema,
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
  altText: z.string().nullable(),
  imageType: z.enum(['PHOTO', 'DIAGRAM', 'PINOUT', 'APPLICATION', 'OTHER']),
  sortOrder: z.number(),
  isPrimary: z.boolean(),
  createdAt: z.coerce.date(),
});

export type PartImage = z.infer<typeof PartImageSchema>;

// ============================================
// PART RESPONSE SCHEMAS
// ============================================

/**
 * Basis-Part
 */
export const PartBaseSchema = z.object({
  id: UUIDSchema,
  coreComponentId: UUIDSchema,
  manufacturerId: UUIDSchema,
  mpn: z.string(),
  orderingCode: z.string().nullable(),
  packageId: UUIDSchema.nullable(),
  weightGrams: z.number().nullable(),
  dateCodeFormat: z.string().nullable(),
  introductionYear: z.number().nullable(),
  discontinuedYear: z.number().nullable(),
  rohsCompliant: z.boolean().nullable(),
  reachCompliant: z.boolean().nullable(),
  nsn: z.string().nullable(),
  milSpec: z.string().nullable(),
  status: PartStatusSchema,
  lifecycleStatus: LifecycleStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdById: UUIDSchema.nullable(),
  lastEditedById: UUIDSchema.nullable(),
});

export type PartBase = z.infer<typeof PartBaseSchema>;

/**
 * Part mit Basis-Relationen
 */
export const PartWithRelationsSchema = PartBaseSchema.extend({
  coreComponent: ComponentBaseSchema,
  manufacturer: ManufacturerBaseSchema,
  package: PackageBaseSchema.nullable(),
});

export type PartWithRelations = z.infer<typeof PartWithRelationsSchema>;

/**
 * Part mit allen Details
 */
export const PartFullSchema = PartWithRelationsSchema.extend({
  hazardousMaterials: z.array(HazardousMaterialSchema),
  pinMappings: z.array(PinMappingSchema),
  datasheets: z.array(DatasheetSchema),
  images: z.array(PartImageSchema),
  attributeValues: z.array(PartAttributeValueSchema),
  relationships: z.array(
    PartRelationshipSchema.extend({
      target: PartBaseSchema,
    })
  ),
  relatedTo: z.array(
    PartRelationshipSchema.extend({
      source: PartBaseSchema,
    })
  ),
});

export type PartFull = z.infer<typeof PartFullSchema>;

/**
 * Part-Liste-Item (leichtgewichtig)
 */
export const PartListItemSchema = z.object({
  id: UUIDSchema,
  coreComponentId: UUIDSchema,              // Direct ID for easy access
  manufacturerId: UUIDSchema,               // Direct ID for easy access
  mpn: z.string(),
  orderingCode: z.string().nullable(),
  packageId: UUIDSchema.nullable(),         // Direct ID for easy access
  weightGrams: z.number().nullable(),
  dateCodeFormat: z.string().nullable(),
  introductionYear: z.number().int().nullable(),
  discontinuedYear: z.number().int().nullable(),
  rohsCompliant: z.boolean().nullable(),
  reachCompliant: z.boolean().nullable(),
  nsn: z.string().nullable(),
  milSpec: z.string().nullable(),
  status: PartStatusSchema,
  lifecycleStatus: LifecycleStatusSchema,
  manufacturer: z.object({
    id: UUIDSchema,
    name: z.string(),
    slug: z.string(),
  }),
  coreComponent: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
  }),
  package: z
    .object({
      id: UUIDSchema,
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  primaryImage: PartImageSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PartListItem = z.infer<typeof PartListItemSchema>;

// ============================================
// PART INPUT SCHEMAS
// ============================================

/**
 * Input für Gefahrstoff
 */
export const CreateHazardousMaterialSchema = z.object({
  materialType: HazardousMaterialTypeSchema,
  details: LocalizedStringNullableOptionalSchema,
});

export type CreateHazardousMaterialInput = z.infer<typeof CreateHazardousMaterialSchema>;

/**
 * Input für Pin-Mapping
 */
export const CreatePinMappingSchema = z.object({
  pinNumber: z.string().min(1).max(20),
  pinName: z.string().min(1).max(100),
  pinFunction: LocalizedStringNullableOptionalSchema,
  pinType: z.enum(['POWER', 'GROUND', 'INPUT', 'OUTPUT', 'BIDIRECTIONAL', 'NC', 'ANALOG', 'DIGITAL', 'CLOCK', 'OTHER']).optional(),
  maxVoltage: z.number().optional(),
  maxCurrent: z.number().optional(),
});

export type CreatePinMappingInput = z.infer<typeof CreatePinMappingSchema>;

/**
 * Input für Datasheet
 */
export const CreateDatasheetSchema = z.object({
  url: z.string().url().max(512),
  fileName: z.string().max(255).optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().max(100).optional(),
  version: z.string().max(50).optional(),
  language: z.string().max(10).optional(),
  publishDate: z.coerce.date().optional(),
  isPrimary: z.boolean().default(false),
});

export type CreateDatasheetInput = z.infer<typeof CreateDatasheetSchema>;

/**
 * Input für Part Image
 */
export const CreatePartImageSchema = z.object({
  url: z.string().url().max(512),
  thumbnailUrl: z.string().url().max(512).optional(),
  altText: z.string().max(255).optional(),
  imageType: z.enum(['PHOTO', 'DIAGRAM', 'PINOUT', 'APPLICATION', 'OTHER']).default('PHOTO'),
  sortOrder: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export type CreatePartImageInput = z.infer<typeof CreatePartImageSchema>;

/**
 * Input für Part-Beziehung
 */
export const CreatePartRelationshipSchema = z.object({
  targetId: UUIDSchema,
  relationshipType: RelationshipTypeSchema,
  confidence: z.number().int().min(0).max(100).default(100),
  notes: LocalizedStringNullableOptionalSchema,
});

export type CreatePartRelationshipInput = z.infer<typeof CreatePartRelationshipSchema>;

/**
 * Input für neues Part
 */
export const CreatePartSchema = z.object({
  coreComponentId: UUIDSchema,
  manufacturerId: UUIDSchema,
  mpn: z.string().min(1).max(255),
  orderingCode: z.string().max(255).optional(),
  packageId: UUIDSchema.optional(),
  weightGrams: z.number().positive().optional(),
  dateCodeFormat: z.string().max(50).optional(),
  introductionYear: z.number().int().min(1800).max(2100).optional(),
  discontinuedYear: z.number().int().min(1800).max(2100).optional(),
  rohsCompliant: z.boolean().optional(),
  reachCompliant: z.boolean().optional(),
  nsn: z.string().max(13).optional(),
  milSpec: z.string().max(100).optional(),
  status: PartStatusSchema.default('DRAFT'),
  lifecycleStatus: LifecycleStatusSchema.default('ACTIVE'),
  attributeValues: z.array(CreateAttributeValueSchema).optional(),
  pinMappings: z.array(CreatePinMappingSchema).optional(),
  hazardousMaterials: z.array(CreateHazardousMaterialSchema).optional(),
});

export type CreatePartInput = z.infer<typeof CreatePartSchema>;

/**
 * Input für Part-Update
 */
export const UpdatePartSchema = CreatePartSchema.partial().omit({
  coreComponentId: true,
  manufacturerId: true,
});

export type UpdatePartInput = z.infer<typeof UpdatePartSchema>;

// ============================================
// PART QUERY SCHEMAS
// ============================================

/**
 * Query-Parameter für Part-Liste
 */
export const PartListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  status: PartStatusSchema.optional(),
  lifecycleStatus: LifecycleStatusSchema.optional(),
  coreComponentId: UUIDSchema.optional(),
  manufacturerId: UUIDSchema.optional(),
  packageId: UUIDSchema.optional(),
  categoryId: UUIDSchema.optional(),
  rohsCompliant: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  mpn: z.string().optional(),
});

export type PartListQuery = z.infer<typeof PartListQuerySchema>;

/**
 * Input für Attributwerte-Update (Array von Attributwerten)
 */
export const SetPartAttributeValuesSchema = z.array(CreateAttributeValueSchema);

export type SetPartAttributeValuesInput = z.infer<typeof SetPartAttributeValuesSchema>;
