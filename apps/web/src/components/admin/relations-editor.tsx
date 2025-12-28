'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeftRight,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Link2,
  Ban,
  Puzzle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocalizedInput } from '@/components/forms/localized-input';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import {
  type ComponentRelation,
  type RelationType,
  type Component,
  type LocalizedString,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

interface RelationsEditorProps {
  componentId: string;
  componentName: LocalizedString;
}

const CreateRelationSchema = z.object({
  targetId: z.string().min(1, 'Bitte wählen Sie ein Ziel-Bauteil'),
  relationType: z.enum([
    'EQUIVALENT',
    'SIMILAR',
    'UPGRADE',
    'DOWNGRADE',
    'REPLACEMENT',
    'COMPLEMENT',
    'REQUIRES',
    'CONFLICTS',
  ]),
  description: z
    .object({
      de: z.string().optional(),
      en: z.string().optional(),
    })
    .optional(),
  bidirectional: z.boolean(),
});

type CreateRelationInput = z.infer<typeof CreateRelationSchema>;

const RELATION_TYPE_CONFIG: Record<
  RelationType,
  {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
    description: string;
  }
> = {
  EQUIVALENT: {
    label: 'Gleichwertig',
    icon: <ShieldCheck className="h-4 w-4" />,
    variant: 'success',
    description: 'Funktional gleichwertig und direkt austauschbar',
  },
  SIMILAR: {
    label: 'Ähnlich',
    icon: <Link2 className="h-4 w-4" />,
    variant: 'secondary',
    description: 'Ähnliche Funktion, aber nicht völlig identisch',
  },
  UPGRADE: {
    label: 'Upgrade',
    icon: <TrendingUp className="h-4 w-4" />,
    variant: 'default',
    description: 'Verbesserte oder neuere Version',
  },
  DOWNGRADE: {
    label: 'Downgrade',
    icon: <TrendingDown className="h-4 w-4" />,
    variant: 'secondary',
    description: 'Ältere oder einfachere Version',
  },
  REPLACEMENT: {
    label: 'Ersatz',
    icon: <RefreshCw className="h-4 w-4" />,
    variant: 'default',
    description: 'Offizieller Ersatz vom Hersteller',
  },
  COMPLEMENT: {
    label: 'Ergänzung',
    icon: <Puzzle className="h-4 w-4" />,
    variant: 'secondary',
    description: 'Ergänzendes Bauteil (z.B. Treiber)',
  },
  REQUIRES: {
    label: 'Benötigt',
    icon: <ArrowRight className="h-4 w-4" />,
    variant: 'warning',
    description: 'Benötigt dieses Bauteil für den Betrieb',
  },
  CONFLICTS: {
    label: 'Inkompatibel',
    icon: <Ban className="h-4 w-4" />,
    variant: 'destructive',
    description: 'Nicht kompatibel oder inkompatibel',
  },
};

export function RelationsEditor({ componentId, componentName }: RelationsEditorProps) {
  const api = useApi();
  const { toast } = useToast();
  const [relations, setRelations] = useState<ComponentRelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRelation, setEditingRelation] = useState<ComponentRelation | null>(null);
  const [relationToDelete, setRelationToDelete] = useState<ComponentRelation | null>(null);

  // Component search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Component[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<CreateRelationInput>({
    resolver: zodResolver(CreateRelationSchema) as any,
    defaultValues: {
      targetId: '',
      relationType: 'EQUIVALENT',
      description: { de: '', en: '' },
      bidirectional: false,
    },
  });

  const loadRelations = async () => {
    try {
      setLoading(true);
      const result = await api.getComponentRelations(componentId);
      setRelations(result.data);
    } catch (error) {
      console.error('Failed to load relations:', error);
      toast({
        title: 'Fehler',
        description: 'Beziehungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      // Use components list endpoint with basic filtering
      // In a real implementation, you'd have a search endpoint
      const result = await api.getComponents({ limit: 20 });
      const filtered = result.data.filter(
        (c) =>
          c.id !== componentId &&
          (c.name.de?.toLowerCase().includes(query.toLowerCase()) ||
            c.name.en?.toLowerCase().includes(query.toLowerCase()) ||
            c.slug.toLowerCase().includes(query.toLowerCase()))
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Failed to search components:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: CreateRelationInput) => {
    try {
      const payload = {
        sourceId: componentId,
        targetId: data.targetId,
        relationType: data.relationType,
        description: data.description,
        bidirectional: data.bidirectional,
      };

      if (editingRelation) {
        await api.updateRelation(editingRelation.id, payload);
        toast({
          title: 'Erfolg',
          description: 'Beziehung wurde aktualisiert.',
        });
      } else {
        await api.createRelation(payload);
        toast({
          title: 'Erfolg',
          description: 'Beziehung wurde erstellt.',
        });
      }

      setIsCreateDialogOpen(false);
      setEditingRelation(null);
      form.reset();
      setSearchQuery('');
      setSearchResults([]);
      loadRelations();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Beziehung konnte nicht ${editingRelation ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (relation: ComponentRelation) => {
    setEditingRelation(relation);
    form.reset({
      targetId: relation.targetId,
      relationType: relation.relationType,
      description: relation.description || { de: '', en: '' },
      bidirectional: relation.bidirectional,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (relation: ComponentRelation) => {
    try {
      await api.deleteRelation(relation.id);
      toast({
        title: 'Erfolg',
        description: 'Beziehung wurde gelöscht.',
      });
      setRelationToDelete(null);
      loadRelations();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Beziehung konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenCreate = () => {
    setEditingRelation(null);
    form.reset({
      targetId: '',
      relationType: 'EQUIVALENT',
      description: { de: '', en: '' },
      bidirectional: false,
    });
    setSearchQuery('');
    setSearchResults([]);
    setIsCreateDialogOpen(true);
  };

  const getTargetName = (relation: ComponentRelation): string => {
    if (relation.target) {
      return relation.target.name.de || relation.target.name.en || 'Unbekannt';
    }
    return 'Unbekannt';
  };

  const getSourceName = (relation: ComponentRelation): string => {
    if (relation.source) {
      return relation.source.name.de || relation.source.name.en || 'Unbekannt';
    }
    return componentName.de || componentName.en || 'Unbekannt';
  };

  // Load relations on mount
  useEffect(() => {
    loadRelations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [componentId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Beziehungen zu anderen Bauteilen
        </p>
        <Button size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-1 h-3 w-3" />
          Neue Beziehung
        </Button>
      </div>

      {relations.length === 0 ? (
        <Alert>
          <AlertDescription>
            Keine Beziehungen definiert. Fügen Sie Beziehungen zu ähnlichen oder verwandten Bauteilen hinzu.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-2">
          {relations.map((relation) => {
            const config = RELATION_TYPE_CONFIG[relation.relationType];
            const isSource = relation.sourceId === componentId;
            const targetName = isSource ? getTargetName(relation) : getSourceName(relation);

            return (
              <Card key={relation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant}>
                        <span className="mr-1">{config.icon}</span>
                        {config.label}
                      </Badge>
                      {relation.bidirectional && (
                        <Badge variant="outline">
                          <ArrowLeftRight className="h-3 w-3 mr-1" />
                          Bidirektional
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(relation)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRelationToDelete(relation)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {isSource ? 'Ziel' : 'Quelle'}:
                      </span>
                      <span>{targetName}</span>
                    </div>
                    {relation.description && (relation.description.de || relation.description.en) && (
                      <p className="text-sm text-muted-foreground">
                        {relation.description.de || relation.description.en}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRelation ? 'Beziehung bearbeiten' : 'Neue Beziehung erstellen'}
            </DialogTitle>
            <DialogDescription>
              Definieren Sie eine Beziehung zu einem anderen Bauteil.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Component Search */}
              {!editingRelation && (
                <div className="space-y-2">
                  <FormLabel>Ziel-Bauteil</FormLabel>
                  <Input
                    placeholder="Bauteil suchen..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {isSearching && (
                    <div className="text-sm text-muted-foreground">Suche läuft...</div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map((component) => (
                        <button
                          key={component.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-0"
                          onClick={() => {
                            form.setValue('targetId', component.id);
                            setSearchQuery(component.name.de || component.name.en || '');
                            setSearchResults([]);
                          }}
                        >
                          <div className="font-medium">
                            {component.name.de || component.name.en}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {component.slug}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editingRelation && (
                <div className="text-sm">
                  <span className="font-medium">Ziel: </span>
                  {getTargetName(editingRelation)}
                </div>
              )}

              <FormField
                control={form.control}
                name="relationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beziehungs-Typ</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(RELATION_TYPE_CONFIG) as RelationType[]).map((type) => {
                          const config = RELATION_TYPE_CONFIG[type];
                          return (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {RELATION_TYPE_CONFIG[field.value]?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bidirectional"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Bidirektional</FormLabel>
                      <FormDescription>
                        Die Beziehung gilt in beide Richtungen
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung (optional)</FormLabel>
                    <FormControl>
                      <LocalizedInput
                        value={field.value || { de: '', en: '' }}
                        onChange={field.onChange}
                        placeholder="Zusätzliche Hinweise"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? 'Speichern...'
                    : editingRelation
                      ? 'Aktualisieren'
                      : 'Erstellen'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!relationToDelete}
        onOpenChange={(open) => !open && setRelationToDelete(null)}
        title="Beziehung löschen?"
        description={
          relationToDelete
            ? `Möchten Sie die Beziehung zu "${getTargetName(relationToDelete)}" wirklich löschen?`
            : ''
        }
        onConfirm={() => relationToDelete && handleDelete(relationToDelete)}
      />
    </div>
  );
}
