import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Cpu, FolderTree, Package, Factory, FileText } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { api, type Component, type CategoryPathItem, type Part } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
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

function AttributeTable({ attributes }: { attributes: Record<string, unknown> }) {
  const entries = Object.entries(attributes);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Keine Attribute verfügbar.
      </p>
    );
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

export default async function ComponentDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations('components');
  const tCommon = await getTranslations('common');
  const tCategories = await getTranslations('categories');

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

  // Fetch category path for breadcrumb
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
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">{tCommon('back')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/components">{t('title')}</BreadcrumbLink>
            </BreadcrumbItem>
            {categoryPath.length > 0 && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`/categories/${categoryPath[categoryPath.length - 1]?.slug}`}>
                    {categoryPath[categoryPath.length - 1]?.name.de || categoryPath[categoryPath.length - 1]?.name.en}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {component.name.de || component.name.en}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Component Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cpu className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {component.name.de || component.name.en}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant={getStatusBadgeVariant(component.status)}>
                  {t(`status.${component.status}`)}
                </Badge>
                {categoryPath.length > 0 && (
                  <Badge variant="outline">
                    <FolderTree className="h-3 w-3 mr-1" />
                    {categoryPath[categoryPath.length - 1]?.name.de || categoryPath[categoryPath.length - 1]?.name.en}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {component.shortDescription && (
            <p className="text-muted-foreground text-lg mb-2">
              {component.shortDescription.de || component.shortDescription.en}
            </p>
          )}

          {component.description && (
            <p className="text-muted-foreground">
              {component.description.de || component.description.en}
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
                    ? `${parts.length} Hersteller-Variante${parts.length !== 1 ? 'n' : ''}`
                    : 'Keine Hersteller-Varianten verfügbar'}
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
                            <Badge variant={getStatusBadgeVariant(part.lifecycleStatus)}>
                              {t(`status.${part.lifecycleStatus}`)}
                            </Badge>
                          </div>
                          {part.manufacturer && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Hersteller:{' '}
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
                              Bestellnummer: {part.orderingCode}
                            </p>
                          )}
                          {part.package && (
                            <p className="text-sm text-muted-foreground">
                              Bauform: {part.package.name}
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
                    Keine Hersteller-Varianten für dieses Bauteil verfügbar.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Component Attributes */}
            {component.commonAttributes && Object.keys(component.commonAttributes).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('detail.specifications')}
                  </CardTitle>
                  <CardDescription>
                    Gemeinsame Spezifikationen für alle Varianten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AttributeTable attributes={component.commonAttributes} />
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
                    Kategorie
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
                          {pathItem.name.de || pathItem.name.en}
                        </Link>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t mt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/categories/${categoryPath[categoryPath.length - 1]?.slug}`}>
                        Alle in Kategorie
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiken</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hersteller-Varianten</span>
                  <span className="font-semibold">{parts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={getStatusBadgeVariant(component.status)}>
                    {t(`status.${component.status}`)}
                  </Badge>
                </div>
                {parts.filter(p => p.lifecycleStatus === 'ACTIVE').length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Aktive Varianten</span>
                    <span className="font-semibold text-green-600">
                      {parts.filter(p => p.lifecycleStatus === 'ACTIVE').length}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
