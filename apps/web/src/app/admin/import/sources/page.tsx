'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Database,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Wifi,
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
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { ImportSourceDialog } from '@/components/admin/import/import-source-dialog';

interface ImportSource {
  id: string;
  name: string;
  slug: string;
  sourceType: string;
  apiBaseUrl: string | null;
  rateLimitPerMinute: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    mappings: number;
    jobs: number;
    unmappedAttributes: number;
  };
}

export default function ImportSourcesPage() {
  const t = useTranslations('admin.import.sources');
  const tCommon = useTranslations('common');
  const api = useApi();
  const { toast } = useToast();

  const [sources, setSources] = useState<ImportSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ImportSource | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSource, setDeletingSource] = useState<ImportSource | null>(null);
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ImportSource[]>('/import/sources', { limit: 100 });
      setSources(response.data ?? []);
    } catch (error) {
      console.error('Failed to load sources:', error);
      toast({
        title: tCommon('error'),
        description: 'Quellen konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [api, toast, tCommon]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleCreate = () => {
    setEditingSource(null);
    setDialogOpen(true);
  };

  const handleEdit = (source: ImportSource) => {
    setEditingSource(source);
    setDialogOpen(true);
  };

  const handleDeleteClick = (source: ImportSource) => {
    setDeletingSource(source);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingSource) return;

    try {
      await api.delete(`/import/sources/${deletingSource.id}`);
      toast({
        title: tCommon('success'),
        description: 'Quelle wurde gelöscht',
      });
      loadSources();
    } catch (error) {
      console.error('Failed to delete source:', error);
      toast({
        title: tCommon('error'),
        description: 'Quelle konnte nicht gelöscht werden',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingSource(null);
    }
  };

  const handleTestConnection = async (source: ImportSource) => {
    setTestingSourceId(source.id);
    try {
      const response = await api.post<{ success: boolean; message: string }>(`/import/sources/${source.id}/test-connection`);
      const result = response.data;

      if (result?.success) {
        toast({
          title: t('testSuccess'),
          description: result.message,
        });
      } else {
        toast({
          title: t('testFailed'),
          description: result?.message ?? 'Unbekannter Fehler',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: t('testFailed'),
        description: 'Verbindungstest fehlgeschlagen',
        variant: 'destructive',
      });
    } finally {
      setTestingSourceId(null);
    }
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingSource(null);
    loadSources();
  };

  const getSourceTypeBadge = (type: string) => {
    const isApi = type.startsWith('API_');
    return (
      <Badge variant={isApi ? 'default' : 'secondary'}>
        {t(`types.${type}` as const) || type}
      </Badge>
    );
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
              <Database className="h-8 w-8" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('description')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSources} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('addNew')}
          </Button>
        </div>
      </div>

      {/* Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle>Konfigurierte Quellen</CardTitle>
          <CardDescription>
            {sources.length} {sources.length === 1 ? 'Quelle' : 'Quellen'} konfiguriert
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-muted-foreground/50" />
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
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>API-URL</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Mappings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{source.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {source.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSourceTypeBadge(source.sourceType)}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {source.apiBaseUrl || '-'}
                    </TableCell>
                    <TableCell>
                      {source.rateLimitPerMinute}/min
                    </TableCell>
                    <TableCell>
                      {source._count?.mappings ?? 0}
                    </TableCell>
                    <TableCell>
                      {source.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {t('status.active')}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          {t('status.inactive')}
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
                          <DropdownMenuItem onClick={() => handleEdit(source)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            {tCommon('edit')}
                          </DropdownMenuItem>
                          {source.sourceType.startsWith('API_') && (
                            <DropdownMenuItem
                              onClick={() => handleTestConnection(source)}
                              disabled={testingSourceId === source.id}
                            >
                              {testingSourceId === source.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Wifi className="h-4 w-4 mr-2" />
                              )}
                              {t('testConnection')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(source)}
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
      <ImportSourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        source={editingSource}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialog.deleteDescription', { name: deletingSource?.name ?? '' })}
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
