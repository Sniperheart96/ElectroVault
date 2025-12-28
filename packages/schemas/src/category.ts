/**
 * Category Schemas - Kategorie-Taxonomie API Schemas
 */
import { z } from 'zod';
import { LocalizedStringSchema, UUIDSchema, PaginationSchema, SortSchema } from './common';

// ============================================
// CATEGORY RESPONSE SCHEMAS
// ============================================

/**
 * Basis-Kategorie (ohne Kinder/Eltern)
 */
export const CategoryBaseSchema = z.object({
  id: UUIDSchema,
  name: LocalizedStringSchema,
  slug: z.string(),
  level: z.number().int().min(0).max(4),
  description: LocalizedStringSchema.nullable(),
  iconUrl: z.string().nullable(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  parentId: UUIDSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CategoryBase = z.infer<typeof CategoryBaseSchema>;

/**
 * Kategorie mit Eltern-Info
 */
export const CategoryWithParentSchema = CategoryBaseSchema.extend({
  parent: CategoryBaseSchema.nullable(),
});

export type CategoryWithParent = z.infer<typeof CategoryWithParentSchema>;

/**
 * Kategorie mit Kindern (rekursiv)
 */
export const CategoryTreeNodeSchema: z.ZodType<CategoryTreeNode> = CategoryBaseSchema.extend({
  children: z.lazy(() => z.array(CategoryTreeNodeSchema)),
});

export interface CategoryTreeNode extends CategoryBase {
  children: CategoryTreeNode[];
}

/**
 * Kategorie mit zugehörigen Attribut-Definitionen
 */
export const CategoryWithAttributesSchema = CategoryBaseSchema.extend({
  attributeDefinitions: z.array(
    z.object({
      id: UUIDSchema,
      name: z.string(),
      displayName: LocalizedStringSchema,
      unit: z.string().nullable(),
      dataType: z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN']),
      scope: z.enum(['COMPONENT', 'PART', 'BOTH']),
      isFilterable: z.boolean(),
      isRequired: z.boolean(),
      sortOrder: z.number(),
    })
  ),
});

export type CategoryWithAttributes = z.infer<typeof CategoryWithAttributesSchema>;

// ============================================
// CATEGORY QUERY SCHEMAS
// ============================================

/**
 * Query-Parameter für Kategorie-Liste
 */
export const CategoryListQuerySchema = PaginationSchema.merge(SortSchema).extend({
  level: z.coerce.number().int().min(0).max(4).optional(),
  parentId: UUIDSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
});

export type CategoryListQuery = z.infer<typeof CategoryListQuerySchema>;

/**
 * Query für Kategorie-Baum
 */
export const CategoryTreeQuerySchema = z.object({
  rootId: UUIDSchema.optional(), // Starte von dieser Kategorie
  maxDepth: z.coerce.number().int().min(0).max(4).default(4),
  includeInactive: z.coerce.boolean().default(false),
});

export type CategoryTreeQuery = z.infer<typeof CategoryTreeQuerySchema>;

// ============================================
// CATEGORY PATH SCHEMA
// ============================================

/**
 * Kategorie-Pfad (Breadcrumb)
 */
export const CategoryPathSchema = z.array(
  z.object({
    id: UUIDSchema,
    name: LocalizedStringSchema,
    slug: z.string(),
    level: z.number(),
  })
);

export type CategoryPath = z.infer<typeof CategoryPathSchema>;

// ============================================
// CATEGORY MUTATION SCHEMAS
// ============================================

/**
 * Schema zum Erstellen einer Kategorie
 */
export const CreateCategorySchema = z.object({
  name: LocalizedStringSchema,
  parentId: UUIDSchema.optional().nullable(),
  description: z.object({
    de: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  iconUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

/**
 * Schema zum Aktualisieren einer Kategorie
 */
export const UpdateCategorySchema = z.object({
  name: LocalizedStringSchema.optional(),
  parentId: UUIDSchema.optional().nullable(),
  description: z.object({
    de: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  iconUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
