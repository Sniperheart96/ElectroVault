/*
  Warnings:

  - You are about to drop the column `language` on the `FileAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `FileAttachment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "FileAttachment" DROP COLUMN "language",
DROP COLUMN "version",
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ManufacturerPart" ADD COLUMN     "imageUrl" VARCHAR(512);
