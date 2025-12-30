'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  ArrowRightLeft,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Globe,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { ImportMappingDialog } from '@/components/admin/import/import-mapping-dialog';

interface ImportMapping {
  id: string;
  sourceId: string | null;
  mappingType: 'ATTRIBUTE' | 'CATEGORY' | 'MANUFACTURER' | 'UNIT';
  sourceKey: string;
  sourceValue: string | null;
  targetAttributeId: string | null;
  targetCategoryId: string | null;
  targetManufacturerId: string | null;
  conversionFactor: number | null;
  conversionOffset: number | null;
  parsePattern: string | null;
  priority: number;
  isActive: boolean;
  source?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  targetAttribute?: {
    id: string;
    name: string;
    displayName: Record<string, string>;
  } | null;
  targetCategory?: {
    id: string;
    name: Record<string, string>;
    slug: string;
  } | null;
  targetManufacturer?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ImportSource {
  id: string;
  name: string;
  slug: string;
}

export default function ImportMappingsPage() {
  const t = useTranslations('admin.import.mappings');
  const tCommon = useTranslations('common');
  const api = useApi();
  const { toast } = useToast();

  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ImportMapping | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMapping, setDeletingMapping] = useState<ImportMapping | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('all');

  const loadSources = useCallback(async () => {
    try {
      const response = await api.get<ImportSource[]>('/import/sources', { limit: 100 });
      setSources(response.data ?? []);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  }, [api]);

  const loadMappings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { limit: 100 };
      if (selectedSourceId === 'global') {
        params.sourceId = '';
      } else if (selectedSourceId !== 'all') {
        params.sourceId = selectedSourceId;
        params.includeGlobal = true;
      }

      const response = await api.get<ImportMapping[]>('/import/mappings', params);
      setMappings(response.data ?? []);
    } catch (error) {
      console.error('Failed to load mappings:', error);
      toast({
        title: tCommon('error'),
        description: 'Mappings konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [api, toast, tCommon, selectedSourceId]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  const handleCreate = () => {
    setEditingMapping(null);
    setDialogOpen(true);
  };

  const handleEdit = (mapping: ImportMapping) => {
    setEditingMapping(mapping);
    setDialogOpen(true);
  };

  const handleDeleteClick = (mapping: ImportMapping) => {
    setDeletingMapping(mapping);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingMapping) return;

    try {
      await api.delete(`/import/mappings/${deletingMapping.id}`);
      toast({
        title: tCommon('success'),
        description: 'Mapping wurde gelöscht',
      });
      loadMappings();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
      toast({
        title: tCommon('error'),
        description: 'Mapping konnte nicht gelöscht werden',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingMapping(null);
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingMapping(null);
    loadMappings();
  };

  const getMappingTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ATTRIBUTE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      CATEGORY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MANUFACTURER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      UNIT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return (
      <Badge className={colors[type] || ''} variant="outline">
        {t(`types.${type}` as const) || type}
      </Badge>
    );
  };

  const getTargetName = (mapping: ImportMapping): string => {
    if (mapping.targetAttribute) {
      return mapping.targetAttribute.displayName?.de || mapping.targetAttribute.name;
    }
    if (mapping.targetCategory) {
      return mapping.targetCategory.name?.de || mapping.targetCategory.slug;
    }
    if (mapping.targetManufacturer) {
      return mapping.targetManufacturer.name;
    }
    return '-';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/import">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <ArrowRightLeft className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMappings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addNew')}
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter nach Quelle:</span>
            </div>
            <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    Alle Mappings
                  </span>
                </SelectItem>
                <SelectItem value="global">
                  <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    {t('global')}
                  </span>
                </SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurierte Mappings</CardTitle>
          <CardDescription>
            {mappings.length} {mappings.length === 1 ? 'Mapping' : 'Mappings'}
            {selectedSourceId === 'global' && ' (nur globale)'}
            {selectedSourceId !== 'all' && selectedSourceId !== 'global' && ' (inkl. globale)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : mappings.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRightLeft className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-medium">{t('empty')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('emptyHint')}
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                {t('addNew')}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Typ</TableHead>
                  <TableHead>Quell-Schlüssel</TableHead>
                  <TableHead>Ziel</TableHead>
                  <TableHead>Quelle</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      {getMappingTypeBadge(mapping.mappingType)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-mono font-medium">{mapping.sourceKey}</span>
                        {mapping.sourceValue && (
                          <p className="text-sm text-muted-foreground">
                            = "{mapping.sourceValue}"
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTargetName(mapping)}
                    </TableCell>
                    <TableCell>
                      {mapping.source ? (
                        <Badge variant="outline">{mapping.source.name}</Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Global
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mapping.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {mapping.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inaktiv
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(mapping)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {tCommon('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(mapping)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tCommon('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <ImportMappingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mapping={editingMapping}
        sources={sources}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
