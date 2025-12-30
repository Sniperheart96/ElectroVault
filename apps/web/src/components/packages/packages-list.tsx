'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Box } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Package } from '@/lib/api';
import { PackageDialog } from '@/components/admin/package-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface PackagesListProps {
  initialData: Package[];
  initialPagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  canEdit: boolean;
  selectedGroupId?: string | null;
  isLoading?: boolean;
}

export function PackagesList({
  initialData,
  initialPagination,
  canEdit,
  selectedGroupId,
  isLoading: externalLoading,
}: PackagesListProps) {
  const t = useTranslations('packages');
  const api = useApi();
  const [packages, setPackages] = useState<Package[]>(initialData);
  const [loading, setLoading] = useState(false);
  const isLoading = externalLoading || loading;
  const [searchQuery, setSearchQuery] = useState('');
  const [mountingTypeFilter, setMountingTypeFilter] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialPagination?.total || 0);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Update packages when initialData changes (from parent via selectedGroupId)
  useEffect(() => {
    setPackages(initialData);
    if (initialPagination) {
      setTotalPages(initialPagination.totalPages);
      setTotalCount(initialPagination.total);
      setCurrentPage(initialPagination.page);
    }
  }, [initialData, initialPagination]);

  useEffect(() => {
    loadPackages();
  }, [currentPage, mountingTypeFilter, selectedGroupId]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, mountingTypeFilter]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(mountingTypeFilter !== 'all' && { mountingType: mountingTypeFilter }),
        ...(selectedGroupId && { groupId: selectedGroupId }),
      };
      const response = await api.getPackages(params);
      setPackages(response.data);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.total);
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: t('loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (pkg: Package) => {
    try {
      await api.deletePackage(pkg.id);
      toast({
        title: t('success'),
        description: t('deleteSuccess'),
      });
      loadPackages();
      setPackageToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('deleteError');
      toast({
        title: t('error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSaved = () => {
    loadPackages();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedPackage(null);
  };

  const filteredPackages = packages.filter((pkg) => {
    if (!debouncedSearchQuery) return true;
    return (
      pkg.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      pkg.slug.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  });

  const getMountingTypeBadge = (type: Package['mountingType']) => {
    const variants = {
      THT: 'default',
      SMD: 'secondary',
      RADIAL: 'outline',
      AXIAL: 'outline',
      CHASSIS: 'outline',
      OTHER: 'outline',
    } as const;

    return <Badge variant={variants[type] || 'outline'}>{t(`mountingType.${type}`)}</Badge>;
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Box className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('totalCount', { count: totalCount })}
              </p>
            </div>
            {canEdit && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t('addNew')}
              </Button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={mountingTypeFilter} onValueChange={setMountingTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('filterPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filterAll')}</SelectItem>
                <SelectItem value="SMD">{t('mountingType.SMD')}</SelectItem>
                <SelectItem value="THT">{t('mountingType.THT')}</SelectItem>
                <SelectItem value="RADIAL">{t('mountingType.RADIAL')}</SelectItem>
                <SelectItem value="AXIAL">{t('mountingType.AXIAL')}</SelectItem>
                <SelectItem value="CHASSIS">{t('mountingType.CHASSIS')}</SelectItem>
                <SelectItem value="OTHER">{t('mountingType.OTHER')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.name')}</TableHead>
                  <TableHead>{t('table.type')}</TableHead>
                  <TableHead>{t('table.pinCount')}</TableHead>
                  <TableHead>{t('table.dimensions')}</TableHead>
                  <TableHead>{t('table.pitch')}</TableHead>
                  <TableHead className="text-right">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {t('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Box className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('noPackagesFound')}</p>
                      {canEdit && (
                        <Button variant="outline" className="mt-4" onClick={handleCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t('createFirst')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id} className="group">
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{getMountingTypeBadge(pkg.mountingType)}</TableCell>
                      <TableCell>{pkg.pinCount || '-'}</TableCell>
                      <TableCell>
                        {pkg.lengthMm || pkg.widthMm || pkg.heightMm
                          ? `${pkg.lengthMm || '-'} x ${pkg.widthMm || '-'} x ${pkg.heightMm || '-'}`
                          : '-'}
                      </TableCell>
                      <TableCell>{pkg.pitchMm ? `${pkg.pitchMm} mm` : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(pkg)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setPackageToDelete(pkg)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={totalCount}
              limit={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <>
          <PackageDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSaved={handleSaved}
          />

          <PackageDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            package={selectedPackage}
            onSaved={handleSaved}
          />

          <DeleteConfirmDialog
            open={!!packageToDelete}
            onOpenChange={(open) => !open && setPackageToDelete(null)}
            title={t('deleteDialog.title')}
            description={t('deleteDialog.description', { name: packageToDelete?.name || '' })}
            onConfirm={() => packageToDelete && handleDelete(packageToDelete)}
          />
        </>
      )}
    </>
  );
}
