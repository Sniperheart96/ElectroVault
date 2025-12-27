import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FolderTree, ChevronRight, Package } from 'lucide-react';
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
import { api, type Category, type CategoryPathItem, type Component } from '@/lib/api';

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

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const t = await getTranslations('categories');
  const tCommon = await getTranslations('common');
  const tComponents = await getTranslations('components');

  let category: Category | null = null;
  let categoryPath: CategoryPathItem[] = [];
  let subcategories: Category[] = [];
  let components: Component[] = [];

  try {
    const result = await api.getCategoryBySlug(slug);
    category = result.data;
  } catch (error) {
    console.error('Failed to fetch category:', error);
    notFound();
  }

  // Fetch category path for breadcrumb
  try {
    const pathResult = await api.getCategoryPath(category.id);
    categoryPath = pathResult.data || [];
  } catch (error) {
    console.error('Failed to fetch category path:', error);
  }

  // Fetch subcategories
  try {
    const subcatsResult = await api.getCategories({
      parentId: category.id,
      limit: 50,
    });
    subcategories = subcatsResult.data || [];
  } catch (error) {
    console.error('Failed to fetch subcategories:', error);
  }

  // Fetch components in this category
  try {
    const componentsResult = await api.getComponents({
      categoryId: category.id,
      limit: 20,
    });
    components = componentsResult.data || [];
  } catch (error) {
    console.error('Failed to fetch components:', error);
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
              <BreadcrumbLink href="/categories">{t('title')}</BreadcrumbLink>
            </BreadcrumbItem>
            {categoryPath.map((pathItem, index) => (
              <>
                <BreadcrumbSeparator key={`sep-${pathItem.id}`} />
                <BreadcrumbItem key={pathItem.id}>
                  {index === categoryPath.length - 1 ? (
                    <BreadcrumbPage>
                      {pathItem.name.de || pathItem.name.en}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={`/categories/${pathItem.slug}`}>
                      {pathItem.name.de || pathItem.name.en}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-start gap-4 mb-4">
            {category.iconUrl ? (
              <img
                src={category.iconUrl}
                alt={`${category.name.de || category.name.en} Icon`}
                className="w-16 h-16 rounded-lg object-contain"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderTree className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {category.name.de || category.name.en}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Level {category.level + 1}</Badge>
                {!category.isActive && (
                  <Badge variant="destructive">Inaktiv</Badge>
                )}
              </div>
            </div>
          </div>

          {category.description && (
            <p className="text-muted-foreground text-lg">
              {category.description.de || category.description.en}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Subcategories */}
          {subcategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  {t('subcategories')}
                </CardTitle>
                <CardDescription>
                  {subcategories.length} Unterkategorie{subcategories.length !== 1 ? 'n' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subcategories.map((subcat) => (
                    <Link
                      key={subcat.id}
                      href={`/categories/${subcat.slug}`}
                      className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-colors group"
                    >
                      <FolderTree className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {subcat.name.de || subcat.name.en}
                        </p>
                        {subcat.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {subcat.description.de || subcat.description.en}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Components in this category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('componentsInCategory')}
              </CardTitle>
              <CardDescription>
                {components.length > 0
                  ? `${components.length} Bauteil${components.length !== 1 ? 'e' : ''} in dieser Kategorie`
                  : 'Keine Bauteile in dieser Kategorie'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {components.length > 0 ? (
                <div className="space-y-4">
                  {components.map((component) => (
                    <div
                      key={component.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {component.name.de || component.name.en}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(component.status)}>
                            {tComponents(`status.${component.status}`)}
                          </Badge>
                        </div>
                        {component.shortDescription && (
                          <p className="text-sm text-muted-foreground">
                            {component.shortDescription.de || component.shortDescription.en}
                          </p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/components/${component.slug}`}>
                          Details
                        </Link>
                      </Button>
                    </div>
                  ))}
                  {components.length >= 20 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" asChild>
                        <Link href={`/components?category=${category.id}`}>
                          Alle Bauteile anzeigen
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Noch keine Bauteile in dieser Kategorie.
                  </p>
                  {subcategories.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Erkunden Sie die Unterkategorien oben.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
