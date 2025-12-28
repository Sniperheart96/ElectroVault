import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PackagesTable } from './packages-table';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getPackages() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
  }

  try {
    const res = await fetch(`${API_URL}/packages?limit=50`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch packages:', res.status);
      return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching packages:', error);
    return { data: [], pagination: { total: 0, totalPages: 0, page: 1, limit: 50 } };
  }
}

export default async function PackagesPage() {
  const packagesResult = await getPackages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bauformen</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Gehäusetypen in der Datenbank ({packagesResult.pagination?.total || 0} Bauformen)
          </p>
        </div>
      </div>

      <PackagesTable
        initialData={packagesResult.data}
        initialPagination={packagesResult.pagination}
      />
    </div>
  );
}
