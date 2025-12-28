import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ManufacturersTable } from './manufacturers-table';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getManufacturers() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
  }

  try {
    const res = await fetch(`${API_URL}/manufacturers?limit=50`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch manufacturers:', res.status);
      return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching manufacturers:', error);
    return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
  }
}

export default async function ManufacturersPage() {
  const manufacturersResult = await getManufacturers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hersteller</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Hersteller in der Datenbank ({manufacturersResult.pagination?.total || 0} Hersteller)
          </p>
        </div>
      </div>

      <ManufacturersTable
        initialData={manufacturersResult.data}
        initialPagination={manufacturersResult.pagination}
      />
    </div>
  );
}
