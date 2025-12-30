import { Suspense } from 'react';
import { PackagesContent } from './_components/packages-content';
import { PackagesTableSkeleton } from '@/components/skeletons';

interface PageProps {
  searchParams: Promise<{ page?: string; mountingType?: string; group?: string }>;
}

/**
 * Packages Page
 *
 * Header/Footer kommen vom (main) Layout.
 * Content wird per Suspense gestreamt.
 * Layout mit Sidebar für Gruppen und Hauptbereich für Packages.
 */
export default async function PackagesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Bauformen</h1>
        <p className="text-muted-foreground">
          Durchsuchen Sie unsere Datenbank der Gehäuse- und Bauformen
        </p>
      </div>

      <div className="h-[calc(100vh-16rem)]">
        <Suspense fallback={<PackagesTableSkeleton />}>
          <PackagesContent
            page={params.page}
            mountingType={params.mountingType}
            group={params.group}
          />
        </Suspense>
      </div>
    </div>
  );
}
