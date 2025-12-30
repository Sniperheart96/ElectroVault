import { getServerSession } from 'next-auth';
import { api } from '@/lib/api';
import { authOptions } from '@/lib/auth';
import { canEdit } from '@/lib/permissions';
import { ComponentsPageLayout } from '@/components/components/components-page-layout';

interface ComponentsPageContentProps {
  page?: string;
  category?: string;
  status?: string;
}

/**
 * ComponentsPageContent - Server Component für Streaming
 *
 * Lädt alle Daten server-seitig und rendert die komplette Seite
 * (Sidebar + Liste) als eine Einheit. Dadurch ist die Sidebar-Breite
 * korrekt mit der Liste synchronisiert.
 */
export async function ComponentsPageContent({
  page,
  category,
  status,
}: ComponentsPageContentProps) {
  const session = await getServerSession(authOptions);
  const userCanEdit = canEdit(session);

  const pageNum = parseInt(page || '1', 10);
  const limit = 50;

  // Daten parallel laden
  const [componentsResult, categoryTreeResult] = await Promise.all([
    api.getComponents({
      page: pageNum,
      limit,
      categoryId: category,
      status: status,
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
    <ComponentsPageLayout
      initialComponents={componentsResult.data}
      initialPagination={componentsResult.pagination}
      initialCategories={categoryTreeResult.data}
      canEdit={userCanEdit}
    />
  );
}
