'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, ExternalLink } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type Component, type CategoryTreeNode } from '@/lib/api';
import { ComponentDialog } from '@/components/admin/component-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

// Custom hook for debouncing values
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

function flattenCategories(nodes: CategoryTreeNode[], prefix = ''): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  for (const node of nodes) {
    const name = prefix + (node.name.de || node.name.en || 'Unbekannt');
    result.push({ id: node.id, name });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, name + ' → '));
    }
  }
  return result;
}

export default function ComponentsPage() {
  const api = useApi();
  const [components, setComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter, categoryFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, statusFilter, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [componentsResult, categoriesResult] = await Promise.all([
        api.getComponents({
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          ...(statusFilter && { status: statusFilter }),
          ...(categoryFilter && { categoryId: categoryFilter }),
        }),
        api.getCategoryTree(),
      ]);
      setComponents(componentsResult.data);
      setCategories(flattenCategories(categoriesResult.data));

      if (componentsResult.pagination) {
        setTotalPages(componentsResult.pagination.totalPages);
        setTotalCount(componentsResult.pagination.total);
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
        title: 'Erfolg',
        description: 'Bauteil wurde gelöscht.',
      });
      loadData();
      setComponentToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bauteil konnte nicht gelöscht werden.';
      toast({
        title: 'Fehler',
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

  // Client-side filtering nur für Search (API übernimmt Status und Kategorie)
  const filteredComponents = components.filter((c) => {
    if (!debouncedSearchQuery) return true;

    return (
      c.name.de?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      c.name.en?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  });

  const getStatusBadge = (status: Component['status']) => {
    const variants = {
      DRAFT: 'secondary',
      PENDING: 'warning',
      PUBLISHED: 'default',
      ARCHIVED: 'destructive',
    } as const;

    const labels = {
      DRAFT: 'Entwurf',
      PENDING: 'Ausstehend',
      PUBLISHED: 'Veröffentlicht',
      ARCHIVED: 'Archiviert',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'Unbekannt';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bauteile</h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Bauteile in der Datenbank ({totalCount} Bauteile)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Bauteil
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bauteile</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name oder Slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="DRAFT">Entwurf</SelectItem>
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="PUBLISHED">Veröffentlicht</SelectItem>
                <SelectItem value="ARCHIVED">Archiviert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Alle Kategorien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Keine Bauteile gefunden
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComponents.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">
                              {component.name.de || component.name.en}
                            </span>
                            {component.shortDescription && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {component.shortDescription.de || component.shortDescription.en}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{getCategoryName(component.categoryId)}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(component.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/components/${component.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

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
        title="Bauteil löschen?"
        description={`Möchten Sie das Bauteil "${componentToDelete?.name.de || componentToDelete?.name.en}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={() => componentToDelete && handleDelete(componentToDelete)}
      />
    </div>
  );
}
