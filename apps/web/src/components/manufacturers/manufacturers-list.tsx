'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Search, Factory, Globe, Calendar, ExternalLink, RefreshCw, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type Manufacturer } from '@/lib/api';
import { ManufacturerDialog } from '@/components/admin/manufacturer-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { type UILocale } from '@electrovault/schemas';

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

interface ManufacturersListProps {
  initialData: Manufacturer[];
  initialPagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  canEdit: boolean;
}

export function ManufacturersList({
  initialData,
  initialPagination,
  canEdit,
}: ManufacturersListProps) {
  const api = useApi();
  const { data: session } = useSession();
  const locale = useLocale() as UILocale;
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const isAuthenticated = !!session?.user;
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDrafts, setShowDrafts] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] = useState<Manufacturer | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialPagination?.total || 0);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 24;
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Daten nur neu laden bei expliziten Aktionen
  // NICHT beim initialen Mount - Initial-Daten vom Server nutzen
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    // Beim ersten Render nicht laden - Server-Daten nutzen
    if (!hasInitialized) {
      setHasInitialized(true);
      return;
    }
    loadManufacturers();
  }, [currentPage, statusFilter, showDrafts]);

  // Reset to page 1 when search changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, statusFilter]);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const response = await api.getManufacturers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(statusFilter && { status: statusFilter }),
        ...(showDrafts && { includeDrafts: true }),
      });
      setManufacturers(response.data);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.total);
      }
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.manufacturer.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (manufacturer: Manufacturer) => {
    try {
      await api.deleteManufacturer(manufacturer.id);
      toast({
        title: t('messages.success'),
        description: t('messages.manufacturer.deleted'),
      });
      loadManufacturers();
      setManufacturerToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.manufacturer.deleteFailed');
      toast({
        title: t('messages.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSaved = () => {
    loadManufacturers();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedManufacturer(null);
  };

  const filteredManufacturers = manufacturers.filter((m) => {
    // Entwuerfe nur anzeigen wenn Checkbox aktiviert
    if (!showDrafts && m.moderationStatus === 'DRAFT') return false;

    // Textsuche
    if (!debouncedSearchQuery) return true;
    return (
      m.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      m.slug.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      m.cageCode?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  });

  const getStatusBadge = (status: Manufacturer['status']) => {
    const variants = {
      ACTIVE: 'success',
      ACQUIRED: 'warning',
      DEFUNCT: 'destructive',
    } as const;

    const labels = {
      ACTIVE: t('manufacturer.status.active'),
      ACQUIRED: t('manufacturer.status.acquired'),
      DEFUNCT: t('manufacturer.status.defunct'),
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                {t('manufacturer.title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t('manufacturer.count', { count: totalCount })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={loadManufacturers} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {canEdit && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('manufacturer.create')}
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('lists.searchByNameCage')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('filters.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.allStatus')}</SelectItem>
                <SelectItem value="ACTIVE">{t('manufacturer.status.active')}</SelectItem>
                <SelectItem value="ACQUIRED">{t('manufacturer.status.acquired')}</SelectItem>
                <SelectItem value="DEFUNCT">{t('manufacturer.status.defunct')}</SelectItem>
              </SelectContent>
            </Select>
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-drafts"
                  checked={showDrafts}
                  onCheckedChange={(checked) => setShowDrafts(checked === true)}
                />
                <Label htmlFor="show-drafts" className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <FileEdit className="h-4 w-4" />
                  {t('filters.myDrafts')}
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                {tCommon('loading')}
              </div>
            ) : filteredManufacturers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Factory className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('lists.noResults')}</p>
                {canEdit && (
                  <Button variant="outline" className="mt-4" onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('manufacturer.createFirst')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredManufacturers.map((manufacturer) => {
                  const isDraft = manufacturer.moderationStatus === 'DRAFT';
                  return (
                  <Card key={manufacturer.id} className={`hover:shadow-md transition-shadow group ${isDraft ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {manufacturer.logoUrl ? (
                            <div className="flex-shrink-0 w-12 h-12 border rounded-md p-1 bg-white flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={manufacturer.logoUrl}
                                alt={`${manufacturer.name} Logo`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-12 h-12 border rounded-md bg-muted flex items-center justify-center">
                              <Factory className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <CardTitle className="text-lg truncate">
                            <Link
                              href={`/manufacturers/${manufacturer.slug}`}
                              className="hover:underline"
                            >
                              {manufacturer.name}
                            </Link>
                          </CardTitle>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isDraft && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <FileEdit className="h-3 w-3" />
                              {t('moderation.draft')}
                            </Badge>
                          )}
                          {getStatusBadge(manufacturer.status)}
                        </div>
                      </div>
                      {manufacturer.description && (
                        <CardDescription className="line-clamp-2 mt-2">
                          {getLocalizedValue(manufacturer.description, locale)}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                        {manufacturer.countryCode && (
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {manufacturer.countryCode}
                          </div>
                        )}
                        {manufacturer.foundedYear && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {manufacturer.foundedYear}
                          </div>
                        )}
                        {manufacturer.cageCode && (
                          <div className="flex items-center gap-1 font-mono text-xs">
                            CAGE: {manufacturer.cageCode}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {manufacturer.website && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={manufacturer.website}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/manufacturers/${manufacturer.slug}`}>
                              {tCommon('actions.details')}
                            </Link>
                          </Button>
                        </div>

                        {canEdit && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(manufacturer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setManufacturerToDelete(manufacturer)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </div>

          {!loading && totalPages > 1 && (
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
          <ManufacturerDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSaved={handleSaved}
          />

          <ManufacturerDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            manufacturer={selectedManufacturer}
            onSaved={handleSaved}
          />

          <DeleteConfirmDialog
            open={!!manufacturerToDelete}
            onOpenChange={(open) => !open && setManufacturerToDelete(null)}
            title={t('manufacturer.deleteTitle')}
            description={t('manufacturer.deleteDescription', { name: manufacturerToDelete?.name || '' })}
            onConfirm={() => manufacturerToDelete && handleDelete(manufacturerToDelete)}
          />
        </>
      )}
    </>
  );
}
