-- Add SELECT and MULTISELECT to AttributeDataType enum
ALTER TYPE "AttributeDataType" ADD VALUE 'SELECT';
ALTER TYPE "AttributeDataType" ADD VALUE 'MULTISELECT';

-- Add allowedValues column to AttributeDefinition
ALTER TABLE "AttributeDefinition" ADD COLUMN "allowedValues" JSONB;
