import { Suspense } from 'react';
import { ManufacturersContent } from './_components/manufacturers-content';
import { ManufacturersTableSkeleton } from '@/components/skeletons';

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string }>;
}

/**
 * Manufacturers Page
 *
 * Header/Footer kommen vom (main) Layout.
 * Die Liste wird per Suspense gestreamt.
 */
export default async function ManufacturersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="container py-6">
      {/* Statischer Header - rendert sofort */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Hersteller</h1>
        <p className="text-muted-foreground">
          Durchsuchen Sie unsere Datenbank der Elektronik-Hersteller
        </p>
      </div>

      {/* Liste - wird gestreamt */}
      <div className="h-[calc(100vh-16rem)]">
        <Suspense fallback={<ManufacturersTableSkeleton />}>
          <ManufacturersContent
            page={params.page}
            status={params.status}
          />
        </Suspense>
      </div>
    </div>
  );
}
