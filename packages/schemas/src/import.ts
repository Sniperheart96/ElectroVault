/**
 * ElectroVault - Import System Schemas
 *
 * Zod-Validierungsschemas für das Distributor-Import-System
 */

import { z } from 'zod';
import { UUIDSchema, PaginationSchema, ComponentStatusSchema } from './common';

// ============================================
// ENUMS
// ============================================

export const ImportSourceTypeSchema = z.enum([
  'API_MOUSER',
  'API_DIGIKEY',
  'API_FARNELL',
  'API_LCSC',
  'API_TME',
  'API_REICHELT',
  'API_CUSTOM',
  'FILE_CSV',
  'FILE_XML',
  'FILE_JSON',
]);
export type ImportSourceType = z.infer<typeof ImportSourceTypeSchema>;

export const ImportJobStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'PAUSED',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);
export type ImportJobStatus = z.infer<typeof ImportJobStatusSchema>;

export const ImportItemStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'SUCCESS',
  'CONFLICT',
  'SKIPPED',
  'FAILED',
]);
export type ImportItemStatus = z.infer<typeof ImportItemStatusSchema>;

export const ImportMappingTypeSchema = z.enum([
  'ATTRIBUTE',
  'CATEGORY',
  'MANUFACTURER',
  'UNIT',
]);
export type ImportMappingType = z.infer<typeof ImportMappingTypeSchema>;

// ============================================
// IMPORT SOURCE SCHEMAS
// ============================================

/**
 * Import-Quelle (Distributor oder Datei-Typ)
 */
export const ImportSourceSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  sourceType: ImportSourceTypeSchema,
  apiBaseUrl: z.string().url().max(512).nullable(),
  // API-Keys werden NICHT in Response-Schemas inkludiert!
  rateLimitPerSecond: z.number().int().min(1).max(100).nullable(),
  rateLimitPerMinute: z.number().int().min(1).max(10000),
  rateLimitPerDay: z.number().int().min(1).max(1000000).nullable(),
  maxResultsPerRequest: z.number().int().min(1).max(10000).nullable(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdById: UUIDSchema.nullable(),
});
export type ImportSource = z.infer<typeof ImportSourceSchema>;

/**
 * Import-Quelle mit Stats
 */
export const ImportSourceWithStatsSchema = ImportSourceSchema.extend({
  _count: z.object({
    mappings: z.number().int(),
    jobs: z.number().int(),
    unmappedAttributes: z.number().int(),
  }).optional(),
});
export type ImportSourceWithStats = z.infer<typeof ImportSourceWithStatsSchema>;

/**
 * Create Import Source Input
 */
export const CreateImportSourceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten').optional(),
  sourceType: ImportSourceTypeSchema,
  apiBaseUrl: z.string().url().max(512).optional(),
  apiKey: z.string().max(1000).optional(), // Wird verschlüsselt gespeichert
  apiSecret: z.string().max(1000).optional(), // Wird verschlüsselt gespeichert
  // Rate Limiting
  rateLimitPerSecond: z.number().int().min(1).max(100).optional(),
  rateLimitPerMinute: z.number().int().min(1).max(10000).default(60),
  rateLimitPerDay: z.number().int().min(1).max(1000000).optional(),
  maxResultsPerRequest: z.number().int().min(1).max(10000).optional(),
  description: z.string().max(5000).optional(),
  isActive: z.boolean().default(true),
});
export type CreateImportSourceInput = z.infer<typeof CreateImportSourceSchema>;

/**
 * Update Import Source Input
 */
export const UpdateImportSourceSchema = CreateImportSourceSchema.partial().extend({
  // API-Key kann auf null gesetzt werden zum Löschen
  apiKey: z.string().max(1000).nullable().optional(),
  apiSecret: z.string().max(1000).nullable().optional(),
});
export type UpdateImportSourceInput = z.infer<typeof UpdateImportSourceSchema>;

/**
 * Import Source List Query
 */
export const ImportSourceListQuerySchema = PaginationSchema.extend({
  sourceType: ImportSourceTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
});
export type ImportSourceListQuery = z.infer<typeof ImportSourceListQuerySchema>;

// ============================================
// IMPORT MAPPING SCHEMAS
// ============================================

/**
 * Import-Mapping (Attribut, Kategorie, Hersteller, Einheit)
 */
