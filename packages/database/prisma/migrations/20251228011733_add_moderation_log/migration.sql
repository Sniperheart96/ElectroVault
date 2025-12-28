-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('DATASHEET', 'IMAGE', 'PINOUT', 'OTHER');

-- CreateTable
CREATE TABLE "FileAttachment" (
    "id" UUID NOT NULL,
    "originalName" VARCHAR(255) NOT NULL,
    "sanitizedName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "fileType" "FileType" NOT NULL,
    "bucketName" VARCHAR(100) NOT NULL,
    "bucketPath" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(50),
    "language" VARCHAR(10),
    "componentId" UUID,
    "partId" UUID,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FileAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationLog" (
    "id" UUID NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "previousStatus" VARCHAR(50),
    "newStatus" VARCHAR(50) NOT NULL,
    "comment" TEXT,
    "moderatorId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileAttachment_bucketPath_key" ON "FileAttachment"("bucketPath");

-- CreateIndex
CREATE INDEX "FileAttachment_componentId_idx" ON "FileAttachment"("componentId");

-- CreateIndex
CREATE INDEX "FileAttachment_partId_idx" ON "FileAttachment"("partId");

-- CreateIndex
CREATE INDEX "FileAttachment_fileType_idx" ON "FileAttachment"("fileType");

-- CreateIndex
CREATE INDEX "FileAttachment_uploadedById_idx" ON "FileAttachment"("uploadedById");

-- CreateIndex
CREATE INDEX "FileAttachment_deletedAt_idx" ON "FileAttachment"("deletedAt");

-- CreateIndex
CREATE INDEX "FileAttachment_bucketPath_idx" ON "FileAttachment"("bucketPath");

-- CreateIndex
CREATE INDEX "ModerationLog_entityType_entityId_idx" ON "ModerationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ModerationLog_moderatorId_idx" ON "ModerationLog"("moderatorId");

-- CreateIndex
CREATE INDEX "ModerationLog_createdAt_idx" ON "ModerationLog"("createdAt");

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "CoreComponent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_partId_fkey" FOREIGN KEY ("partId") REFERENCES "ManufacturerPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationLog" ADD CONSTRAINT "ModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
