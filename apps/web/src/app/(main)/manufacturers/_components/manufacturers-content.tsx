import { getServerSession } from 'next-auth';
import { api } from '@/lib/api';
import { authOptions } from '@/lib/auth';
import { canEdit } from '@/lib/permissions';
import { ManufacturersList } from '@/components/manufacturers/manufacturers-list';

interface ManufacturersContentProps {
  page?: string;
  status?: string;
}

/**
 * ManufacturersContent - Server Component für Streaming
 *
 * Lädt die Hersteller-Daten server-seitig und wird per Suspense gestreamt.
 */
export async function ManufacturersContent({
  page,
  status,
}: ManufacturersContentProps) {
  const session = await getServerSession(authOptions);
  const userCanEdit = canEdit(session);

  const pageNum = parseInt(page || '1', 10);
  const limit = 24;

  const manufacturersResult = await api.getManufacturers({
    page: pageNum,
    limit,
    status: status,
    includeAcquired: true,
  }).catch((error) => {
    console.error('Failed to fetch manufacturers:', error);
    return { data: [], pagination: { page: 1, limit: 24, total: 0, totalPages: 0 } };
  });

  return (
    <ManufacturersList
      initialData={manufacturersResult.data}
      initialPagination={manufacturersResult.pagination}
      canEdit={userCanEdit}
    />
  );
}