export const ImportMappingSchema = z.object({
  id: UUIDSchema,
  sourceId: UUIDSchema.nullable(),
  mappingType: ImportMappingTypeSchema,
  sourceKey: z.string().min(1).max(255),
  sourceValue: z.string().max(255).nullable(),
  targetAttributeId: UUIDSchema.nullable(),
  targetCategoryId: UUIDSchema.nullable(),
  targetManufacturerId: UUIDSchema.nullable(),
  conversionFactor: z.number().nullable(),
  conversionOffset: z.number().nullable(),
  parsePattern: z.string().max(512).nullable(),
  priority: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdById: UUIDSchema.nullable(),
});
export type ImportMapping = z.infer<typeof ImportMappingSchema>;

/**
 * Import-Mapping mit Relationen
 */
export const ImportMappingWithRelationsSchema = ImportMappingSchema.extend({
  source: ImportSourceSchema.nullable().optional(),
  targetAttribute: z.object({
    id: UUIDSchema,
    name: z.string(),
    displayName: z.record(z.string()).nullable(),
    unit: z.string().nullable(),
  }).nullable().optional(),
  targetCategory: z.object({
    id: UUIDSchema,
    name: z.record(z.string()),
    slug: z.string(),
  }).nullable().optional(),
  targetManufacturer: z.object({
    id: UUIDSchema,
    name: z.string(),
    slug: z.string(),
  }).nullable().optional(),
});
export type ImportMappingWithRelations = z.infer<typeof ImportMappingWithRelationsSchema>;

/**
 * Base Import Mapping Input (ohne Validierung)
 */
const BaseImportMappingInputSchema = z.object({
  sourceId: UUIDSchema.nullable().optional(), // null = globales Mapping
  mappingType: ImportMappingTypeSchema,
  sourceKey: z.string().min(1).max(255),
  sourceValue: z.string().max(255).optional(),
  targetAttributeId: UUIDSchema.optional(),
  targetCategoryId: UUIDSchema.optional(),
  targetManufacturerId: UUIDSchema.optional(),
  conversionFactor: z.number().optional(),
  conversionOffset: z.number().optional(),
  parsePattern: z.string().max(512).optional(),
  priority: z.number().int().min(-1000).max(1000).default(0),
  isActive: z.boolean().default(true),
});

/**
 * Create Import Mapping Input
 */
export const CreateImportMappingSchema = BaseImportMappingInputSchema.refine(
  (data) => {
    // Mindestens ein Target muss gesetzt sein
    return data.targetAttributeId || data.targetCategoryId || data.targetManufacturerId || data.mappingType === 'UNIT';
  },
  { message: 'Es muss mindestens ein Ziel (Attribut, Kategorie oder Hersteller) angegeben werden' }
);
export type CreateImportMappingInput = z.infer<typeof CreateImportMappingSchema>;

/**
 * Update Import Mapping Input
 */
export const UpdateImportMappingSchema = BaseImportMappingInputSchema.partial();
export type UpdateImportMappingInput = z.infer<typeof UpdateImportMappingSchema>;

/**
 * Import Mapping List Query
 */
export const ImportMappingListQuerySchema = PaginationSchema.extend({
  sourceId: UUIDSchema.optional(), // null = nur globale Mappings
  mappingType: ImportMappingTypeSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  includeGlobal: z.coerce.boolean().default(true), // Globale Mappings mitladen?
});
export type ImportMappingListQuery = z.infer<typeof ImportMappingListQuerySchema>;

/**
 * Bulk Create Mappings Input
 */
export const BulkCreateMappingsSchema = z.object({
  mappings: z.array(CreateImportMappingSchema).min(1).max(100),
});
export type BulkCreateMappingsInput = z.infer<typeof BulkCreateMappingsSchema>;

// ============================================
// IMPORT JOB SCHEMAS
// ============================================

/**
 * Import-Job (ein Import-Vorgang)
 */
export const ImportJobSchema = z.object({
  id: UUIDSchema,
  sourceId: UUIDSchema,
  name: z.string().min(1).max(255),
  status: ImportJobStatusSchema,
  totalItems: z.number().int(),
  processedItems: z.number().int(),
  successItems: z.number().int(),
  conflictItems: z.number().int(),
  failedItems: z.number().int(),
  skippedItems: z.number().int(),
  draftItems: z.number().int(),
  fileName: z.string().max(255).nullable(),
  filePath: z.string().max(512).nullable(),
  searchQuery: z.string().nullable(),
  options: z.record(z.unknown()),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  lastError: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdById: UUIDSchema,
});
export type ImportJob = z.infer<typeof ImportJobSchema>;

/**
 * Import-Job mit Source
 */
