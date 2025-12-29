-- AlterEnum
ALTER TYPE "FileType" ADD VALUE 'MODEL_3D';

-- AlterTable
ALTER TABLE "FileAttachment" ADD COLUMN     "packageId" UUID;

-- CreateIndex
CREATE INDEX "FileAttachment_packageId_idx" ON "FileAttachment"("packageId");

-- AddForeignKey
ALTER TABLE "FileAttachment" ADD CONSTRAINT "FileAttachment_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "PackageMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
