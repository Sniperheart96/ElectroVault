-- CreateEnum
CREATE TYPE "ImportSourceType" AS ENUM ('API_MOUSER', 'API_DIGIKEY', 'API_FARNELL', 'API_LCSC', 'API_TME', 'API_REICHELT', 'API_CUSTOM', 'FILE_CSV', 'FILE_XML', 'FILE_JSON');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'CONFLICT', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportMappingType" AS ENUM ('ATTRIBUTE', 'CATEGORY', 'MANUFACTURER', 'UNIT');

-- CreateTable
CREATE TABLE "ImportSource" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "sourceType" "ImportSourceType" NOT NULL,
    "apiBaseUrl" VARCHAR(512),
    "apiKeyEncrypted" TEXT,
    "apiSecretEncrypted" TEXT,
    "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,

    CONSTRAINT "ImportSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportMapping" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "mappingType" "ImportMappingType" NOT NULL,
    "sourceKey" VARCHAR(255) NOT NULL,
    "sourceValue" VARCHAR(255),
    "targetAttributeId" UUID,
    "targetCategoryId" UUID,
    "targetManufacturerId" UUID,
    "conversionFactor" DECIMAL(20,10),
    "conversionOffset" DECIMAL(20,10),
    "parsePattern" VARCHAR(512),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,

    CONSTRAINT "ImportMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "processedItems" INTEGER NOT NULL DEFAULT 0,
    "successItems" INTEGER NOT NULL DEFAULT 0,
    "conflictItems" INTEGER NOT NULL DEFAULT 0,
    "failedItems" INTEGER NOT NULL DEFAULT 0,
    "skippedItems" INTEGER NOT NULL DEFAULT 0,
    "draftItems" INTEGER NOT NULL DEFAULT 0,
    "fileName" VARCHAR(255),
    "filePath" VARCHAR(512),
    "searchQuery" TEXT,
    "options" JSONB NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJobItem" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "status" "ImportItemStatus" NOT NULL DEFAULT 'PENDING',
    "rawData" JSONB NOT NULL,
    "parsedMpn" VARCHAR(255),
    "parsedManufacturer" VARCHAR(255),
    "parsedCategory" VARCHAR(255),
    "parsedAttributes" JSONB,
    "createdComponentId" UUID,
    "createdPartId" UUID,
    "resultStatus" "ComponentStatus",
    "existingPartId" UUID,
    "conflictData" JSONB,
    "conflictResolution" JSONB,
    "missingRequiredFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "rowNumber" INTEGER,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJobItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportUnmappedAttribute" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "sourceKey" VARCHAR(255) NOT NULL,
    "sampleValues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedMappingId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportUnmappedAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImportSource_slug_key" ON "ImportSource"("slug");

-- CreateIndex
CREATE INDEX "ImportSource_sourceType_idx" ON "ImportSource"("sourceType");

-- CreateIndex
CREATE INDEX "ImportSource_isActive_idx" ON "ImportSource"("isActive");

-- CreateIndex
CREATE INDEX "ImportMapping_sourceId_mappingType_idx" ON "ImportMapping"("sourceId", "mappingType");

-- CreateIndex
CREATE INDEX "ImportMapping_sourceKey_idx" ON "ImportMapping"("sourceKey");

-- CreateIndex
CREATE INDEX "ImportMapping_priority_idx" ON "ImportMapping"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "ImportMapping_sourceId_mappingType_sourceKey_sourceValue_key" ON "ImportMapping"("sourceId", "mappingType", "sourceKey", "sourceValue");

-- CreateIndex
CREATE INDEX "ImportJob_sourceId_idx" ON "ImportJob"("sourceId");

-- CreateIndex
CREATE INDEX "ImportJob_status_idx" ON "ImportJob"("status");

-- CreateIndex
CREATE INDEX "ImportJob_createdById_idx" ON "ImportJob"("createdById");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ImportJobItem_jobId_idx" ON "ImportJobItem"("jobId");

-- CreateIndex
CREATE INDEX "ImportJobItem_status_idx" ON "ImportJobItem"("status");

-- CreateIndex
CREATE INDEX "ImportJobItem_parsedMpn_idx" ON "ImportJobItem"("parsedMpn");

-- CreateIndex
CREATE INDEX "ImportJobItem_resultStatus_idx" ON "ImportJobItem"("resultStatus");

-- CreateIndex
CREATE INDEX "ImportUnmappedAttribute_sourceId_idx" ON "ImportUnmappedAttribute"("sourceId");

-- CreateIndex
CREATE INDEX "ImportUnmappedAttribute_isResolved_idx" ON "ImportUnmappedAttribute"("isResolved");

-- CreateIndex
CREATE UNIQUE INDEX "ImportUnmappedAttribute_sourceId_sourceKey_key" ON "ImportUnmappedAttribute"("sourceId", "sourceKey");

-- AddForeignKey
ALTER TABLE "ImportSource" ADD CONSTRAINT "ImportSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportMapping" ADD CONSTRAINT "ImportMapping_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ImportSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportMapping" ADD CONSTRAINT "ImportMapping_targetAttributeId_fkey" FOREIGN KEY ("targetAttributeId") REFERENCES "AttributeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportMapping" ADD CONSTRAINT "ImportMapping_targetCategoryId_fkey" FOREIGN KEY ("targetCategoryId") REFERENCES "CategoryTaxonomy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportMapping" ADD CONSTRAINT "ImportMapping_targetManufacturerId_fkey" FOREIGN KEY ("targetManufacturerId") REFERENCES "ManufacturerMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportMapping" ADD CONSTRAINT "ImportMapping_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ImportSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJobItem" ADD CONSTRAINT "ImportJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJobItem" ADD CONSTRAINT "ImportJobItem_createdComponentId_fkey" FOREIGN KEY ("createdComponentId") REFERENCES "CoreComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJobItem" ADD CONSTRAINT "ImportJobItem_createdPartId_fkey" FOREIGN KEY ("createdPartId") REFERENCES "ManufacturerPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportUnmappedAttribute" ADD CONSTRAINT "ImportUnmappedAttribute_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ImportSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
