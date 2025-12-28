/**
 * Component Schemas - CoreComponent API Schemas
 */
import { z } from 'zod';
import {
  LocalizedStringSchema,
  LocalizedStringOptionalSchema,
  UUIDSchema,
  SlugSchema,
  PaginationSchema,
  SortSchema,
  ComponentStatusSchema,
  ConceptRelationTypeSchema,
  AttributeScopeSchema,
  AttributeDataTypeSchema,
} from './common';
import { CategoryBaseSchema } from './category';

// ============================================
// ATTRIBUTE VALUE SCHEMAS
// ============================================

// ============================================
// SI-PRÄFIX KONSTANTEN
// ============================================

/**
 * SI-Präfix-Definitionen mit Multiplikator
 * Note: µ is U+00B5 MICRO SIGN, using escape sequence for safety
 */
export const SI_PREFIXES = {
  P: { name: 'Peta', factor: 1e15 },
  T: { name: 'Tera', factor: 1e12 },
  G: { name: 'Giga', factor: 1e9 },
  M: { name: 'Mega', factor: 1e6 },
  k: { name: 'Kilo', factor: 1e3 },
  h: { name: 'Hekto', factor: 1e2 },
  da: { name: 'Deka', factor: 1e1 },
  '': { name: 'Basis', factor: 1 },
  d: { name: 'Dezi', factor: 1e-1 },
  c: { name: 'Zenti', factor: 1e-2 },
  m: { name: 'Milli', factor: 1e-3 },
  '\u00B5': { name: 'Mikro', factor: 1e-6 },
  n: { name: 'Nano', factor: 1e-9 },
  p: { name: 'Piko', factor: 1e-12 },
  f: { name: 'Femto', factor: 1e-15 },
} as const;

export type SIPrefix = keyof typeof SI_PREFIXES;

/**
 * Typische Präfix-Sets für verschiedene Einheiten
 */
export const COMMON_PREFIX_SETS = {
  capacitance: ['p', 'n', '\u00B5', 'm', ''] as SIPrefix[],           // Farad
  resistance: ['m', '', 'k', 'M', 'G'] as SIPrefix[],            // Ohm
  inductance: ['n', '\u00B5', 'm', ''] as SIPrefix[],                 // Henry
  voltage: ['\u00B5', 'm', '', 'k'] as SIPrefix[],                    // Volt
  current: ['n', '\u00B5', 'm', ''] as SIPrefix[],                    // Ampere
  length: ['n', '\u00B5', 'm', 'c', '', 'k'] as SIPrefix[],           // Meter
  frequency: ['', 'k', 'M', 'G'] as SIPrefix[],                  // Hertz
  power: ['\u00B5', 'm', '', 'k', 'M'] as SIPrefix[],                 // Watt
  data: ['', 'k', 'M', 'G', 'T'] as SIPrefix[],                  // Byte (beachte: oft Ki, Mi, Gi für binär)
} as const;

/**
 * Schema für erlaubte SI-Präfixe
 */
export const SIPrefixSchema = z.enum([
  'P', 'T', 'G', 'M', 'k', 'h', 'da', '', 'd', 'c', 'm', '\u00B5', 'n', 'p', 'f',
]);

/**
 * Attribut-Definition (für Response)
 */
export const AttributeDefinitionSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  displayName: LocalizedStringSchema,
  unit: z.string().nullable(),           // Basiseinheit (z.B. "F", "Ω", "m")
  dataType: AttributeDataTypeSchema,
  scope: AttributeScopeSchema,
  isFilterable: z.boolean(),
  isRequired: z.boolean(),
  allowedPrefixes: z.array(SIPrefixSchema).default([]),  // Erlaubte SI-Präfixe
  // Legacy-Felder (werden durch allowedPrefixes ersetzt)
  siUnit: z.string().nullable(),
  siMultiplier: z.number().nullable(),
  sortOrder: z.number(),
});

export type AttributeDefinition = z.infer<typeof AttributeDefinitionSchema>;

/**
 * Component Attribute Value (Response)
 */
