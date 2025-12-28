/**
 * Schema Tests - Validierung aller Zod-Schemas
 */
import { describe, it, expect } from 'vitest';
import {
  // Common
  LocalizedStringSchema,
  UUIDSchema,
  SlugSchema,
  PaginationSchema,
  // Category
  CategoryListQuerySchema,
  // Manufacturer
  CreateManufacturerSchema,
  ManufacturerListQuerySchema,
  // Package
  CreatePackageSchema,
  // Component
  CreateComponentSchema,
  CreateAttributeValueSchema,
  ComponentListQuerySchema,
  // Part
  CreatePartSchema,
  CreatePinMappingSchema,
  // Attribute
  CreateAttributeDefinitionSchema,
  UpdateAttributeDefinitionSchema,
  AttributeListQuerySchema,
  // Audit
  AuditLogQuerySchema,
} from './index';

// ============================================
// COMMON SCHEMAS TESTS
// ============================================

describe('LocalizedStringSchema', () => {
  it('should validate with one language', () => {
    const input = { de: 'Test' };
    const result = LocalizedStringSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate with multiple languages', () => {
    const input = { de: 'Test', en: 'Test', fr: 'Teste' };
    const result = LocalizedStringSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = LocalizedStringSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject all empty strings', () => {
    const result = LocalizedStringSchema.safeParse({ de: '', en: '' });
    expect(result.success).toBe(false);
  });
});

describe('UUIDSchema', () => {
  it('should validate valid UUID', () => {
    const result = UUIDSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = UUIDSchema.safeParse('not-a-uuid');
    expect(result.success).toBe(false);
  });
});

describe('SlugSchema', () => {
  it('should validate lowercase slug', () => {
    const result = SlugSchema.safeParse('my-slug-123');
    expect(result.success).toBe(true);
  });

  it('should reject uppercase', () => {
    const result = SlugSchema.safeParse('My-Slug');
    expect(result.success).toBe(false);
  });

  it('should reject spaces', () => {
    const result = SlugSchema.safeParse('my slug');
    expect(result.success).toBe(false);
  });
});

