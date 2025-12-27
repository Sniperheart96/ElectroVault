import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * LocalizedString Schema
 * Mindestens eine Sprache muss vorhanden sein
 */
export const LocalizedStringSchema = z
  .object({
    en: z.string().optional(),
    de: z.string().optional(),
    fr: z.string().optional(),
    es: z.string().optional(),
    zh: z.string().optional(),
  })
  .refine((data) => Object.values(data).some((val) => val && val.length > 0), {
    message: 'At least one language translation is required',
  });

/**
 * CreateComponentSchema
 * Validiert Input für die Erstellung eines CoreComponent
 */
export const CreateComponentSchema = z.object({
  name: LocalizedStringSchema,
  description: LocalizedStringSchema.optional(),
  categoryId: z.string().uuid('Invalid category ID format'),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateComponentInput = z.infer<typeof CreateComponentSchema>;

// ==================== TESTS ====================

describe('LocalizedStringSchema', () => {
  it('should validate valid localized string with one language', () => {
    const input = { de: 'Test' };
    const result = LocalizedStringSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should validate valid localized string with multiple languages', () => {
    const input = {
      de: 'Test',
      en: 'Test',
      fr: 'Teste',
    };
    const result = LocalizedStringSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject empty localized string object', () => {
    const input = {};
    const result = LocalizedStringSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain(
        'At least one language translation is required'
      );
    }
  });

  it('should reject localized string with only empty values', () => {
    const input = { de: '', en: '' };
    const result = LocalizedStringSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should accept undefined optional fields', () => {
    const input = { de: 'Test', en: undefined };
    const result = LocalizedStringSchema.safeParse(input);

    expect(result.success).toBe(true);
  });
});

describe('CreateComponentSchema', () => {
  it('should validate complete valid input', () => {
    const input = {
      name: { de: 'Kondensator', en: 'Capacitor' },
      description: { de: 'Ein elektronisches Bauteil' },
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      tags: ['passive', 'energy-storage'],
      metadata: { manufacturer: 'Generic' },
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name.de).toBe('Kondensator');
      expect(result.data.categoryId).toBe('550e8400-e29b-41d4-a716-446655440000');
    }
  });

  it('should validate minimal valid input', () => {
    const input = {
      name: { de: 'Test Bauteil' },
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const input = {
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject empty name object', () => {
    const input = {
      name: {},
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject missing categoryId', () => {
    const input = {
      name: { de: 'Test' },
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(false);
  });

  it('should reject invalid UUID format for categoryId', () => {
    const input = {
      name: { de: 'Test' },
      categoryId: 'not-a-uuid',
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Invalid category ID format');
    }
  });

  it('should validate optional tags array', () => {
    const input = {
      name: { de: 'Test' },
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      tags: ['tag1', 'tag2', 'tag3'],
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toHaveLength(3);
    }
  });

  it('should validate optional metadata object', () => {
    const input = {
      name: { de: 'Test' },
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: {
        customField: 'value',
        count: 42,
        nested: { key: 'value' },
      },
    };

    const result = CreateComponentSchema.safeParse(input);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata?.customField).toBe('value');
    }
  });
});
