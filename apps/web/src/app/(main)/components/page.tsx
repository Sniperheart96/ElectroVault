import { Suspense } from 'react';
import { ComponentsPageContent } from './_components/components-page-content';
import { ComponentsPageSkeleton } from '@/components/skeletons';

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; status?: string }>;
}

/**
 * Components Page
 *
 * Header/Footer kommen vom (main) Layout.
 * Content wird per Suspense gestreamt.
 *
 * Die gesamte Seite (Sidebar + Liste) wird als eine Komponente gerendert,
 * damit die Sidebar-Breite korrekt mit der Liste synchronisiert ist.
 */
export default async function ComponentsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<ComponentsPageSkeleton />}>
      <ComponentsPageContent
        page={params.page}
        category={params.category}
        status={params.status}
      />
    </Suspense>
  );
}
