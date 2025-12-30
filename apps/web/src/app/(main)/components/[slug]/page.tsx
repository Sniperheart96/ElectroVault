import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Cpu, FolderTree, Factory, FileText, ArrowLeft, Settings2 } from 'lucide-react';
import { type UILocale } from '@electrovault/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  api,
  type Component,
  type CategoryPathItem,
  type Part,
  type ComponentAttributeValue,
  type PartAttributeValue,
  type LocalizedString,
  SI_PREFIX_FACTORS,
  type SIPrefix,
} from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'NRND':
      return 'warning';
    case 'EOL':
    case 'OBSOLETE':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Formatiert einen Attributwert mit SI-Präfix und Einheit
 */
function formatAttributeValue(
  value: number | null,
  min: number | null,
  max: number | null,
  prefix: SIPrefix | string | null,
  stringValue: string | null,
  unit: string | null,
  dataType: string
): string {
  // String-Typ
  if (dataType === 'STRING' && stringValue) {
    return stringValue;
  }

  // Boolean-Typ
  if (dataType === 'BOOLEAN') {
    if (stringValue === 'true' || value === 1) return 'Yes'; // TODO: i18n
    if (stringValue === 'false' || value === 0) return 'No'; // TODO: i18n
    return '-';
  }

  // Numerische Typen
  if (value === null && min === null && max === null) {
    return stringValue || '-';
  }

  // Prefix normalisieren (leere Strings und null behandeln)
  const validPrefix = prefix && prefix in SI_PREFIX_FACTORS ? (prefix as SIPrefix) : null;
  const multiplier = validPrefix ? SI_PREFIX_FACTORS[validPrefix] : 1;
  const unitStr = unit || '';
  const prefixStr = validPrefix || '';

  // Range-Wert
  if (min !== null && max !== null) {
    const displayMin = (min / multiplier).toFixed(dataType === 'INTEGER' ? 0 : 2);
    const displayMax = (max / multiplier).toFixed(dataType === 'INTEGER' ? 0 : 2);
    return `${displayMin} - ${displayMax} ${prefixStr}${unitStr}`.trim();
  }

  // Einzelwert
  if (value !== null) {
    const displayValue = (value / multiplier).toFixed(dataType === 'INTEGER' ? 0 : 2);
    return `${displayValue} ${prefixStr}${unitStr}`.trim();
  }

  return stringValue || '-';
}

/**
 * Holt den lokalisierten Namen einer Attributdefinition
 */
function getLocalizedName(displayName: LocalizedString | undefined, locale: UILocale, fallback: string): string {
  if (!displayName) return fallback;
  const value = displayName[locale as keyof Omit<LocalizedString, '_original'>];
  if (value) return value;
  // Fallback chain
  const origLocale = displayName._original as UILocale | undefined;
  if (origLocale) {
    const origValue = displayName[origLocale as keyof Omit<LocalizedString, '_original'>];
    if (origValue) return origValue;
  }
  return displayName.en || displayName.de || fallback;
}

/**
 * Zeigt strukturierte Attributwerte aus ComponentAttributeValue[] an
 */
