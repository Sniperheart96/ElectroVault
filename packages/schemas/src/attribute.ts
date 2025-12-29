/**
 * Attribute Schemas - Zod-Validierung für AttributeDefinition
 */

import { z } from 'zod';
import {
  LocalizedStringSchema,
  AttributeDataTypeSchema,
  AttributeScopeSchema,
  UUIDSchema,
  PaginationSchema,
  SortSchema,
} from './common';
import { SIPrefixSchema } from './component';

// ============================================
// RESPONSE SCHEMAS
// ============================================

/**
 * AttributeDefinition Base Response
 */
export const AttributeDefinitionSchema = z.object({
  id: UUIDSchema,
  categoryId: UUIDSchema,
  name: z.string().min(1).max(100),
  displayName: LocalizedStringSchema,
  unit: z.string().max(50).nullable(),           // Basiseinheit (z.B. "F", "Ω", "m")
  dataType: AttributeDataTypeSchema,
  scope: AttributeScopeSchema,
  isFilterable: z.boolean(),
  isRequired: z.boolean(),
  isLabel: z.boolean(),                          // Für dynamische Bauteilbezeichnung
  allowedPrefixes: z.array(SIPrefixSchema).default([]),  // Erlaubte SI-Präfixe
  // Legacy-Felder
  siUnit: z.string().max(20).nullable(),
  siMultiplier: z.number().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AttributeDefinition = z.infer<typeof AttributeDefinitionSchema>;

/**
 * AttributeDefinition mit Kategorie-Info
 */
export const AttributeWithCategorySchema = AttributeDefinitionSchema.extend({
  category: z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
    level: z.number().int(),
  }),
});

export type AttributeWithCategory = z.infer<typeof AttributeWithCategorySchema>;

// ============================================
// INPUT SCHEMAS
// ============================================

/**
 * Attribut erstellen
 */
export const CreateAttributeDefinitionSchema = z.object({
  categoryId: UUIDSchema,
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Name must be alphanumeric with underscores'),
  displayName: LocalizedStringSchema,
  unit: z.string().max(50).optional(),           // Basiseinheit (z.B. "F", "Ω", "m")
  dataType: AttributeDataTypeSchema,
  scope: AttributeScopeSchema.default('PART'),
  isFilterable: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isLabel: z.boolean().default(false),           // Für dynamische Bauteilbezeichnung
  allowedPrefixes: z.array(SIPrefixSchema).default([]),  // Erlaubte SI-Präfixe
  // Legacy-Felder (optional)
  siUnit: z.string().max(20).optional(),
  siMultiplier: z.number().positive().optional(),
  sortOrder: z.number().int().default(0),
}).refine(
  (data) => !data.isLabel || data.isRequired,
  { message: 'Label erfordert Pflichtfeld', path: ['isLabel'] }
);

export type CreateAttributeDefinitionInput = z.infer<typeof CreateAttributeDefinitionSchema>;

/**
 * Attribut aktualisieren
 */
export const UpdateAttributeDefinitionSchema = z.object({
  displayName: LocalizedStringSchema.optional(),
  unit: z.string().max(50).nullable().optional(),
  scope: AttributeScopeSchema.optional(),
  isFilterable: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  isLabel: z.boolean().optional(),               // Für dynamische Bauteilbezeichnung
  allowedPrefixes: z.array(SIPrefixSchema).optional(),  // Erlaubte SI-Präfixe
  // Legacy-Felder
  siUnit: z.string().max(20).nullable().optional(),
  siMultiplier: z.number().positive().nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateAttributeDefinitionInput = z.infer<typeof UpdateAttributeDefinitionSchema>;

// ============================================
// QUERY SCHEMAS
// ============================================

/**
 * Attribute auflisten
 */
export const AttributeListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  categoryId: UUIDSchema.optional(),
  scope: AttributeScopeSchema.optional(),
  dataType: AttributeDataTypeSchema.optional(),
  isFilterable: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type AttributeListQuery = z.infer<typeof AttributeListQuerySchema>;

/**
 * Attribute einer Kategorie inkl. vererbter
 */
export const CategoryAttributesQuerySchema = z.object({
  includeInherited: z.coerce.boolean().default(true),
  scope: AttributeScopeSchema.optional(),
});

export type CategoryAttributesQuery = z.infer<typeof CategoryAttributesQuerySchema>;
