import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ComponentsTable } from './components-table';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getComponents() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
  }

  try {
    const res = await fetch(`${API_URL}/components?limit=50`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch components:', res.status);
      return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching components:', error);
    return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
  }
}

async function getCategoryTree() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { data: [] };
  }

  try {
    const res = await fetch(`${API_URL}/categories/tree`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status);
      return { data: [] };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: [] };
  }
}

export default async function ComponentsPage() {
  const [componentsResult, categoriesResult] = await Promise.all([
    getComponents(),
    getCategoryTree(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bauteile</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Bauteile in der Datenbank ({componentsResult.pagination?.total || 0} Bauteile)
          </p>
        </div>
      </div>

      <ComponentsTable
        initialData={componentsResult.data}
        initialPagination={componentsResult.pagination}
        initialCategories={categoriesResult.data}
      />
    </div>
  );
}
