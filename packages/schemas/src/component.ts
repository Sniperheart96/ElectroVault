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

/**
 * Attribut-Definition (für Response)
 */
export const AttributeDefinitionSchema = z.object({
  id: UUIDSchema,
  name: z.string(),
  displayName: LocalizedStringSchema,
  unit: z.string().nullable(),
  dataType: AttributeDataTypeSchema,
  scope: AttributeScopeSchema,
  isFilterable: z.boolean(),
  isRequired: z.boolean(),
  siUnit: z.string().nullable(),
  siMultiplier: z.number().nullable(),
  sortOrder: z.number(),
});

export type AttributeDefinition = z.infer<typeof AttributeDefinitionSchema>;

/**
 * Component Attribute Value
 */
export const ComponentAttributeValueSchema = z.object({
  id: UUIDSchema,
  definitionId: UUIDSchema,
  definition: AttributeDefinitionSchema.optional(),
  displayValue: z.string(),
  normalizedValue: z.number().nullable(),
  normalizedMin: z.number().nullable(),
  normalizedMax: z.number().nullable(),
  stringValue: z.string().nullable(),
});

export type ComponentAttributeValue = z.infer<typeof ComponentAttributeValueSchema>;

/**
 * Input für Attributwert
 */
export const CreateAttributeValueSchema = z.object({
  definitionId: UUIDSchema,
  displayValue: z.string().min(1).max(255),
  normalizedValue: z.number().optional(),
  normalizedMin: z.number().optional(),
  normalizedMax: z.number().optional(),
  stringValue: z.string().max(255).optional(),
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