describe('PaginationSchema', () => {
  it('should use defaults', () => {
    const result = PaginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should coerce string to number', () => {
    const result = PaginationSchema.parse({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('should reject invalid page', () => {
    const result = PaginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject limit over 100', () => {
    const result = PaginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});

// ============================================
// CATEGORY SCHEMAS TESTS
// ============================================

describe('CategoryListQuerySchema', () => {
  it('should parse valid query', () => {
    const result = CategoryListQuerySchema.parse({
      page: 1,
      limit: 10,
      level: 2,
      search: 'capacitor',
    });
    expect(result.level).toBe(2);
    expect(result.search).toBe('capacitor');
  });

  it('should coerce level from string', () => {
    const result = CategoryListQuerySchema.parse({ level: '3' });
    expect(result.level).toBe(3);
  });
});

// ============================================
// MANUFACTURER SCHEMAS TESTS
// ============================================

describe('CreateManufacturerSchema', () => {
  it('should validate complete input', () => {
    const input = {
      name: 'Texas Instruments',
      cageCode: '01295',
      countryCode: 'US',
      website: 'https://ti.com',
      status: 'ACTIVE',
      foundedYear: 1951,
      description: { en: 'Semiconductor company' },
      aliases: [{ aliasName: 'TI', aliasType: 'brand' }],
    };
    const result = CreateManufacturerSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal input', () => {
    const result = CreateManufacturerSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = CreateManufacturerSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid country code', () => {
    const result = CreateManufacturerSchema.safeParse({
      name: 'Test',
      countryCode: 'USA', // should be 2 chars
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid website URL', () => {
    const result = CreateManufacturerSchema.safeParse({
      name: 'Test',
      website: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('ManufacturerListQuerySchema', () => {
  it('should parse with status filter', () => {
    const result = ManufacturerListQuerySchema.parse({ status: 'ACQUIRED' });
    expect(result.status).toBe('ACQUIRED');
  });

  it('should use default includeAcquired', () => {
    const result = ManufacturerListQuerySchema.parse({});
    expect(result.includeAcquired).toBe(true);
  });

  it('should accept explicit boolean', () => {
    const result = ManufacturerListQuerySchema.parse({ includeAcquired: false });
    expect(result.includeAcquired).toBe(false);
  });
});

// ============================================
// PACKAGE SCHEMAS TESTS
// ============================================

describe('CreatePackageSchema', () => {
  it('should validate complete input', () => {
    const input = {
      name: 'DIP-14',
      mountingType: 'THT',
      pinCount: 14,
      lengthMm: 19.3,
      widthMm: 6.35,
      pitchMm: 2.54,
      jedecStandard: 'MS-001',
    };
    const result = CreatePackageSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal input', () => {
    const result = CreatePackageSchema.safeParse({
      name: 'TO-220',
      mountingType: 'THT',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing mountingType', () => {
    const result = CreatePackageSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(false);
  });

  it('should reject negative dimensions', () => {
    const result = CreatePackageSchema.safeParse({
      name: 'Test',
      mountingType: 'SMD',
      lengthMm: -5,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================
// COMPONENT SCHEMAS TESTS
// ============================================

describe('CreateComponentSchema', () => {
  it('should validate complete input', () => {
    const input = {
      name: { de: 'Kondensator', en: 'Capacitor' },
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      shortDescription: { de: 'Ein elektronisches Bauteil' },
      status: 'DRAFT',
      attributeValues: [
        {
          definitionId: '550e8400-e29b-41d4-a716-446655440001',
          normalizedValue: 0.0001,
          prefix: 'µ',
        },
      ],
    };
    const result = CreateComponentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal input', () => {
    const result = CreateComponentSchema.safeParse({
      name: { de: 'Test' },
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const result = CreateComponentSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid categoryId', () => {
    const result = CreateComponentSchema.safeParse({
      name: { de: 'Test' },
      categoryId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('CreateAttributeValueSchema', () => {
  it('should validate with all fields', () => {
    const input = {
      definitionId: '550e8400-e29b-41d4-a716-446655440000',
      normalizedValue: 0.0001,
      normalizedMin: 0.00008,
      normalizedMax: 0.00012,
      prefix: 'µ',
    };
    const result = CreateAttributeValueSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal input with just normalizedValue', () => {
    const result = CreateAttributeValueSchema.safeParse({
      definitionId: '550e8400-e29b-41d4-a716-446655440000',
      normalizedValue: 10000,
      prefix: 'k',
    });
    expect(result.success).toBe(true);
  });

  it('should validate string value', () => {
    const result = CreateAttributeValueSchema.safeParse({
      definitionId: '550e8400-e29b-41d4-a716-446655440000',
      stringValue: 'NPN',
    });
    expect(result.success).toBe(true);
  });
});

describe('ComponentListQuerySchema', () => {
  it('should parse complex query', () => {
    const result = ComponentListQuerySchema.parse({
      page: 2,
      limit: 25,
      status: 'PUBLISHED',
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      search: 'timer 555',
      includeSubcategories: 'true',
    });
    expect(result.page).toBe(2);
    expect(result.status).toBe('PUBLISHED');
    expect(result.includeSubcategories).toBe(true);
  });
});

// ============================================
// PART SCHEMAS TESTS
// ============================================

describe('CreatePartSchema', () => {
  it('should validate complete input', () => {
    const input = {
      coreComponentId: '550e8400-e29b-41d4-a716-446655440000',
      manufacturerId: '550e8400-e29b-41d4-a716-446655440001',
      mpn: 'NE555P',
      orderingCode: 'NE555P/NOPB',
      packageId: '550e8400-e29b-41d4-a716-446655440002',
      status: 'DRAFT',
      lifecycleStatus: 'ACTIVE',
      rohsCompliant: true,
      introductionYear: 1972,
      pinMappings: [
        { pinNumber: '1', pinName: 'GND', pinType: 'GROUND' },
        { pinNumber: '8', pinName: 'VCC', pinType: 'POWER' },
      ],
    };
    const result = CreatePartSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal input', () => {
    const result = CreatePartSchema.safeParse({
      coreComponentId: '550e8400-e29b-41d4-a716-446655440000',
      manufacturerId: '550e8400-e29b-41d4-a716-446655440001',
      mpn: 'TEST-001',
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing required fields', () => {
    const result = CreatePartSchema.safeParse({ mpn: 'TEST' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid year', () => {
    const result = CreatePartSchema.safeParse({
      coreComponentId: '550e8400-e29b-41d4-a716-446655440000',
      manufacturerId: '550e8400-e29b-41d4-a716-446655440001',
      mpn: 'TEST',
      introductionYear: 1700, // Too old
    });
    expect(result.success).toBe(false);
  });
});

describe('CreatePinMappingSchema', () => {
  it('should validate complete pin mapping', () => {
    const input = {
      pinNumber: '1',
      pinName: 'VCC',
      pinFunction: { en: 'Power supply', de: 'Spannungsversorgung' },
      pinType: 'POWER',
      maxVoltage: 5.5,
      maxCurrent: 0.1,
    };
    const result = CreatePinMappingSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal pin mapping', () => {
    const result = CreatePinMappingSchema.safeParse({
      pinNumber: 'A1',
      pinName: 'IO0',
    });
    expect(result.success).toBe(true);
  });
});

// ============================================
// ATTRIBUTE SCHEMAS TESTS
// ============================================

describe('CreateAttributeDefinitionSchema', () => {
  it('should validate complete input', () => {
    const input = {
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'capacitance',
      displayName: { de: 'Kapazität', en: 'Capacitance' },
      unit: 'F',
      dataType: 'DECIMAL',
      scope: 'BOTH',
      isFilterable: true,
      isRequired: true,
      siUnit: 'F',
      siMultiplier: 1,
      sortOrder: 10,
    };
    const result = CreateAttributeDefinitionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal input', () => {
    const result = CreateAttributeDefinitionSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'voltage',
      displayName: { en: 'Voltage' },
      dataType: 'DECIMAL',
    });
    expect(result.success).toBe(true);
  });

  it('should use default values', () => {
    const result = CreateAttributeDefinitionSchema.parse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'test_attr',
      displayName: { en: 'Test' },
      dataType: 'STRING',
    });
    expect(result.scope).toBe('PART');
    expect(result.isFilterable).toBe(true);
    expect(result.isRequired).toBe(false);
    expect(result.sortOrder).toBe(0);
  });

  it('should reject invalid name', () => {
    const result = CreateAttributeDefinitionSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: '123invalid', // Must start with letter
      displayName: { en: 'Test' },
      dataType: 'STRING',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name with spaces', () => {
    const result = CreateAttributeDefinitionSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'invalid name',
      displayName: { en: 'Test' },
      dataType: 'STRING',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing displayName', () => {
    const result = CreateAttributeDefinitionSchema.safeParse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'test',
      dataType: 'STRING',
    });
    expect(result.success).toBe(false);
  });
});

describe('UpdateAttributeDefinitionSchema', () => {
  it('should validate partial update', () => {
    const result = UpdateAttributeDefinitionSchema.safeParse({
      displayName: { de: 'Neue Bezeichnung' },
      isFilterable: false,
    });
    expect(result.success).toBe(true);
  });

  it('should validate with null values', () => {
    const result = UpdateAttributeDefinitionSchema.safeParse({
      unit: null,
      siUnit: null,
      siMultiplier: null,
    });
    expect(result.success).toBe(true);
  });

  it('should validate empty object', () => {
    const result = UpdateAttributeDefinitionSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('AttributeListQuerySchema', () => {
  it('should parse with filters', () => {
    const result = AttributeListQuerySchema.parse({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      scope: 'COMPONENT',
      dataType: 'DECIMAL',
      isFilterable: 'true',
      search: 'voltage',
    });
    expect(result.categoryId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.scope).toBe('COMPONENT');
    expect(result.dataType).toBe('DECIMAL');
    expect(result.isFilterable).toBe(true);
  });

  it('should coerce boolean from string', () => {
    const result = AttributeListQuerySchema.parse({ isFilterable: false });
    expect(result.isFilterable).toBe(false);
  });

  it('should use pagination defaults', () => {
    const result = AttributeListQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

// ============================================
// AUDIT SCHEMAS TESTS
// ============================================

describe('AuditLogQuerySchema', () => {
  it('should parse date filters', () => {
    const result = AuditLogQuerySchema.parse({
      fromDate: '2024-01-01',
      toDate: '2024-12-31',
      action: 'CREATE',
      entityType: 'CoreComponent',
    });
    expect(result.fromDate).toBeInstanceOf(Date);
    expect(result.toDate).toBeInstanceOf(Date);
    expect(result.action).toBe('CREATE');
  });

  it('should parse with userId filter', () => {
    const result = AuditLogQuerySchema.parse({
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
