import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PackagesList } from '@/components/packages/packages-list';
import { api } from '@/lib/api';
import { authOptions } from '@/lib/auth';
import { canEdit } from '@/lib/permissions';

interface PageProps {
  searchParams: Promise<{ page?: string; mountingType?: string }>;
}

export default async function PackagesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const t = await getTranslations('common');
  const session = await getServerSession(authOptions);
  const userCanEdit = canEdit(session);

  const page = parseInt(params.page || '1', 10);
  const limit = 50;

  // Load packages
  const packagesResult = await api.getPackages({
    page,
    limit,
    ...(params.mountingType && { mountingType: params.mountingType }),
  }).catch((error) => {
    console.error('Failed to fetch packages:', error);
    return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bauformen</h1>
          <p className="text-muted-foreground">
            Durchsuchen Sie unsere Datenbank der Gehäuse- und Bauformen
          </p>
        </div>

        <div className="h-[calc(100vh-16rem)]">
          <PackagesList
            initialData={packagesResult.data}
            initialPagination={packagesResult.pagination}
            canEdit={userCanEdit}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
