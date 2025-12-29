/**
 * Common Schemas - Wiederverwendbare Basis-Schemas
 */
import { z } from 'zod';

// ============================================
// LOCALIZED STRING
// ============================================

/**
 * Basis-Objekt für LocalizedString (ohne Validierung)
 */
const LocalizedStringBaseSchema = z.object({
  en: z.string().optional(),
  de: z.string().optional(),
  fr: z.string().optional(),
  es: z.string().optional(),
  zh: z.string().optional(),
});

/**
 * LocalizedString Schema - Mehrsprachige Texte
 * Mindestens eine Sprache muss vorhanden sein (für Pflichtfelder)
 */
export const LocalizedStringSchema = LocalizedStringBaseSchema.refine(
  (data) => Object.values(data).some((val) => val && val.length > 0),
  { message: 'At least one language translation is required' }
);

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;

/**
 * LocalizedString ohne Pflicht-Validierung (für optionale Felder)
 * Kann leer sein oder Sprachen enthalten
 */
export const LocalizedStringLooseSchema = LocalizedStringBaseSchema;

export type LocalizedStringLoose = z.infer<typeof LocalizedStringLooseSchema>;

/**
 * Optionales LocalizedString - Kann komplett undefined sein
 */
export const LocalizedStringOptionalSchema = LocalizedStringSchema.optional();

/**
 * Optionales LocalizedString ohne Pflicht-Validierung
 */
export const LocalizedStringLooseOptionalSchema = LocalizedStringLooseSchema.optional();

/**
 * LocalizedString Nullable Schema - Für optionale mehrsprachige Felder
 * Akzeptiert: null, undefined, leeres Objekt, oder Objekt mit beliebigen Sprachen
 * Keine Pflicht für mindestens eine Sprache - perfekt für optionale Felder wie description
 */
export const LocalizedStringNullableSchema = LocalizedStringLooseSchema.nullable();

/**
 * LocalizedString Nullable Optional Schema - Kann null, undefined oder ein Objekt sein
 */
export const LocalizedStringNullableOptionalSchema = LocalizedStringNullableSchema.optional();

// ============================================
// COMMON VALIDATORS
// ============================================

/**
 * UUID Schema
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

/**
 * Slug Schema - URL-freundliche Identifier
 */
export const SlugSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Sort Schema
 */
export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type SortInput = z.infer<typeof SortSchema>;

/**
 * Paginated Response Schema Factory
 */
export function createPaginatedResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });
}

// ============================================
// COMMON ENUMS (matching Prisma enums)
// ============================================

export const UserRoleSchema = z.enum(['ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'VIEWER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ComponentStatusSchema = z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED']);
export type ComponentStatus = z.infer<typeof ComponentStatusSchema>;

export const PartStatusSchema = z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED']);
export type PartStatus = z.infer<typeof PartStatusSchema>;

export const LifecycleStatusSchema = z.enum(['ACTIVE', 'NRND', 'EOL', 'OBSOLETE']);
export type LifecycleStatus = z.infer<typeof LifecycleStatusSchema>;

export const ManufacturerStatusSchema = z.enum(['ACTIVE', 'ACQUIRED', 'DEFUNCT']);
export type ManufacturerStatus = z.infer<typeof ManufacturerStatusSchema>;

export const MountingTypeSchema = z.enum(['THT', 'SMD', 'RADIAL', 'AXIAL', 'CHASSIS', 'OTHER']);
export type MountingType = z.infer<typeof MountingTypeSchema>;

export const AttributeDataTypeSchema = z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN', 'RANGE']);
export type AttributeDataType = z.infer<typeof AttributeDataTypeSchema>;

export const AttributeScopeSchema = z.enum(['COMPONENT', 'PART', 'BOTH']);
export type AttributeScope = z.infer<typeof AttributeScopeSchema>;

export const RelationshipTypeSchema = z.enum([
  'SUCCESSOR',
  'PREDECESSOR',
  'ALTERNATIVE',
  'FUNCTIONAL_EQUIV',
  'VARIANT',
  'SECOND_SOURCE',
  'COUNTERFEIT_RISK',
]);
export type RelationshipType = z.infer<typeof RelationshipTypeSchema>;

export const ConceptRelationTypeSchema = z.enum([
  'DUAL_VERSION',
  'QUAD_VERSION',
  'LOW_POWER_VERSION',
  'HIGH_SPEED_VERSION',
  'MILITARY_VERSION',
  'AUTOMOTIVE_VERSION',
  'FUNCTIONAL_EQUIV',
]);
export type ConceptRelationType = z.infer<typeof ConceptRelationTypeSchema>;

export const HazardousMaterialTypeSchema = z.enum([
  'PCB_CAPACITOR',
  'ASBESTOS',
  'MERCURY',
  'RADIOACTIVE',
  'LEAD',
  'CADMIUM',
  'BERYLLIUM',
  'OTHER',
]);
export type HazardousMaterialType = z.infer<typeof HazardousMaterialTypeSchema>;

export const PinTypeSchema = z.enum([
  'POWER',
  'GROUND',
  'INPUT',
  'OUTPUT',
  'BIDIRECTIONAL',
  'NC',
  'ANALOG',
  'DIGITAL',
  'CLOCK',
  'OTHER',
]);
export type PinType = z.infer<typeof PinTypeSchema>;

export const AuditActionSchema = z.enum([
  'CREATE',
  'UPDATE',
  'DELETE',
  'RESTORE',
  'MERGE',
  'APPROVE',
  'REJECT',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const ImageTypeSchema = z.enum(['PHOTO', 'DIAGRAM', 'PINOUT', 'APPLICATION', 'OTHER']);
export type ImageType = z.infer<typeof ImageTypeSchema>;

export const EcadFormatSchema = z.enum(['KICAD', 'EAGLE', 'ALTIUM', 'ORCAD', 'STEP', 'OTHER']);
export type EcadFormat = z.infer<typeof EcadFormatSchema>;

export const FileTypeSchema = z.enum([
  'DATASHEET',
  'IMAGE',
  'PINOUT',
  'ECAD_MODEL',
  'SCHEMATIC',
  'APPLICATION_NOTE',
  'MANUAL',
  'OTHER',
]);
export type FileType = z.infer<typeof FileTypeSchema>;

// ============================================
// API RESPONSE SCHEMAS
// ============================================

/**
 * Standard Error Response
 */
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Standard Success Response Factory
 */
export function createSuccessResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    data: dataSchema,
  });
}
