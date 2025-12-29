import { getServerSession } from 'next-auth';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ComponentsPageLayout } from '@/components/components/components-page-layout';
import { api } from '@/lib/api';
import { authOptions } from '@/lib/auth';
import { canEdit } from '@/lib/permissions';

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; status?: string }>;
}

export default async function ComponentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const userCanEdit = canEdit(session);

  const page = parseInt(params.page || '1', 10);
  const limit = 50;

  // Load data in parallel
  const [componentsResult, categoryTreeResult] = await Promise.all([
    api.getComponents({
      page,
      limit,
      categoryId: params.category,
      status: params.status,
    }).catch((error) => {
      console.error('Failed to fetch components:', error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }),
    api.getCategoryTree().catch((error) => {
      console.error('Failed to fetch category tree:', error);
      return { data: [] };
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <ComponentsPageLayout
        initialComponents={componentsResult.data}
        initialPagination={componentsResult.pagination}
        initialCategories={categoryTreeResult.data}
        canEdit={userCanEdit}
      />

      <Footer />
    </div>
  );
}
