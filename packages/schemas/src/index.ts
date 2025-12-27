/**
 * ElectroVault Schemas - Zentrale Zod-Validierungsschemas
 *
 * Dieses Package enthält alle API-Validierungsschemas, die sowohl
 * im Frontend als auch im Backend verwendet werden können.
 */

// ============================================
// COMMON SCHEMAS
// ============================================
export {
  // Localized String
  LocalizedStringSchema,
  LocalizedStringOptionalSchema,
  type LocalizedString,
  // Common Validators
  UUIDSchema,
  SlugSchema,
  PaginationSchema,
  SortSchema,
  type PaginationInput,
  type SortInput,
  // Paginated Response Factory
  createPaginatedResponseSchema,
  // Enums
  UserRoleSchema,
  ComponentStatusSchema,
  PartStatusSchema,
  LifecycleStatusSchema,
  ManufacturerStatusSchema,
  MountingTypeSchema,
  AttributeDataTypeSchema,
  AttributeScopeSchema,
  RelationshipTypeSchema,
  ConceptRelationTypeSchema,
  HazardousMaterialTypeSchema,
  AuditActionSchema,
  type UserRole,
  type ComponentStatus,
  type PartStatus,
  type LifecycleStatus,
  type ManufacturerStatus,
  type MountingType,
  type AttributeDataType,
  type AttributeScope,
  type RelationshipType,
  type ConceptRelationType,
  type HazardousMaterialType,
  type AuditAction,
  // API Response Schemas
  ErrorResponseSchema,
  createSuccessResponseSchema,
  type ErrorResponse,
} from './common';

// ============================================
// CATEGORY SCHEMAS
// ============================================
export {
  // Response Schemas
  CategoryBaseSchema,
  CategoryWithParentSchema,
  CategoryTreeNodeSchema,
  CategoryWithAttributesSchema,
  CategoryPathSchema,
  type CategoryBase,
  type CategoryWithParent,
  type CategoryTreeNode,
  type CategoryWithAttributes,
  type CategoryPath,
  // Query Schemas
  CategoryListQuerySchema,
  CategoryTreeQuerySchema,
  type CategoryListQuery,
  type CategoryTreeQuery,
} from './category';

// ============================================
// MANUFACTURER SCHEMAS
// ============================================
export {
  // Response Schemas
  ManufacturerAliasSchema,
  ManufacturerBaseSchema,
  ManufacturerWithAliasesSchema,
  ManufacturerFullSchema,
  type ManufacturerAlias,
  type ManufacturerBase,
  type ManufacturerWithAliases,
  type ManufacturerFull,
  // Input Schemas
  CreateManufacturerSchema,
  UpdateManufacturerSchema,
  type CreateManufacturerInput,
  type UpdateManufacturerInput,
  // Query Schemas
  ManufacturerListQuerySchema,
  type ManufacturerListQuery,
} from './manufacturer';

// ============================================
// PACKAGE SCHEMAS
// ============================================
export {
  // Response Schemas
  PackageBaseSchema,
  EcadFootprintSchema,
  PackageWithFootprintsSchema,
  type PackageBase,
  type EcadFootprint,
  type PackageWithFootprints,
  // Input Schemas
  CreatePackageSchema,
  UpdatePackageSchema,
  CreateFootprintSchema,
  type CreatePackageInput,
  type UpdatePackageInput,
  type CreateFootprintInput,
  // Query Schemas
  PackageListQuerySchema,
  type PackageListQuery,
} from './package';

// ============================================
// COMPONENT SCHEMAS
// ============================================
export {
  // Attribute Schemas
  AttributeDefinitionSchema,
  ComponentAttributeValueSchema,
  CreateAttributeValueSchema,
  type AttributeDefinition,
  type ComponentAttributeValue,
  type CreateAttributeValueInput,
  // Concept Relation Schemas
  ConceptRelationSchema,
  CreateConceptRelationSchema,
  type ConceptRelation,
  type CreateConceptRelationInput,
  // Response Schemas
  ComponentBaseSchema,
  ComponentWithCategorySchema,
  ComponentFullSchema,
  ComponentListItemSchema,
  type ComponentBase,
  type ComponentWithCategory,
  type ComponentFull,
  type ComponentListItem,
  // Input Schemas
  CreateComponentSchema,
  UpdateComponentSchema,
  ChangeCategorySchema,
  type CreateComponentInput,
  type UpdateComponentInput,
  type ChangeCategoryInput,
  // Query Schemas
  ComponentListQuerySchema,
  AttributeFilterSchema,
  ComponentSearchQuerySchema,
  type ComponentListQuery,
  type AttributeFilter,
  type ComponentSearchQuery,
} from './component';

// ============================================
// PART SCHEMAS
// ============================================
export {
  // Sub-Schemas
  HazardousMaterialSchema,
  PinMappingSchema,
  PartAttributeValueSchema,
  PartRelationshipSchema,
  DatasheetSchema,
  PartImageSchema,
  type HazardousMaterial,
  type PinMapping,
  type PartAttributeValue,
  type PartRelationship,
  type Datasheet,
  type PartImage,
  // Response Schemas
  PartBaseSchema,
  PartWithRelationsSchema,
  PartFullSchema,
  PartListItemSchema,
  type PartBase,
  type PartWithRelations,
  type PartFull,
  type PartListItem,
  // Input Schemas
  CreateHazardousMaterialSchema,
  CreatePinMappingSchema,
  CreateDatasheetSchema,
  CreatePartImageSchema,
  CreatePartRelationshipSchema,
  CreatePartSchema,
  UpdatePartSchema,
  type CreateHazardousMaterialInput,
  type CreatePinMappingInput,
  type CreateDatasheetInput,
  type CreatePartImageInput,
  type CreatePartRelationshipInput,
  type CreatePartInput,
  type UpdatePartInput,
  // Query Schemas
  PartListQuerySchema,
  type PartListQuery,
} from './part';

// ============================================
// AUDIT SCHEMAS
// ============================================
export {
  // Response Schemas
  AuditLogEntrySchema,
  ChangeDiffSchema,
  AuditLogDetailSchema,
  type AuditLogEntry,
  type ChangeDiff,
  type AuditLogDetail,
  // Input Schemas
  CreateAuditLogSchema,
  type CreateAuditLogInput,
  // Query Schemas
  AuditLogQuerySchema,
  EntityHistoryQuerySchema,
  type AuditLogQuery,
  type EntityHistoryQuery,
} from './audit';
