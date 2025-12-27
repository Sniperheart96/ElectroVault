import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Factory, Globe, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type Manufacturer } from '@/lib/api';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
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

export default async function ManufacturersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations('manufacturers');

  const page = parseInt(params.page || '1', 10);
  const limit = 20;

  let manufacturers: Manufacturer[] = [];
  let pagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

  try {
    const result = await api.getManufacturers({
      page,
      limit,
      status: params.status,
      includeAcquired: true,
    });
    manufacturers = result.data || [];
    pagination = result.pagination || pagination;
  } catch (error) {
    console.error('Failed to fetch manufacturers:', error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">
            Durchsuchen Sie unsere Datenbank der Elektronik-Hersteller
          </p>
        </div>

        {/* Manufacturer List */}
        {manufacturers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {manufacturers.map((manufacturer) => (
              <Card key={manufacturer.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Factory className="h-5 w-5 text-muted-foreground" />
                      <Link
                        href={`/manufacturers/${manufacturer.slug}`}
                        className="hover:underline"
                      >
                        {manufacturer.name}
                      </Link>
                    </CardTitle>
                    <Badge variant={getStatusBadgeVariant(manufacturer.status)}>
                      {t(`status.${manufacturer.status}`)}
                    </Badge>
                  </div>
                  {manufacturer.description && (
                    <CardDescription>
                      {manufacturer.description.de || manufacturer.description.en}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {manufacturer.countryCode && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {manufacturer.countryCode}
                      </div>
                    )}
                    {manufacturer.foundedYear && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Gegründet {manufacturer.foundedYear}
                      </div>
                    )}
                  </div>
                  {manufacturer.website && (
                    <a
                      href={manufacturer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline mt-2 block"
                    >
                      Website besuchen
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Keine Hersteller gefunden.
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
                <Link href={`/manufacturers?page=${page - 1}`}>
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
                <Link href={`/manufacturers?page=${page + 1}`}>
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