export const ImportJobWithSourceSchema = ImportJobSchema.extend({
  source: ImportSourceSchema.optional(),
  createdBy: z.object({
    id: UUIDSchema,
    username: z.string(),
    displayName: z.string().nullable(),
  }).optional(),
});
export type ImportJobWithSource = z.infer<typeof ImportJobWithSourceSchema>;

/**
 * Create Import Job Input (für Datei-Import)
 */
export const CreateFileImportJobSchema = z.object({
  sourceId: UUIDSchema,
  name: z.string().min(1).max(255),
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1).max(512), // MinIO-Pfad
  options: z.object({
    skipHeader: z.boolean().default(true),
    delimiter: z.string().max(5).default(','),
    encoding: z.string().max(20).default('utf-8'),
    columnMapping: z.record(z.string()).optional(), // CSV-Spalte → Feld-Mapping
  }).optional(),
});
export type CreateFileImportJobInput = z.infer<typeof CreateFileImportJobSchema>;

/**
 * Create Import Job Input (für API-Import)
 */
export const CreateApiImportJobSchema = z.object({
  sourceId: UUIDSchema,
  name: z.string().min(1).max(255),
  searchQuery: z.string().min(1).max(1000),
  options: z.object({
    maxResults: z.number().int().min(1).max(10000).default(100),
    categories: z.array(z.string()).optional(), // Kategorie-Filter
  }).optional(),
});
export type CreateApiImportJobInput = z.infer<typeof CreateApiImportJobSchema>;

/**
 * Import Job List Query
 */
export const ImportJobListQuerySchema = PaginationSchema.extend({
  sourceId: UUIDSchema.optional(),
  status: ImportJobStatusSchema.optional(),
  createdById: UUIDSchema.optional(),
});
export type ImportJobListQuery = z.infer<typeof ImportJobListQuerySchema>;

// ============================================
// IMPORT JOB ITEM SCHEMAS
// ============================================

/**
 * Import-Job-Item (einzelnes importiertes Element)
 */
export const ImportJobItemSchema = z.object({
  id: UUIDSchema,
  jobId: UUIDSchema,
  status: ImportItemStatusSchema,
  rawData: z.record(z.unknown()),
  parsedMpn: z.string().max(255).nullable(),
  parsedManufacturer: z.string().max(255).nullable(),
  parsedCategory: z.string().max(255).nullable(),
  parsedAttributes: z.record(z.unknown()).nullable(),
  createdComponentId: UUIDSchema.nullable(),
  createdPartId: UUIDSchema.nullable(),
  resultStatus: ComponentStatusSchema.nullable(),
  existingPartId: UUIDSchema.nullable(),
  conflictData: z.record(z.unknown()).nullable(),
  conflictResolution: z.record(z.unknown()).nullable(),
  missingRequiredFields: z.array(z.string()),
  errorMessage: z.string().nullable(),
  errorDetails: z.record(z.unknown()).nullable(),
  rowNumber: z.number().int().nullable(),
  processedAt: z.coerce.date().nullable(),
});
export type ImportJobItem = z.infer<typeof ImportJobItemSchema>;

/**
 * Import Job Item mit Relationen
 */
export const ImportJobItemWithRelationsSchema = ImportJobItemSchema.extend({
  createdComponent: z.object({
    id: UUIDSchema,
    name: z.record(z.string()),
    slug: z.string(),
  }).nullable().optional(),
  createdPart: z.object({
    id: UUIDSchema,
    mpn: z.string(),
    manufacturer: z.object({
      id: UUIDSchema,
      name: z.string(),
    }),
  }).nullable().optional(),
});
export type ImportJobItemWithRelations = z.infer<typeof ImportJobItemWithRelationsSchema>;

/**
 * Import Job Item List Query
 */
export const ImportJobItemListQuerySchema = PaginationSchema.extend({
  status: ImportItemStatusSchema.optional(),
  resultStatus: ComponentStatusSchema.optional(),
  hasConflict: z.coerce.boolean().optional(),
  hasMissingFields: z.coerce.boolean().optional(),
});
export type ImportJobItemListQuery = z.infer<typeof ImportJobItemListQuerySchema>;

/**
 * Conflict Resolution Input
 */
export const ResolveConflictSchema = z.object({
  itemId: UUIDSchema,
  resolution: z.enum(['USE_EXISTING', 'USE_IMPORTED', 'MERGE']),
  mergeFields: z.record(z.enum(['existing', 'imported'])).optional(), // Welches Feld von wo übernehmen
});
export type ResolveConflictInput = z.infer<typeof ResolveConflictSchema>;

