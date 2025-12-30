// Gemeinsame Typen und Hilfsfunktionen für Seed-Dateien

import { PrismaClient, MountingType, AttributeScope, AttributeDataType } from '@prisma/client';

export { MountingType, AttributeScope, AttributeDataType };

/**
 * LocalizedString mit _original Marker
 * Alle 26 UI-Sprachen werden unterstützt
 */
export type LocalizedString = {
  _original?: 'en' | 'de' | 'fr' | 'es' | 'it' | 'nl' | 'pt' | 'da' | 'fi' | 'no' | 'sv' | 'pl' | 'ru' | 'tr' | 'cs' | 'uk' | 'el' | 'zh' | 'ja' | 'ko' | 'hi' | 'id' | 'vi' | 'th' | 'ar' | 'he';
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  it?: string;
  nl?: string;
  pt?: string;
  da?: string;
  fi?: string;
  no?: string;
  sv?: string;
  pl?: string;
  ru?: string;
  tr?: string;
  cs?: string;
  uk?: string;
  el?: string;
  zh?: string;
  ja?: string;
  ko?: string;
  hi?: string;
  id?: string;
  vi?: string;
  th?: string;
  ar?: string;
  he?: string;
};

/**
 * Helper-Funktion um LocalizedString mit _original zu erstellen
 * Die erste Sprache im Objekt wird als _original markiert
 */
export function ls(strings: Omit<LocalizedString, '_original'>): LocalizedString {
  const keys = Object.keys(strings) as (keyof typeof strings)[];
  const firstLocale = keys.find(k => strings[k]) as LocalizedString['_original'];
  return {
    _original: firstLocale,
    ...strings,
  };
}

export type SeedContext = {
  prisma: PrismaClient;
};

// Kategorie-Definition für einfache Erstellung
export type CategoryDef = {
  slug: string;
  name: LocalizedString;
  description?: LocalizedString;
  level: number;
  sortOrder: number;
  children?: CategoryDef[];
};

// Attribut-Definition für einfache Erstellung
export type AttributeDef = {
  name: string;
  displayName: LocalizedString;
  unit?: string;
  dataType: AttributeDataType;
  scope: AttributeScope;
  isFilterable?: boolean;
  isRequired?: boolean;
  isLabel?: boolean;
  allowedPrefixes?: string[];
  allowedValues?: string[];
  sortOrder: number;
};

/**
 * Rekursive Kategorie-Erstellung
 */
export async function createCategoryTree(
  prisma: PrismaClient,
  categories: CategoryDef[],
  parentId?: string
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  for (const cat of categories) {
    const created = await prisma.categoryTaxonomy.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name as object,
        description: cat.description as object | undefined,
        level: cat.level,
        sortOrder: cat.sortOrder,
        parentId: parentId,
      },
      create: {
        slug: cat.slug,
        name: cat.name as object,
        description: cat.description as object | undefined,
        level: cat.level,
        sortOrder: cat.sortOrder,
        parentId: parentId,
      },
    });

    categoryMap.set(cat.slug, created.id);

    if (cat.children) {
      const childMap = await createCategoryTree(prisma, cat.children, created.id);
      childMap.forEach((id, slug) => categoryMap.set(slug, id));
    }
  }

  return categoryMap;
}

/**
 * Attribut-Definition erstellen
 */
export async function createAttributes(
  prisma: PrismaClient,
  categoryId: string,
  attributes: AttributeDef[]
): Promise<void> {
  for (const attr of attributes) {
    await prisma.attributeDefinition.upsert({
      where: { categoryId_name: { categoryId, name: attr.name } },
      update: {
        displayName: attr.displayName as object,
        unit: attr.unit,
        dataType: attr.dataType,
        scope: attr.scope,
        isFilterable: attr.isFilterable ?? true,
        isRequired: attr.isRequired ?? false,
        isLabel: attr.isLabel ?? false,
        allowedPrefixes: attr.allowedPrefixes ?? [],
        allowedValues: attr.allowedValues ? (attr.allowedValues as object) : undefined,
        sortOrder: attr.sortOrder,
      },
      create: {
        categoryId,
        name: attr.name,
        displayName: attr.displayName as object,
        unit: attr.unit,
        dataType: attr.dataType,
        scope: attr.scope,
        isFilterable: attr.isFilterable ?? true,
        isRequired: attr.isRequired ?? false,
        isLabel: attr.isLabel ?? false,
        allowedPrefixes: attr.allowedPrefixes ?? [],
        allowedValues: attr.allowedValues ? (attr.allowedValues as object) : undefined,
        sortOrder: attr.sortOrder,
      },
    });
  }
}