export const ComponentAttributeValueSchema = z.object({
  id: UUIDSchema,
  definitionId: UUIDSchema,
  definition: AttributeDefinitionSchema.optional(),
  // Numerische Werte (immer in SI-Basiseinheit)
  normalizedValue: z.number().nullable(),
  normalizedMin: z.number().nullable(),    // Für RANGE-Typ
  normalizedMax: z.number().nullable(),    // Für RANGE-Typ
  // SI-Präfix für Anzeige
  prefix: SIPrefixSchema.nullable(),
  // Für STRING-Typ
  stringValue: z.string().nullable(),
});

export type ComponentAttributeValue = z.infer<typeof ComponentAttributeValueSchema>;

/**
 * Input für Attributwert (Create/Update)
 */
export const CreateAttributeValueSchema = z.object({
  definitionId: UUIDSchema,
  // Numerische Werte
  normalizedValue: z.number().optional().nullable(),
  normalizedMin: z.number().optional().nullable(),
  normalizedMax: z.number().optional().nullable(),
  // SI-Präfix für Anzeige (null wird zu '' transformiert)
  prefix: SIPrefixSchema.optional().nullable().transform((val) => val ?? ''),
  // Für STRING-Typ
  stringValue: z.string().max(255).optional().nullable(),
});

export type CreateAttributeValueInput = z.infer<typeof CreateAttributeValueSchema>;

// ============================================
// CONCEPT RELATION SCHEMAS
// ============================================

/**
 * Konzept-Beziehung
 */
export const ConceptRelationSchema = z.object({
  id: UUIDSchema,
  sourceId: UUIDSchema,
  targetId: UUIDSchema,
  relationType: ConceptRelationTypeSchema,
  notes: LocalizedStringSchema.nullable(),
  createdAt: z.coerce.date(),
});

export type ConceptRelation = z.infer<typeof ConceptRelationSchema>;

/**
 * Input für Konzept-Beziehung
 */
export const CreateConceptRelationSchema = z.object({
  targetId: UUIDSchema,
  relationType: ConceptRelationTypeSchema,
  notes: LocalizedStringOptionalSchema,
});

export type CreateConceptRelationInput = z.infer<typeof CreateConceptRelationSchema>;

/**
 * Input für Konzept-Beziehung Update
 */
export const UpdateConceptRelationSchema = z.object({
  notes: LocalizedStringOptionalSchema,
});

export type UpdateConceptRelationInput = z.infer<typeof UpdateConceptRelationSchema>;

/**
 * Konzept-Beziehung mit Ziel-Component
 */
export const ConceptRelationWithTargetSchema = ConceptRelationSchema.extend({
  target: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
    series: z.string().nullable(),
    shortDescription: LocalizedStringSchema.nullable(),
  }),
});

export type ConceptRelationWithTarget = z.infer<typeof ConceptRelationWithTargetSchema>;

/**
 * Konzept-Beziehung mit Quell-Component
 */
export const ConceptRelationWithSourceSchema = ConceptRelationSchema.extend({
  source: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
    series: z.string().nullable(),
    shortDescription: LocalizedStringSchema.nullable(),
  }),
});

export type ConceptRelationWithSource = z.infer<typeof ConceptRelationWithSourceSchema>;

/**
 * Response für Component Relations
 */
export const ComponentRelationsResponseSchema = z.object({
  outgoing: z.array(ConceptRelationWithTargetSchema),
  incoming: z.array(ConceptRelationWithSourceSchema),
});

export type ComponentRelationsResponse = z.infer<typeof ComponentRelationsResponseSchema>;

// ============================================
// COMPONENT RESPONSE SCHEMAS
// ============================================

/**
 * Basis-Component
 */
export const ComponentBaseSchema = z.object({
  id: UUIDSchema,
  name: LocalizedStringSchema,
  slug: z.string(),
  series: z.string().nullable(),
  categoryId: UUIDSchema,
  shortDescription: LocalizedStringSchema.nullable(),
  fullDescription: LocalizedStringSchema.nullable(),
  commonAttributes: z.record(z.unknown()),
  status: ComponentStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdById: UUIDSchema.nullable(),
  lastEditedById: UUIDSchema.nullable(),
});

