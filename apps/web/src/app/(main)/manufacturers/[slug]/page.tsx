import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Factory, Globe, Calendar, ExternalLink, Building2, Package } from 'lucide-react';
import { type UILocale } from '@electrovault/schemas';
import { type LocalizedString } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { api, type Manufacturer, type Part } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ACQUIRED':
      return 'warning';
    case 'DEFUNCT':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getPartStatusBadgeVariant(status: string) {
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
 * Holt den lokalisierten Text aus einem LocalizedString
 */
function getLocalizedText(value: LocalizedString | undefined, locale: UILocale, fallback: string = ''): string {
  if (!value) return fallback;
  const text = value[locale as keyof Omit<LocalizedString, '_original'>];
  if (text) return text;
  // Fallback chain
  const origLocale = value._original as UILocale | undefined;
  if (origLocale) {
    const origText = value[origLocale as keyof Omit<LocalizedString, '_original'>];
    if (origText) return origText;
  }
  return value.en || value.de || fallback;
}

export default async function ManufacturerDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations('manufacturers');
  const tCommon = await getTranslations('common');
  const tComponents = await getTranslations('components');
  const locale = (await getLocale()) as UILocale;

  let manufacturer: Manufacturer | null = null;
  let parts: Part[] = [];

  try {
    const result = await api.getManufacturerBySlug(slug);
    manufacturer = result.data;
  } catch (error) {
    console.error('Failed to fetch manufacturer:', error);
    notFound();
  }

  // Fetch parts/components from this manufacturer
  try {
    const partsResult = await api.getParts({
      manufacturerId: manufacturer.id,
      limit: 20,
    });
    parts = partsResult.data || [];
  } catch (error) {
    console.error('Failed to fetch manufacturer parts:', error);
  }

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: t('title'), href: '/manufacturers' },
            { label: manufacturer.name },
          ]}
        />

        {/* Manufacturer Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
            <div className="flex items-start gap-4">
              {manufacturer.logoUrl ? (
                <img
                  src={manufacturer.logoUrl}
                  alt={`${manufacturer.name} Logo`}
                  className="w-16 h-16 rounded-lg object-contain bg-white border"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Factory className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{manufacturer.name}</h1>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusBadgeVariant(manufacturer.status)}>
                    {t(`status.${manufacturer.status}`)}
                  </Badge>
                  {manufacturer.cageCode && (
                    <Badge variant="outline">CAGE: {manufacturer.cageCode}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {manufacturer.description && (
            <p className="text-muted-foreground text-lg">
              {getLocalizedText(manufacturer.description, locale)}
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
                  <Package className="h-5 w-5" />
                  Bauteile dieses Herstellers
                </CardTitle>
                <CardDescription>
                  {parts.length > 0
                    ? `${parts.length} Bauteil${parts.length !== 1 ? 'e' : ''} gefunden`
                    : 'Keine Bauteile verfügbar'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parts.length > 0 ? (
                  <div className="space-y-4">
                    {parts.map((part) => (
                      <div
                        key={part.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{part.mpn}</h3>
                            <Badge variant={getPartStatusBadgeVariant(part.lifecycleStatus)}>
                              {tComponents(`status.${part.lifecycleStatus}`)}
                            </Badge>
                          </div>
                          {part.orderingCode && (
                            <p className="text-sm text-muted-foreground">
                              Bestellnummer: {part.orderingCode}
                            </p>
                          )}
                          {part.coreComponent && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Komponente: {getLocalizedText(part.coreComponent.name, locale)}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/parts/${encodeURIComponent(part.mpn)}`}>
                            Details
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Keine Bauteile für diesen Hersteller verfügbar.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Firmendetails
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {manufacturer.countryCode && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Land: {manufacturer.countryCode}</span>
                  </div>
                )}

                {manufacturer.foundedYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Gegründet: {manufacturer.foundedYear}
                    </span>
                  </div>
                )}

                {manufacturer.defunctYear && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Aufgelöst: {manufacturer.defunctYear}
                    </span>
                  </div>
                )}

                {manufacturer.website && (
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" asChild>
                      <a
                        href={manufacturer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Website besuchen
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Aliases */}
            {manufacturer.aliases && manufacturer.aliases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alternative Namen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {manufacturer.aliases.map((alias, index) => (
                      <Badge key={index} variant="secondary">
                        {alias}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
