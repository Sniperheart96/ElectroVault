'use client';

import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Search, ChevronRight, ChevronDown, Package, Layers, FileEdit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { Skeleton } from '@/components/ui/skeleton';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type Component, type CategoryTreeNode, type Part, type ComponentAttributeValue, SI_PREFIX_FACTORS, type SIPrefix, type LocalizedString } from '@/lib/api';
import { ComponentDialog } from '@/components/admin/component-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { useFilterState } from '@/hooks/use-filter-state';
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

function flattenCategories(nodes: CategoryTreeNode[], locale: UILocale, prefix = ''): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  for (const node of nodes) {
    const name = prefix + getLocalizedValue(node.name, locale);
    result.push({ id: node.id, name: name || '[MISSING TRANSLATION]' });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, locale, name + ' > '));
    }
  }
  return result;
}

/**
 * Formatiert einen Attributwert mit SI-Präfix und Einheit
 */
function formatAttributeValue(
  attr: ComponentAttributeValue
): string {
  const def = attr.definition;
  if (!def) return '-';

  const { normalizedValue, normalizedMin, normalizedMax, prefix, stringValue } = attr;
  const { unit, dataType } = def;

  // String-Typ
  if (dataType === 'STRING' && stringValue) {
    return stringValue;
  }

  // Boolean-Typ (keeping hardcoded for now - formatAttributeValue is a pure function without access to translations)
  if (dataType === 'BOOLEAN') {
    if (stringValue === 'true' || normalizedValue === 1) return 'Ja';
    if (stringValue === 'false' || normalizedValue === 0) return 'Nein';
    return '-';
  }

  // Numerische Typen
  if (normalizedValue === null && normalizedMin === null && normalizedMax === null) {
    return stringValue || '-';
  }

  // Prefix normalisieren
  const validPrefix = prefix && prefix in SI_PREFIX_FACTORS ? (prefix as SIPrefix) : null;
  const multiplier = validPrefix ? SI_PREFIX_FACTORS[validPrefix] : 1;
  const unitStr = unit || '';
  const prefixStr = validPrefix || '';

  // Range-Wert
  if (normalizedMin !== null && normalizedMax !== null) {
    const displayMin = (normalizedMin / multiplier).toFixed(dataType === 'INTEGER' ? 0 : 2);
    const displayMax = (normalizedMax / multiplier).toFixed(dataType === 'INTEGER' ? 0 : 2);
    return `${displayMin}-${displayMax}${prefixStr}${unitStr}`.trim();
  }

  // Einzelwert
  if (normalizedValue !== null) {
    const displayValue = (normalizedValue / multiplier).toFixed(dataType === 'INTEGER' ? 0 : 2);
    return `${displayValue}${prefixStr}${unitStr}`.trim();
  }

  return stringValue || '-';
}

/**
 * Berechnet den dynamischen Anzeigenamen eines Components
 * Format: [Name] / [Label-Attribut 1] / [Label-Attribut 2] / ... / [Bauform]
 */
function computeDisplayName(component: Component, locale: UILocale): string {
  const parts: string[] = [];

  // 1. Name hinzufügen (falls gesetzt)
  const name = getLocalizedValue(component.name, locale);
  if (name) {
    parts.push(name);
  }

  // 2. Label-Attributwerte hinzufügen (bereits nach sortOrder sortiert)
  if (component.attributeValues) {
    for (const attrValue of component.attributeValues) {
      if (attrValue.definition?.isLabel) {
        const formatted = formatAttributeValue(attrValue);
        if (formatted && formatted !== '-') {
          parts.push(formatted);
        }
      }
    }
  }

  // 3. Bauform hinzufügen (falls vorhanden)
  if (component.package?.name) {
    parts.push(component.package.name);
  }

  // Fallback auf Slug wenn nichts vorhanden
  return parts.length > 0 ? parts.join(' / ') : component.slug;
}

interface ExpandedRowProps {
  component: Component;
}

