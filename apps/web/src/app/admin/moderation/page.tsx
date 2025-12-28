'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, User, Calendar, Package2, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import type { ModerationQueueItem, ModerationStats, LocalizedString, Component, Part } from '@/lib/api';
import { ModerationActions } from '@/components/admin/moderation-actions';

function getLocalizedText(text: LocalizedString | string | undefined): string {
  if (!text) return '[MISSING]';
  if (typeof text === 'string') return text;
  return text.de || text.en || Object.values(text)[0] || '[MISSING]';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ModerationPage() {
  const api = useApi();
  const { toast } = useToast();

  const [queueItems, setQueueItems] = useState<ModerationQueueItem[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'components' | 'parts'>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [statsResult] = await Promise.all([
        api.getModerationStats(),
      ]);

      setStats(statsResult.data);

      // Load queue based on active tab
      if (activeTab === 'all') {
        const queueResult = await api.getModerationQueue({ limit: 100 });
        setQueueItems(queueResult.data);
      } else if (activeTab === 'components') {
        const componentsResult = await api.getPendingComponents({ limit: 100 });
        setQueueItems(
          componentsResult.data.map((c: Component) => ({
            id: c.id,
            type: 'COMPONENT' as const,
            name: c.name,
            status: c.status,
            createdAt: c.createdAt,
            createdBy: null, // Components response doesn't include createdBy details
            category: c.category,
          }))
        );
      } else {
        const partsResult = await api.getPendingParts({ limit: 100 });
        setQueueItems(
          partsResult.data.map((p: Part) => ({
            id: p.id,
            type: 'PART' as const,
            name: p.mpn,
            status: p.status,
            createdAt: p.createdAt,
            createdBy: null, // Parts response doesn't include createdBy details
            coreComponent: p.coreComponent,
            manufacturer: p.manufacturer,
          }))
        );
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

  const handleApprove = async (item: ModerationQueueItem) => {
    try {
      if (item.type === 'COMPONENT') {
        await api.approveComponent(item.id);
      } else {
        await api.approvePart(item.id);
      }

      toast({
        title: 'Erfolg',
        description: `${item.type === 'COMPONENT' ? 'Bauteil' : 'Part'} wurde freigegeben.`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Freigabe fehlgeschlagen.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (item: ModerationQueueItem, comment?: string) => {
    try {
      if (item.type === 'COMPONENT') {
        await api.rejectComponent(item.id, comment);
      } else {
        await api.rejectPart(item.id, comment);
      }

      toast({
        title: 'Erfolg',
        description: `${item.type === 'COMPONENT' ? 'Bauteil' : 'Part'} wurde abgelehnt.`,
      });

      loadData();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ablehnung fehlgeschlagen.',
        variant: 'destructive',
      });
    }
  };

  const handleBatchApprove = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: 'Hinweis',
        description: 'Keine Elemente ausgewählt.',
        variant: 'default',
      });
      return;
    }

    try {
      const ids = Array.from(selectedItems);
      await api.batchApprove(ids);

      toast({
        title: 'Erfolg',
        description: `${selectedItems.size} Elemente wurden freigegeben.`,
      });

      setSelectedItems(new Set());
      loadData();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Batch-Freigabe fehlgeschlagen.',
        variant: 'destructive',
      });
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === queueItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(queueItems.map((item) => item.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderations-Queue</h1>
        <p className="text-muted-foreground mt-2">
          Freigabe und Ablehnung von Community-Beiträgen
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Warten auf Freigabe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freigegeben heute</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-green-500">{stats?.approvedToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Heute freigegeben</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgelehnt heute</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-red-500">{stats?.rejectedToday || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Heute abgelehnt</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Queue</CardTitle>
            {selectedItems.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="secondary">{selectedItems.size} ausgewählt</Badge>
                <ModerationActions
                  onBatchApprove={handleBatchApprove}
                  selectedCount={selectedItems.size}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all">Alle</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="parts">Parts</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : queueItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>Keine Elemente in der Queue</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedItems.size === queueItems.length && queueItems.length > 0}
                          onChange={toggleSelectAll}
                          className="cursor-pointer"
                        />
                      </TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Kategorie/Hersteller</TableHead>
                      <TableHead>Erstellt am</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {queueItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelection(item.id)}
                            className="cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'COMPONENT' ? 'default' : 'secondary'}>
                            {item.type === 'COMPONENT' ? (
                              <span className="flex items-center gap-1">
                                <Cpu className="h-3 w-3" />
                                Component
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Package2 className="h-3 w-3" />
                                Part
                              </span>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {getLocalizedText(item.name)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.category ? (
                            getLocalizedText(item.category.name)
                          ) : item.manufacturer ? (
                            item.manufacturer.name
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <ModerationActions
                            item={item}
                            onApprove={() => handleApprove(item)}
                            onReject={(comment) => handleReject(item, comment)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
