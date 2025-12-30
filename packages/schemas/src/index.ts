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
  LocalizedStringLooseSchema,
  LocalizedStringLooseOptionalSchema,
  LocalizedStringNullableSchema,
  LocalizedStringNullableOptionalSchema,
  type LocalizedString,
  type LocalizedStringLoose,
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
  PinTypeSchema,
  AuditActionSchema,
  ImageTypeSchema,
  EcadFormatSchema,
  FileTypeSchema,
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
  type PinType,
  type AuditAction,
  type ImageType,
  type EcadFormat,
  type FileType,
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
  // Input Schemas
  CreateCategorySchema,
  UpdateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  // Reorder Schemas
  ReorderCategoryItemSchema,
  BulkReorderCategoriesSchema,
  type ReorderCategoryItem,
  type BulkReorderCategoriesInput,
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
  // PackageGroup Schemas
  PackageGroupBaseSchema,
  PackageGroupWithCountSchema,
  CreatePackageGroupSchema,
  UpdatePackageGroupSchema,
  PackageGroupListQuerySchema,
  type PackageGroupBase,
  type PackageGroupWithCount,
  type CreatePackageGroupInput,
  type UpdatePackageGroupInput,
  type PackageGroupListQuery,
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
  // SI-Präfix System
  SI_PREFIXES,
  COMMON_PREFIX_SETS,
  SIPrefixSchema,
  type SIPrefix,
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
  UpdateConceptRelationSchema,
  ConceptRelationWithTargetSchema,
  ConceptRelationWithSourceSchema,
  ComponentRelationsResponseSchema,
  type ConceptRelation,
  type CreateConceptRelationInput,
  type UpdateConceptRelationInput,
  type ConceptRelationWithTarget,
  type ConceptRelationWithSource,
  type ComponentRelationsResponse,
  // Pin Mapping Schemas (gehört zu CoreComponent)
  PinMappingSchema,
  CreatePinMappingSchema,
  type PinMapping,
  type CreatePinMappingInput,
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
  AttributeFilterOperatorSchema,
  AttributeFilterSchema,
  MultiSelectModeSchema,
  ComponentSearchQuerySchema,
  type ComponentListQuery,
  type AttributeFilterOperator,
  type AttributeFilter,
  type MultiSelectMode,
  type ComponentSearchQuery,
} from './component';

// ============================================
// PART SCHEMAS
// ============================================
export {
  // Sub-Schemas
  HazardousMaterialSchema,
  PartAttributeValueSchema,
  PartRelationshipSchema,
  DatasheetSchema,
  PartImageSchema,
  type HazardousMaterial,
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
  CreateDatasheetSchema,
  CreatePartImageSchema,
  CreatePartRelationshipSchema,
  CreatePartSchema,
  UpdatePartSchema,
  SetPartAttributeValuesSchema,
  type CreateHazardousMaterialInput,
  type CreateDatasheetInput,
  type CreatePartImageInput,
  type CreatePartRelationshipInput,
  type CreatePartInput,
  type UpdatePartInput,
  type SetPartAttributeValuesInput,
  // Query Schemas
  PartListQuerySchema,
  type PartListQuery,
} from './part';

// ============================================
// ATTRIBUTE SCHEMAS
// ============================================
export {
  // Response Schemas (AttributeDefinitionSchema bereits aus component.ts exportiert)
  AttributeWithCategorySchema,
  type AttributeWithCategory,
  // Input Schemas
  CreateAttributeDefinitionSchema,
  UpdateAttributeDefinitionSchema,
  type CreateAttributeDefinitionInput,
  type UpdateAttributeDefinitionInput,
  // Query Schemas
  AttributeListQuerySchema,
  CategoryAttributesQuerySchema,
  type AttributeListQuery,
  type CategoryAttributesQuery,
  // Reorder Schemas
  ReorderAttributesSchema,
  type ReorderAttributesInput,
} from './attribute';

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

// ============================================
// PIN SCHEMAS
// ============================================
export {
  // Response Schemas (PinMappingSchema exported from component.ts)
  // Input Schemas
  CreatePinSchema,
  UpdatePinSchema,
  BulkCreatePinsSchema,
  ReorderPinSchema,
  BulkReorderPinsSchema,
  type CreatePinInput,
  type UpdatePinInput,
  type BulkCreatePinsInput,
  type ReorderPinInput,
  type BulkReorderPinsInput,
} from './pin';

// ============================================
// LOCALE SCHEMAS
// ============================================
export {
  // UI-Sprachen
  SUPPORTED_UI_LOCALES,
  DEFAULT_UI_LOCALE,
  UILocaleSchema,
  type UILocale,
  // User Preferences
  UserPreferencesSchema,
  type UserPreferences,
  // Cookie Konstanten
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE,
  // RTL-Utilities
  RTL_LOCALES,
  isRTL,
  // Locale Metadaten
  LOCALE_METADATA,
  getLocaleMetadata,
} from './locale';

// ============================================
// IMPORT SCHEMAS
// ============================================
export {
  // Enums
  ImportSourceTypeSchema,
  ImportJobStatusSchema,
  ImportItemStatusSchema,
  ImportMappingTypeSchema,
  type ImportSourceType,
  type ImportJobStatus,
  type ImportItemStatus,
  type ImportMappingType,
  // Import Source Schemas
  ImportSourceSchema,
  ImportSourceWithStatsSchema,
  CreateImportSourceSchema,
  UpdateImportSourceSchema,
  ImportSourceListQuerySchema,
  type ImportSource,
  type ImportSourceWithStats,
  type CreateImportSourceInput,
  type UpdateImportSourceInput,
  type ImportSourceListQuery,
  // Import Mapping Schemas
  ImportMappingSchema,
  ImportMappingWithRelationsSchema,
  CreateImportMappingSchema,
  UpdateImportMappingSchema,
  ImportMappingListQuerySchema,
  BulkCreateMappingsSchema,
  type ImportMapping,
  type ImportMappingWithRelations,
  type CreateImportMappingInput,
  type UpdateImportMappingInput,
  type ImportMappingListQuery,
  type BulkCreateMappingsInput,
  // Import Job Schemas
  ImportJobSchema,
  ImportJobWithSourceSchema,
  CreateFileImportJobSchema,
  CreateApiImportJobSchema,
  ImportJobListQuerySchema,
  type ImportJob,
  type ImportJobWithSource,
  type CreateFileImportJobInput,
  type CreateApiImportJobInput,
  type ImportJobListQuery,
  // Import Job Item Schemas
  ImportJobItemSchema,
  ImportJobItemWithRelationsSchema,
  ImportJobItemListQuerySchema,
  ResolveConflictSchema,
  BulkResolveConflictsSchema,
  type ImportJobItem,
  type ImportJobItemWithRelations,
  type ImportJobItemListQuery,
  type ResolveConflictInput,
  type BulkResolveConflictsInput,
  // Unmapped Attribute Schemas
  ImportUnmappedAttributeSchema,
  ImportUnmappedAttributeWithSourceSchema,
  ImportUnmappedAttributeListQuerySchema,
  MapUnmappedAttributeSchema,
  type ImportUnmappedAttribute,
  type ImportUnmappedAttributeWithSource,
  type ImportUnmappedAttributeListQuery,
  type MapUnmappedAttributeInput,
  // Preview Schemas
  MappingPreviewInputSchema,
  MappingPreviewResultSchema,
  type MappingPreviewInput,
  type MappingPreviewResult,
  // Value Parser
  ParsedValueSchema,
  type ParsedValue,
} from './import';
