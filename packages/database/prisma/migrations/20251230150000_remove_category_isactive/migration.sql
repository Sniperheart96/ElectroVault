-- Remove isActive column from CategoryTaxonomy
-- This column is no longer needed as all categories are always active

ALTER TABLE "CategoryTaxonomy" DROP COLUMN IF EXISTS "isActive";