/**
 * Bulk Resolve Conflicts Input
 */
export const BulkResolveConflictsSchema = z.object({
  jobId: UUIDSchema,
  resolution: z.enum(['USE_ALL_EXISTING', 'USE_ALL_IMPORTED']),
});
export type BulkResolveConflictsInput = z.infer<typeof BulkResolveConflictsSchema>;

// ============================================
// UNMAPPED ATTRIBUTE SCHEMAS
// ============================================

/**
 * Unbekanntes Attribut aus Import
 */
export const ImportUnmappedAttributeSchema = z.object({
  id: UUIDSchema,
  sourceId: UUIDSchema,
  sourceKey: z.string().min(1).max(255),
  sampleValues: z.array(z.string()),
  occurrenceCount: z.number().int(),
  isResolved: z.boolean(),
  resolvedMappingId: UUIDSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ImportUnmappedAttribute = z.infer<typeof ImportUnmappedAttributeSchema>;

/**
 * Unmapped Attribute mit Source
 */
export const ImportUnmappedAttributeWithSourceSchema = ImportUnmappedAttributeSchema.extend({
  source: ImportSourceSchema.optional(),
});
export type ImportUnmappedAttributeWithSource = z.infer<typeof ImportUnmappedAttributeWithSourceSchema>;

/**
 * Unmapped Attribute List Query
 */
export const ImportUnmappedAttributeListQuerySchema = PaginationSchema.extend({
  sourceId: UUIDSchema.optional(),
  isResolved: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
});
export type ImportUnmappedAttributeListQuery = z.infer<typeof ImportUnmappedAttributeListQuerySchema>;

/**
 * Map Unmapped Attribute Input
 */
export const MapUnmappedAttributeSchema = z.object({
  unmappedId: UUIDSchema,
  targetAttributeId: UUIDSchema.optional(), // Auf bestehendes Attribut mappen
  createNewAttribute: z.object({
    name: z.string().min(1).max(100),
    displayName: z.record(z.string()),
    categoryId: UUIDSchema,
    dataType: z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN', 'RANGE', 'SELECT', 'MULTISELECT']),
    unit: z.string().max(50).optional(),
  }).optional(),
  dismiss: z.boolean().optional(), // Ignorieren ohne Mapping
}).refine(
  (data) => data.targetAttributeId || data.createNewAttribute || data.dismiss,
  { message: 'Es muss entweder ein Ziel-Attribut, ein neues Attribut oder Dismiss angegeben werden' }
);
export type MapUnmappedAttributeInput = z.infer<typeof MapUnmappedAttributeSchema>;

// ============================================
// MAPPING PREVIEW SCHEMAS
// ============================================

/**
 * Mapping-Preview Input (für Test-Transformation)
 */
export const MappingPreviewInputSchema = z.object({
  sourceId: UUIDSchema.optional(),
  testData: z.record(z.string()), // Key-Value-Paare wie vom Distributor
});
export type MappingPreviewInput = z.infer<typeof MappingPreviewInputSchema>;

/**
 * Mapping-Preview Result
 */
export const MappingPreviewResultSchema = z.object({
  mapped: z.record(z.object({
    originalKey: z.string(),
    originalValue: z.string(),
    mappedAttributeId: UUIDSchema.nullable(),
    mappedAttributeName: z.string().nullable(),
    normalizedValue: z.number().nullable(),
    prefix: z.string().nullable(),
    stringValue: z.string().nullable(),
    mappingUsed: UUIDSchema.nullable(), // Welches Mapping wurde angewendet
  })),
  unmapped: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
  errors: z.array(z.object({
    key: z.string(),
    value: z.string(),
    error: z.string(),
  })),
});
export type MappingPreviewResult = z.infer<typeof MappingPreviewResultSchema>;

// ============================================
// VALUE PARSER SCHEMAS
// ============================================

/**
 * Geparster Wert mit SI-Präfix
 */
export const ParsedValueSchema = z.object({
  rawValue: z.string(),
  numericValue: z.number().nullable(),
  prefix: z.string().nullable(), // p, n, µ, m, k, M, G, T
  unit: z.string().nullable(),
  normalizedValue: z.number().nullable(), // In SI-Basiseinheit
  stringValue: z.string().nullable(), // Für nicht-numerische Werte
  isNumeric: z.boolean(),
});
export type ParsedValue = z.infer<typeof ParsedValueSchema>;