export type ComponentBase = z.infer<typeof ComponentBaseSchema>;

/**
 * Component mit Kategorie
 */
export const ComponentWithCategorySchema = ComponentBaseSchema.extend({
  category: CategoryBaseSchema,
});

export type ComponentWithCategory = z.infer<typeof ComponentWithCategorySchema>;

/**
 * Component mit allen Details
 */
export const ComponentFullSchema = ComponentWithCategorySchema.extend({
  attributeValues: z.array(ComponentAttributeValueSchema),
  conceptRelations: z.array(
    ConceptRelationSchema.extend({
      target: ComponentBaseSchema,
    })
  ),
  relatedFromConcepts: z.array(
    ConceptRelationSchema.extend({
      source: ComponentBaseSchema,
    })
  ),
  manufacturerPartsCount: z.number().optional(),
});

export type ComponentFull = z.infer<typeof ComponentFullSchema>;

/**
 * Component-Liste-Item (leichtgewichtig)
 */
export const ComponentListItemSchema = z.object({
  id: UUIDSchema,
  name: LocalizedStringSchema,
  slug: z.string(),
  series: z.string().nullable(),
  shortDescription: LocalizedStringSchema.nullable(),
  status: ComponentStatusSchema,
  category: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
  }),
  manufacturerPartsCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ComponentListItem = z.infer<typeof ComponentListItemSchema>;

// ============================================
// COMPONENT INPUT SCHEMAS
// ============================================

/**
 * Input für neues Component
 */
export const CreateComponentSchema = z.object({
  name: LocalizedStringSchema,
  slug: SlugSchema.optional(), // Auto-generiert wenn nicht angegeben
  series: z.string().max(255).optional(),
  categoryId: UUIDSchema,
  shortDescription: LocalizedStringOptionalSchema,
  fullDescription: LocalizedStringOptionalSchema,
  commonAttributes: z.record(z.unknown()).optional(),
  status: ComponentStatusSchema.default('DRAFT'),
  attributeValues: z.array(CreateAttributeValueSchema).optional(),
});

export type CreateComponentInput = z.infer<typeof CreateComponentSchema>;

/**
 * Input für Component-Update
 */
export const UpdateComponentSchema = CreateComponentSchema.partial().omit({
  categoryId: true, // Kategorie-Wechsel erfordert spezielle Behandlung
});

export type UpdateComponentInput = z.infer<typeof UpdateComponentSchema>;

/**
 * Input für Kategorie-Wechsel
 */
export const ChangeCategorySchema = z.object({
  newCategoryId: UUIDSchema,
  migrateAttributes: z.boolean().default(true),
});

export type ChangeCategoryInput = z.infer<typeof ChangeCategorySchema>;

// ============================================
// COMPONENT QUERY SCHEMAS
// ============================================

/**
 * Query-Parameter für Component-Liste
 */
export const ComponentListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  status: ComponentStatusSchema.optional(),
  categoryId: UUIDSchema.optional(),
  categorySlug: z.string().optional(),
  includeSubcategories: z.coerce.boolean().default(true),
  search: z.string().max(100).optional(),
  createdById: UUIDSchema.optional(),
});

export type ComponentListQuery = z.infer<typeof ComponentListQuerySchema>;

/**
 * Attribute Filter Schema
 */
export const AttributeFilterSchema = z.object({
  definitionId: UUIDSchema,
  operator: z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'contains']),
  value: z.union([z.string(), z.number()]),
  valueTo: z.union([z.string(), z.number()]).optional(), // Für 'between'
});

export type AttributeFilter = z.infer<typeof AttributeFilterSchema>;

/**
 * Erweiterte Suche
 */
export const ComponentSearchQuerySchema = ComponentListQuerySchema.extend({
  attributeFilters: z.array(AttributeFilterSchema).optional(),
  series: z.string().optional(),
});

export type ComponentSearchQuery = z.infer<typeof ComponentSearchQuerySchema>;
