'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { type Package, type PackageGroup } from '@/lib/api';
import { PackageGroupSidebar } from './package-group-sidebar';
import { PackagesList } from './packages-list';
import { useApi } from '@/hooks/use-api';

interface PackagesWithSidebarProps {
  initialPackages: Package[];
  initialPagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  initialGroups: PackageGroup[];
  canEdit: boolean;
}

export function PackagesWithSidebar({
  initialPackages,
  initialPagination,
  initialGroups,
  canEdit,
}: PackagesWithSidebarProps) {
  const searchParams = useSearchParams();
  const api = useApi();
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [packages, setPackages] = useState<Package[]>(initialPackages);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const selectedGroupId = searchParams.get('group');

  // Reload packages when group filter changes
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setLoading(true);
        const result = await api.getPackages({
          page: 1,
          limit: 50,
          ...(selectedGroupId && { groupId: selectedGroupId }),
        });
        setPackages(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error('Failed to reload packages:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only reload if this isn't the initial render
    if (selectedGroupId !== null || initialPackages.length === 0) {
      loadPackages();
    }
  }, [selectedGroupId, api]);

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      {/* Sidebar */}
      <PackageGroupSidebar
        initialGroups={initialGroups}
        canEdit={canEdit}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <PackagesList
          initialData={packages}
          initialPagination={pagination}
          canEdit={canEdit}
          selectedGroupId={selectedGroupId}
          isLoading={loading}
        />
      </div>
    </div>
  );
}
