import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type Component } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; status?: string }>;
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

export default async function ComponentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations('components');

  const page = parseInt(params.page || '1', 10);
  const limit = 20;

  let components: Component[] = [];
  let pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

  try {
    const result = await api.getComponents({
      page,
      limit,
      categoryId: params.category,
      status: params.status,
    });
    components = result.data || [];
    pagination = result.pagination || pagination;
  } catch (error) {
    console.error('Failed to fetch components:', error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        {/* Component List */}
        {components.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((component) => (
              <Card key={component.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      <Link
                        href={`/components/${component.slug}`}
                        className="hover:underline"
                      >
                        {component.name.de || component.name.en || 'Unbekannt'}
                      </Link>
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(component.status)}>
                      {t(`status.${component.status}`)}
                    </Badge>
                  </div>
                  {component.shortDescription && (
                    <CardDescription>
                      {component.shortDescription.de || component.shortDescription.en}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/components/${component.slug}`}>
                      Details anzeigen
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Keine Bauteile gefunden. Beginnen Sie mit dem Hinzufügen neuer Bauteile.
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/components?page=${page - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </Link>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Zurück
                </>
              )}
            </Button>

            <span className="text-sm text-muted-foreground">
              Seite {page} von {pagination.totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              asChild={page < pagination.totalPages}
            >
              {page < pagination.totalPages ? (
                <Link href={`/components?page=${page + 1}`}>
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              ) : (
                <>
                  Weiter
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