function ExpandedRow({ component }: ExpandedRowProps) {
  const api = useApi();
  const t = useTranslations('admin');
  const tComponents = useTranslations('components');
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParts = async () => {
      try {
        const result = await api.getParts({ componentId: component.id, limit: 100 });
        setParts(result.data);
      } catch (error) {
        console.error('Failed to load parts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadParts();
  }, [api, component.id]);

  const getLifecycleBadge = (status: Part['lifecycleStatus']) => {
    const variants = {
      ACTIVE: 'default',
      NRND: 'warning',
      EOL: 'secondary',
      OBSOLETE: 'destructive',
    } as const;

    const labels = {
      ACTIVE: tComponents('lifecycle.ACTIVE'),
      NRND: tComponents('lifecycle.NRND'),
      EOL: tComponents('lifecycle.EOL'),
      OBSOLETE: tComponents('lifecycle.OBSOLETE'),
    };

    return <Badge variant={variants[status] || 'secondary'} className="text-xs">{labels[status] || status}</Badge>;
  };

  if (loading) {
    return (
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={4} className="py-3">
          <div className="pl-8 space-y-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (parts.length === 0) {
    return (
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableCell colSpan={4} className="py-3">
          <div className="pl-8 text-sm text-muted-foreground">
            {t('tabs.parts')}: {t('lists.noResults')}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableCell colSpan={4} className="py-2">
        <div className="pl-8">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-0">
                <TableHead className="text-xs h-7 py-1">MPN</TableHead>
                <TableHead className="text-xs h-7 py-1">{tComponents('filters.manufacturer')}</TableHead>
                <TableHead className="text-xs h-7 py-1">{tComponents('filters.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part) => (
                <TableRow key={part.id} className="hover:bg-muted/50 border-b-0">
                  <TableCell className="py-1 font-mono text-sm">{part.mpn}</TableCell>
                  <TableCell className="py-1 text-sm">{part.manufacturer?.name || '-'}</TableCell>
                  <TableCell className="py-1">{getLifecycleBadge(part.lifecycleStatus)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ComponentsListProps {
  initialData: Component[];
  initialPagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  initialCategories: CategoryTreeNode[];
  canEdit: boolean;
}

export function ComponentsList({
  initialData,
  initialPagination,
  initialCategories,
  canEdit,
}: ComponentsListProps) {
  const api = useApi();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const locale = useLocale() as UILocale;
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tComponents = useTranslations('components');
  const [components, setComponents] = useState<Component[]>(initialData);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    flattenCategories(initialCategories, locale)
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDrafts, setShowDrafts] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialPagination?.total || 0);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;
  const categoryFilter = searchParams.get('category') || '';
  const isAuthenticated = !!session?.user;

  // Filter aus URL lesen
  const { filters, hasFilters } = useFilterState();

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Daten nur neu laden bei:
  // - Pagination-Aenderung (currentPage)
  // - Kategorie-Wechsel (categoryFilter)
  // - Filter-Aenderung (filters)
  // - Refresh-Button (manuell)
  // NICHT beim initialen Mount - Initial-Daten vom Server nutzen
  const [hasInitialized, setHasInitialized] = useState(false);

  // Stringify für dependency array (Object-Vergleich funktioniert nicht)
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    // Beim ersten Render nicht laden - Server-Daten nutzen
    if (!hasInitialized) {
      setHasInitialized(true);
      return;
    }
    loadData();
  }, [currentPage, categoryFilter, filtersKey]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, categoryFilter, filtersKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Backend liefert immer: alle nicht-DRAFT + eigene DRAFTs (wenn eingeloggt)
      const componentsResult = await api.getComponents({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        ...(categoryFilter && { categoryId: categoryFilter }),
        // Immer eigene Entwuerfe laden wenn eingeloggt - Checkbox filtert nur clientseitig
        ...(isAuthenticated && { includeDrafts: true }),
        // Attribut-Filter übergeben
        ...(hasFilters && { attributeFilters: filters }),
      });

      setComponents(componentsResult.data);

      if (componentsResult.pagination) {
        setTotalPages(componentsResult.pagination.totalPages);
        setTotalCount(componentsResult.pagination.total);
      }
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.component.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (componentId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(componentId)) {
        next.delete(componentId);
      } else {
        next.add(componentId);
      }
      return next;
    });
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (component: Component) => {
    setSelectedComponent(component);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (component: Component) => {
    try {
      await api.deleteComponent(component.id);
      toast({
        title: t('messages.success'),
        description: t('messages.component.deleted'),
      });
      loadData();
      setComponentToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.component.deleteFailed');
      toast({
        title: t('messages.error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSaved = () => {
    loadData();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedComponent(null);
  };

  const filteredComponents = components.filter((c) => {
    // Entwuerfe ausblenden wenn Checkbox nicht aktiviert
    if (!showDrafts && c.status === 'DRAFT') return false;

    // Suchfilter
    if (!debouncedSearchQuery) return true;
    const localizedName = getLocalizedValue(c.name, locale);
    return (
      localizedName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  });

  const getSelectedCategoryName = () => {
    if (!categoryFilter) return `${tCommon('all')} ${tComponents('filters.category')}`;
    const category = categories.find((c) => c.id === categoryFilter);
    return category?.name || '[MISSING TRANSLATION]';
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {tComponents('title')}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getSelectedCategoryName()} ({totalCount})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {canEdit && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('components.new')}
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('lists.searchByName')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {/* Entwuerfe-Filter nur fuer eingeloggte User anzeigen */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-drafts"
                  checked={showDrafts}
                  onCheckedChange={(checked) => setShowDrafts(checked === true)}
                />
                <Label
                  htmlFor="show-drafts"
                  className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5"
                >
                  <FileEdit className="h-4 w-4 text-muted-foreground" />
                  {tComponents('status.DRAFT')}
                </Label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24 text-center">{t('tabs.parts')}</TableHead>
                  <TableHead className="text-right w-28">{tCommon('edit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {tCommon('loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredComponents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('lists.noResults')}</p>
                      {canEdit && (
                        <Button variant="outline" className="mt-4" onClick={handleCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t('lists.createFirst')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComponents.map((component) => {
                    const isDraft = component.status === 'DRAFT';
                    return (
                    <Fragment key={component.id}>
                      <TableRow
                        className={`cursor-pointer hover:bg-muted/50 ${isDraft ? 'opacity-60' : ''}`}
                        onClick={() => toggleRow(component.id)}
                      >
                        <TableCell className="w-8 py-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {expandedRows.has(component.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/components/${component.slug}${categoryFilter ? `?from=${categoryFilter}` : ''}`}
                                  className={`font-medium hover:underline ${isDraft ? 'text-muted-foreground' : ''}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {computeDisplayName(component, locale)}
                                </Link>
                                {isDraft && (
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <FileEdit className="h-3 w-3" />
                                    {tComponents('status.DRAFT')}
                                  </Badge>
                                )}
                              </div>
                              {component.shortDescription && (
                                <p className="text-sm text-muted-foreground truncate max-w-md">
                                  {getLocalizedValue(component.shortDescription, locale)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {component.manufacturerPartsCount ?? 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {canEdit && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(component)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setComponentToDelete(component)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(component.id) && (
                        <ExpandedRow component={component} />
                      )}
                    </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
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
          <ComponentDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSaved={handleSaved}
            onDataChanged={loadData}
          />

          <ComponentDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            component={selectedComponent}
            onSaved={handleSaved}
            onDataChanged={loadData}
          />

          <DeleteConfirmDialog
            open={!!componentToDelete}
            onOpenChange={(open) => !open && setComponentToDelete(null)}
            title={`${tComponents('title')} ${tCommon('delete')}?`}
            description={`${t('dialogs.delete.message')} "${componentToDelete ? computeDisplayName(componentToDelete, locale) : ''}"?`}
            onConfirm={() => componentToDelete && handleDelete(componentToDelete)}
          />
        </>
      )}
    </>
  );
}
