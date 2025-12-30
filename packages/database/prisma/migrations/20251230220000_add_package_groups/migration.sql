-- CreateTable: PackageGroup
CREATE TABLE "PackageGroup" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" JSONB NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PackageGroup_slug_key" ON "PackageGroup"("slug");

-- CreateIndex
CREATE INDEX "PackageGroup_slug_idx" ON "PackageGroup"("slug");

-- CreateIndex
CREATE INDEX "PackageGroup_sortOrder_idx" ON "PackageGroup"("sortOrder");

-- AlterTable: PackageMaster - Add groupId
ALTER TABLE "PackageMaster" ADD COLUMN "groupId" UUID;

-- CreateIndex
CREATE INDEX "PackageMaster_groupId_idx" ON "PackageMaster"("groupId");

-- AddForeignKey
ALTER TABLE "PackageMaster" ADD CONSTRAINT "PackageMaster_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PackageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: PackageMaster - Drop drawingUrl
ALTER TABLE "PackageMaster" DROP COLUMN IF EXISTS "drawingUrl";
