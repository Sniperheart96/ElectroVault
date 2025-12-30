import { getServerSession } from 'next-auth';
import { api } from '@/lib/api';
import { authOptions } from '@/lib/auth';
import { canEdit } from '@/lib/permissions';
import { PackagesWithSidebar } from '@/components/packages/packages-with-sidebar';

interface PackagesContentProps {
  page?: string;
  mountingType?: string;
  group?: string;
}

/**
 * Packages Content - Server Component für Daten-Fetching
 *
 * Lädt die Packages-Daten, Gruppen und Session serverseitig.
 * Wird per Suspense gestreamt während die Page Shell sofort rendert.
 */
export async function PackagesContent({ page, mountingType, group }: PackagesContentProps) {
  const session = await getServerSession(authOptions);
  const userCanEdit = canEdit(session);

  const pageNum = parseInt(page || '1', 10);
  const limit = 50;

  // Load packages and groups in parallel
  const [packagesResult, groupsResult] = await Promise.all([
    api.getPackages({
      page: pageNum,
      limit,
      ...(mountingType && { mountingType }),
      ...(group && { groupId: group }),
    }).catch((error) => {
      console.error('Failed to fetch packages:', error);
      return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
    }),
    api.getAllPackageGroups().catch((error) => {
      console.error('Failed to fetch package groups:', error);
      return { data: [] };
    }),
  ]);

  return (
    <PackagesWithSidebar
      initialPackages={packagesResult.data}
      initialPagination={packagesResult.pagination}
      initialGroups={groupsResult.data}
      canEdit={userCanEdit}
    />
  );
}
