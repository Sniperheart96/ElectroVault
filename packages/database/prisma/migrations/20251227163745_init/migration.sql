-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MODERATOR', 'CONTRIBUTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ComponentStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('DRAFT', 'PENDING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LifecycleStatus" AS ENUM ('ACTIVE', 'NRND', 'EOL', 'OBSOLETE');

-- CreateEnum
CREATE TYPE "ManufacturerStatus" AS ENUM ('ACTIVE', 'ACQUIRED', 'DEFUNCT');

-- CreateEnum
CREATE TYPE "MountingType" AS ENUM ('THT', 'SMD', 'RADIAL', 'AXIAL', 'CHASSIS', 'OTHER');

-- CreateEnum
CREATE TYPE "AttributeDataType" AS ENUM ('DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN', 'RANGE');

-- CreateEnum
CREATE TYPE "AttributeScope" AS ENUM ('COMPONENT', 'PART', 'BOTH');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('SUCCESSOR', 'PREDECESSOR', 'ALTERNATIVE', 'FUNCTIONAL_EQUIV', 'VARIANT', 'SECOND_SOURCE', 'COUNTERFEIT_RISK');

-- CreateEnum
CREATE TYPE "ConceptRelationType" AS ENUM ('DUAL_VERSION', 'QUAD_VERSION', 'LOW_POWER_VERSION', 'HIGH_SPEED_VERSION', 'MILITARY_VERSION', 'AUTOMOTIVE_VERSION', 'FUNCTIONAL_EQUIV');

-- CreateEnum
CREATE TYPE "HazardousMaterialType" AS ENUM ('PCB_CAPACITOR', 'ASBESTOS', 'MERCURY', 'RADIOACTIVE', 'LEAD', 'CADMIUM', 'BERYLLIUM', 'OTHER');

-- CreateEnum
CREATE TYPE "PinType" AS ENUM ('POWER', 'GROUND', 'INPUT', 'OUTPUT', 'BIDIRECTIONAL', 'NC', 'ANALOG', 'DIGITAL', 'CLOCK', 'OTHER');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('PHOTO', 'DIAGRAM', 'PINOUT', 'APPLICATION', 'OTHER');

-- CreateEnum
CREATE TYPE "EcadFormat" AS ENUM ('KICAD', 'EAGLE', 'ALTIUM', 'ORCAD', 'STEP', 'OTHER');

-- CreateEnum
CREATE TYPE "EcadModelType" AS ENUM ('SYMBOL', 'FOOTPRINT', 'MODEL_3D');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'MERGE', 'APPROVE', 'REJECT');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(255),
    "avatarUrl" VARCHAR(512),
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "bio" TEXT,
    "location" VARCHAR(255),
    "website" VARCHAR(512),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTaxonomy" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "level" INTEGER NOT NULL,
    "parentId" UUID,
    "description" JSONB,
    "iconUrl" VARCHAR(512),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CategoryTaxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerMaster" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "cageCode" VARCHAR(5),
    "countryCode" VARCHAR(2),
    "website" VARCHAR(512),
    "logoUrl" VARCHAR(512),
    "acquiredById" UUID,
    "acquisitionDate" TIMESTAMP(3),
    "status" "ManufacturerStatus" NOT NULL DEFAULT 'ACTIVE',
    "foundedYear" INTEGER,
    "defunctYear" INTEGER,
    "description" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,

    CONSTRAINT "ManufacturerMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerAlias" (
    "id" UUID NOT NULL,
    "manufacturerId" UUID NOT NULL,
    "aliasName" VARCHAR(255) NOT NULL,
    "aliasType" VARCHAR(50),

    CONSTRAINT "ManufacturerAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageMaster" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "lengthMm" DECIMAL(10,4),
    "widthMm" DECIMAL(10,4),
    "heightMm" DECIMAL(10,4),
    "pitchMm" DECIMAL(10,4),
    "mountingType" "MountingType" NOT NULL,
    "pinCount" INTEGER,
    "pinCountMin" INTEGER,
    "pinCountMax" INTEGER,
    "jedecStandard" VARCHAR(100),
    "eiaStandard" VARCHAR(100),
    "drawingUrl" VARCHAR(512),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreComponent" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "series" VARCHAR(255),
    "categoryId" UUID NOT NULL,
    "shortDescription" JSONB,
    "fullDescription" JSONB,
    "commonAttributes" JSONB NOT NULL DEFAULT '{}',
    "status" "ComponentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "lastEditedById" UUID,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,

    CONSTRAINT "CoreComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentConceptRelation" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "relationType" "ConceptRelationType" NOT NULL,
    "notes" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentConceptRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerPart" (
    "id" UUID NOT NULL,
    "coreComponentId" UUID NOT NULL,
    "manufacturerId" UUID NOT NULL,
    "mpn" VARCHAR(255) NOT NULL,
    "orderingCode" VARCHAR(255),
    "packageId" UUID,
    "weightGrams" DECIMAL(10,4),
    "dateCodeFormat" VARCHAR(50),
    "introductionYear" INTEGER,
    "discontinuedYear" INTEGER,
    "rohsCompliant" BOOLEAN,
    "reachCompliant" BOOLEAN,
    "nsn" VARCHAR(13),
    "milSpec" VARCHAR(100),
    "status" "PartStatus" NOT NULL DEFAULT 'DRAFT',
    "lifecycleStatus" "LifecycleStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "lastEditedById" UUID,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,

    CONSTRAINT "ManufacturerPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeDefinition" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "displayName" JSONB NOT NULL,
    "unit" VARCHAR(50),
    "dataType" "AttributeDataType" NOT NULL,
    "scope" "AttributeScope" NOT NULL DEFAULT 'PART',
    "isFilterable" BOOLEAN NOT NULL DEFAULT true,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "siUnit" VARCHAR(20),
    "siMultiplier" DECIMAL(20,10),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AttributeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComponentAttributeValue" (
    "id" UUID NOT NULL,
    "componentId" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "displayValue" VARCHAR(255) NOT NULL,
    "normalizedValue" DECIMAL(30,15),
    "normalizedMin" DECIMAL(30,15),
    "normalizedMax" DECIMAL(30,15),
    "stringValue" VARCHAR(255),

    CONSTRAINT "ComponentAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartAttributeValue" (
    "id" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "displayValue" VARCHAR(255) NOT NULL,
    "normalizedValue" DECIMAL(30,15),
    "normalizedMin" DECIMAL(30,15),
    "normalizedMax" DECIMAL(30,15),
    "stringValue" VARCHAR(255),
    "isDeviation" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HazardousMaterial" (
    "id" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "materialType" "HazardousMaterialType" NOT NULL,
    "details" JSONB,

    CONSTRAINT "HazardousMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRelationship" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "confidence" INTEGER NOT NULL DEFAULT 100,
    "notes" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinMapping" (
    "id" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "pinNumber" VARCHAR(20) NOT NULL,
    "pinName" VARCHAR(100) NOT NULL,
    "pinFunction" JSONB,
    "pinType" "PinType",
    "maxVoltage" DECIMAL(10,4),
    "maxCurrent" DECIMAL(10,4),

    CONSTRAINT "PinMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartDatasheet" (
    "id" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "fileName" VARCHAR(255),
    "fileSize" INTEGER,
    "mimeType" VARCHAR(100),
    "version" VARCHAR(50),
    "language" VARCHAR(10),
    "publishDate" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "PartDatasheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartImage" (
    "id" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "thumbnailUrl" VARCHAR(512),
    "altText" VARCHAR(255),
    "imageType" "ImageType" NOT NULL DEFAULT 'PHOTO',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "PartImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcadFootprint" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "ecadFormat" "EcadFormat" NOT NULL,
    "fileUrl" VARCHAR(512) NOT NULL,
    "ipcName" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "EcadFootprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartEcadModel" (
    "id" UUID NOT NULL,
    "partId" UUID NOT NULL,
    "modelType" "EcadModelType" NOT NULL,
    "ecadFormat" "EcadFormat" NOT NULL,
    "fileUrl" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "PartEcadModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" UUID NOT NULL,
    "changes" JSONB,
    "ipAddress" VARCHAR(45),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_externalId_idx" ON "User"("externalId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTaxonomy_slug_key" ON "CategoryTaxonomy"("slug");

-- CreateIndex
CREATE INDEX "CategoryTaxonomy_parentId_idx" ON "CategoryTaxonomy"("parentId");

-- CreateIndex
CREATE INDEX "CategoryTaxonomy_level_idx" ON "CategoryTaxonomy"("level");

-- CreateIndex
CREATE INDEX "CategoryTaxonomy_slug_idx" ON "CategoryTaxonomy"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerMaster_slug_key" ON "ManufacturerMaster"("slug");

-- CreateIndex
CREATE INDEX "ManufacturerMaster_cageCode_idx" ON "ManufacturerMaster"("cageCode");

-- CreateIndex
CREATE INDEX "ManufacturerMaster_slug_idx" ON "ManufacturerMaster"("slug");

-- CreateIndex
CREATE INDEX "ManufacturerAlias_aliasName_idx" ON "ManufacturerAlias"("aliasName");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerAlias_manufacturerId_aliasName_key" ON "ManufacturerAlias"("manufacturerId", "aliasName");

-- CreateIndex
CREATE UNIQUE INDEX "PackageMaster_slug_key" ON "PackageMaster"("slug");

-- CreateIndex
CREATE INDEX "PackageMaster_mountingType_idx" ON "PackageMaster"("mountingType");

-- CreateIndex
CREATE INDEX "PackageMaster_slug_idx" ON "PackageMaster"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CoreComponent_slug_key" ON "CoreComponent"("slug");

-- CreateIndex
CREATE INDEX "CoreComponent_categoryId_idx" ON "CoreComponent"("categoryId");

-- CreateIndex
CREATE INDEX "CoreComponent_status_idx" ON "CoreComponent"("status");

-- CreateIndex
CREATE INDEX "CoreComponent_deletedAt_idx" ON "CoreComponent"("deletedAt");

-- CreateIndex
CREATE INDEX "ComponentConceptRelation_sourceId_idx" ON "ComponentConceptRelation"("sourceId");

-- CreateIndex
CREATE INDEX "ComponentConceptRelation_targetId_idx" ON "ComponentConceptRelation"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentConceptRelation_sourceId_targetId_relationType_key" ON "ComponentConceptRelation"("sourceId", "targetId", "relationType");

-- CreateIndex
CREATE INDEX "ManufacturerPart_mpn_idx" ON "ManufacturerPart"("mpn");

-- CreateIndex
CREATE INDEX "ManufacturerPart_coreComponentId_idx" ON "ManufacturerPart"("coreComponentId");

-- CreateIndex
CREATE INDEX "ManufacturerPart_manufacturerId_idx" ON "ManufacturerPart"("manufacturerId");

-- CreateIndex
CREATE INDEX "ManufacturerPart_packageId_idx" ON "ManufacturerPart"("packageId");

-- CreateIndex
CREATE INDEX "ManufacturerPart_nsn_idx" ON "ManufacturerPart"("nsn");

-- CreateIndex
CREATE INDEX "ManufacturerPart_status_idx" ON "ManufacturerPart"("status");

-- CreateIndex
CREATE INDEX "ManufacturerPart_lifecycleStatus_idx" ON "ManufacturerPart"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "ManufacturerPart_deletedAt_idx" ON "ManufacturerPart"("deletedAt");

-- CreateIndex
CREATE INDEX "ManufacturerPart_orderingCode_idx" ON "ManufacturerPart"("orderingCode");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerPart_manufacturerId_mpn_key" ON "ManufacturerPart"("manufacturerId", "mpn");

-- CreateIndex
CREATE INDEX "AttributeDefinition_categoryId_idx" ON "AttributeDefinition"("categoryId");

-- CreateIndex
CREATE INDEX "AttributeDefinition_scope_idx" ON "AttributeDefinition"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeDefinition_categoryId_name_key" ON "AttributeDefinition"("categoryId", "name");

-- CreateIndex
CREATE INDEX "ComponentAttributeValue_componentId_idx" ON "ComponentAttributeValue"("componentId");

-- CreateIndex
CREATE INDEX "ComponentAttributeValue_definitionId_idx" ON "ComponentAttributeValue"("definitionId");

-- CreateIndex
CREATE INDEX "ComponentAttributeValue_normalizedValue_idx" ON "ComponentAttributeValue"("normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "ComponentAttributeValue_componentId_definitionId_key" ON "ComponentAttributeValue"("componentId", "definitionId");

-- CreateIndex
CREATE INDEX "PartAttributeValue_partId_idx" ON "PartAttributeValue"("partId");

-- CreateIndex
CREATE INDEX "PartAttributeValue_definitionId_idx" ON "PartAttributeValue"("definitionId");

-- CreateIndex
CREATE INDEX "PartAttributeValue_normalizedValue_idx" ON "PartAttributeValue"("normalizedValue");

-- CreateIndex
CREATE INDEX "PartAttributeValue_stringValue_idx" ON "PartAttributeValue"("stringValue");

-- CreateIndex
CREATE UNIQUE INDEX "PartAttributeValue_partId_definitionId_key" ON "PartAttributeValue"("partId", "definitionId");

-- CreateIndex
CREATE UNIQUE INDEX "HazardousMaterial_partId_materialType_key" ON "HazardousMaterial"("partId", "materialType");

-- CreateIndex
CREATE INDEX "PartRelationship_sourceId_idx" ON "PartRelationship"("sourceId");

-- CreateIndex
CREATE INDEX "PartRelationship_targetId_idx" ON "PartRelationship"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "PartRelationship_sourceId_targetId_relationshipType_key" ON "PartRelationship"("sourceId", "targetId", "relationshipType");

-- CreateIndex
CREATE INDEX "PinMapping_partId_idx" ON "PinMapping"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "PinMapping_partId_pinNumber_key" ON "PinMapping"("partId", "pinNumber");

-- CreateIndex
CREATE INDEX "PartDatasheet_partId_idx" ON "PartDatasheet"("partId");

-- CreateIndex
CREATE INDEX "PartImage_partId_idx" ON "PartImage"("partId");

-- CreateIndex
CREATE INDEX "EcadFootprint_packageId_idx" ON "EcadFootprint"("packageId");

-- CreateIndex
CREATE INDEX "EcadFootprint_ecadFormat_idx" ON "EcadFootprint"("ecadFormat");

-- CreateIndex
CREATE INDEX "PartEcadModel_partId_idx" ON "PartEcadModel"("partId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "CategoryTaxonomy" ADD CONSTRAINT "CategoryTaxonomy_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CategoryTaxonomy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerMaster" ADD CONSTRAINT "ManufacturerMaster_acquiredById_fkey" FOREIGN KEY ("acquiredById") REFERENCES "ManufacturerMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerMaster" ADD CONSTRAINT "ManufacturerMaster_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerAlias" ADD CONSTRAINT "ManufacturerAlias_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreComponent" ADD CONSTRAINT "CoreComponent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryTaxonomy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreComponent" ADD CONSTRAINT "CoreComponent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreComponent" ADD CONSTRAINT "CoreComponent_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreComponent" ADD CONSTRAINT "CoreComponent_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentConceptRelation" ADD CONSTRAINT "ComponentConceptRelation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CoreComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentConceptRelation" ADD CONSTRAINT "ComponentConceptRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "CoreComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentConceptRelation" ADD CONSTRAINT "ComponentConceptRelation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerPart" ADD CONSTRAINT "ManufacturerPart_coreComponentId_fkey" FOREIGN KEY ("coreComponentId") REFERENCES "CoreComponent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerPart" ADD CONSTRAINT "ManufacturerPart_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ManufacturerMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerPart" ADD CONSTRAINT "ManufacturerPart_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerPart" ADD CONSTRAINT "ManufacturerPart_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerPart" ADD CONSTRAINT "ManufacturerPart_lastEditedById_fkey" FOREIGN KEY ("lastEditedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerPart" ADD CONSTRAINT "ManufacturerPart_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributeDefinition" ADD CONSTRAINT "AttributeDefinition_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryTaxonomy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttributeValue" ADD CONSTRAINT "ComponentAttributeValue_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "CoreComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentAttributeValue" ADD CONSTRAINT "ComponentAttributeValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAttributeValue" ADD CONSTRAINT "PartAttributeValue_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartAttributeValue" ADD CONSTRAINT "PartAttributeValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "AttributeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HazardousMaterial" ADD CONSTRAINT "HazardousMaterial_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRelationship" ADD CONSTRAINT "PartRelationship_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRelationship" ADD CONSTRAINT "PartRelationship_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRelationship" ADD CONSTRAINT "PartRelationship_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinMapping" ADD CONSTRAINT "PinMapping_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartDatasheet" ADD CONSTRAINT "PartDatasheet_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartDatasheet" ADD CONSTRAINT "PartDatasheet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartImage" ADD CONSTRAINT "PartImage_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartImage" ADD CONSTRAINT "PartImage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcadFootprint" ADD CONSTRAINT "EcadFootprint_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EcadFootprint" ADD CONSTRAINT "EcadFootprint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartEcadModel" ADD CONSTRAINT "PartEcadModel_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartEcadModel" ADD CONSTRAINT "PartEcadModel_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