function StructuredAttributeTable({
  attributeValues,
  emptyMessage,
  locale,
}: {
  attributeValues: ComponentAttributeValue[] | PartAttributeValue[];
  emptyMessage?: string;
  locale: UILocale;
}) {
  if (!attributeValues || attributeValues.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {attributeValues.map((attr) => {
        const def = attr.definition;
        if (!def) return null;

        const displayName = getLocalizedName(def.displayName, locale, def.name);
        const formattedValue = formatAttributeValue(
          attr.normalizedValue,
          attr.normalizedMin,
          attr.normalizedMax,
          attr.prefix,
          attr.stringValue,
          def.unit,
          def.dataType
        );

        return (
          <div key={attr.id} className="flex items-start justify-between py-2 border-b last:border-0">
            <span className="font-medium text-sm">
              {displayName}
            </span>
            <span className="text-sm text-muted-foreground text-right ml-4">
              {formattedValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Zeigt commonAttributes (JSON) als einfache Tabelle an
 */
function LegacyAttributeTable({ attributes }: { attributes: Record<string, unknown> }) {
  const entries = Object.entries(attributes);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start justify-between py-2 border-b last:border-0">
          <span className="font-medium text-sm capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <span className="text-sm text-muted-foreground text-right ml-4">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Kompakte Attributliste für Part-Karten
 */
function PartAttributesList({ attributeValues, locale }: { attributeValues: PartAttributeValue[]; locale: UILocale }) {
  if (!attributeValues || attributeValues.length === 0) {
    return null;
  }

  // Zeige max. 4 Attribute in der Kompaktansicht
  const displayAttrs = attributeValues.slice(0, 4);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {displayAttrs.map((attr) => {
        const def = attr.definition;
        if (!def) return null;

        const displayName = getLocalizedName(def.displayName, locale, def.name);
        const formattedValue = formatAttributeValue(
          attr.normalizedValue,
          attr.normalizedMin,
          attr.normalizedMax,
          attr.prefix,
          attr.stringValue,
          def.unit,
          def.dataType
        );

        return (
          <Badge key={attr.id} variant="secondary" className="text-xs font-normal">
            {displayName}: {formattedValue}
          </Badge>
        );
      })}
      {attributeValues.length > 4 && (
        <Badge variant="outline" className="text-xs font-normal">
          {/* TODO: i18n */}
          +{attributeValues.length - 4} more
        </Badge>
      )}
    </div>
  );
}

export default async function ComponentDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { from: fromCategory } = await searchParams;
  const t = await getTranslations('components');
  const locale = (await getLocale()) as UILocale;

  let component: Component | null = null;
  let categoryPath: CategoryPathItem[] = [];
  let parts: Part[] = [];

  try {
    const result = await api.getComponentBySlug(slug);
    component = result.data;
  } catch (error) {
    console.error('Failed to fetch component:', error);
    notFound();
  }

  // Fetch category path for sidebar and badges
  if (component.categoryId) {
    try {
      const pathResult = await api.getCategoryPath(component.categoryId);
      categoryPath = pathResult.data || [];
    } catch (error) {
      console.error('Failed to fetch category path:', error);
    }
  }

  // Fetch manufacturer parts for this component
  try {
    const partsResult = await api.getParts({
      componentId: component.id, // API uses componentId which maps to coreComponentId
      limit: 50,
    });
    parts = partsResult.data || [];
  } catch (error) {
    console.error('Failed to fetch parts:', error);
  }

  return (
    <div className="container py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={fromCategory ? `/components?category=${fromCategory}` : '/components'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('detail.backToOverview')}
            </Link>
          </Button>
        </div>

        {/* Component Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getLocalizedName(component.name, locale, component.slug)}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getStatusBadgeVariant(component.status)}>
                  {t(`status.${component.status}`)}
                </Badge>
                {categoryPath.length > 0 && (
                  <Badge variant="outline">
                    <FolderTree className="h-3 w-3 mr-1" />
                    {getLocalizedName(categoryPath[categoryPath.length - 1]?.name, locale, '')}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {component.shortDescription && (
            <p className="text-muted-foreground text-lg mb-2">
              {getLocalizedName(component.shortDescription, locale, '')}
            </p>
          )}

          {component.fullDescription && (
            <p className="text-muted-foreground">
              {getLocalizedName(component.fullDescription, locale, '')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Manufacturer Parts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  {t('detail.parts')}
                </CardTitle>
                <CardDescription>
                  {parts.length > 0
                    ? parts.length === 1
                      ? t('detail.variantCount', { count: parts.length })
                      : t('detail.variantCountPlural', { count: parts.length })
                    : t('detail.noVariantsAvailable')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parts.length > 0 ? (
                  <div className="space-y-4">
                    {parts.map((part) => (
                      <div
                        key={part.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{part.mpn}</h3>
                              <Badge variant={getStatusBadgeVariant(part.lifecycleStatus)}>
                                {t(`lifecycle.${part.lifecycleStatus}`)}
                              </Badge>
                            </div>
                            {part.manufacturer && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {t('detail.manufacturer')}:{' '}
                                <Link
                                  href={`/manufacturers/${part.manufacturer.slug}`}
                                  className="hover:underline text-primary"
                                >
                                  {part.manufacturer.name}
                                </Link>
                              </p>
                            )}
                            {part.orderingCode && (
                              <p className="text-sm text-muted-foreground">
                                {t('detail.orderingCode')}: {part.orderingCode}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/parts/${encodeURIComponent(part.mpn)}`}>
                              {t('detail.details')}
                            </Link>
                          </Button>
                        </div>
                        {/* Part-spezifische Attribute */}
                        {part.attributeValues && part.attributeValues.length > 0 && (
                          <PartAttributesList attributeValues={part.attributeValues} locale={locale} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('detail.noVariantsForComponent')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Component Attributes - Strukturierte Attribute aus attributeValues */}
            {component.attributeValues && component.attributeValues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    {t('detail.specifications')}
                  </CardTitle>
                  <CardDescription>
                    {t('detail.validForAllVariants')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StructuredAttributeTable
                    attributeValues={component.attributeValues}
                    locale={locale}
                    emptyMessage={t('detail.noAttributesAvailable')}
                  />
                </CardContent>
              </Card>
            )}

            {/* Legacy: commonAttributes als JSON (falls vorhanden) */}
            {component.commonAttributes && Object.keys(component.commonAttributes).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('detail.additionalProperties')}
                  </CardTitle>
                  <CardDescription>
                    {t('detail.furtherProperties')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LegacyAttributeTable attributes={component.commonAttributes} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category Info */}
            {categoryPath.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5" />
                    {t('detail.category')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {categoryPath.map((pathItem, index) => (
                      <div key={pathItem.id}>
                        <Link
                          href={`/categories/${pathItem.slug}`}
                          className="text-sm hover:underline text-primary block"
                          style={{ paddingLeft: `${index * 12}px` }}
                        >
                          {index > 0 && '└ '}
                          {getLocalizedName(pathItem.name, locale, '')}
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/categories/${categoryPath[categoryPath.length - 1]?.slug}`}>
                        {t('detail.allInCategory')}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>{t('detail.statistics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('detail.manufacturerVariants')}</span>
                  <span className="font-semibold">{parts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('detail.status')}</span>
                  <Badge variant={getStatusBadgeVariant(component.status)}>
                    {t(`status.${component.status}`)}
                  </Badge>
                </div>
                {parts.filter(p => p.lifecycleStatus === 'ACTIVE').length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('detail.activeVariants')}</span>
                    <span className="font-semibold text-green-600">
                      {parts.filter(p => p.lifecycleStatus === 'ACTIVE').length}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
