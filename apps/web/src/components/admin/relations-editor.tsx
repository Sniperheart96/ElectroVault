'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Link2,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocalizedInput } from '@/components/forms/localized-input';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import {
  type ComponentRelation,
  type ConceptRelationType,
  type Component,
  type LocalizedString,
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

interface RelationsEditorProps {
  componentId: string;
  componentName: LocalizedString;
}

// Backend ConceptRelationType Schema
const CreateRelationSchema = z.object({
  targetId: z.string().min(1, 'Bitte wählen Sie ein Ziel-Bauteil'),
  relationType: z.enum([
    'DUAL_VERSION',
    'QUAD_VERSION',
    'LOW_POWER_VERSION',
    'HIGH_SPEED_VERSION',
    'MILITARY_VERSION',
    'AUTOMOTIVE_VERSION',
    'FUNCTIONAL_EQUIV',
  ]),
  notes: z
    .object({
      de: z.string().optional(),
      en: z.string().optional(),
    })
    .optional(),
});

type CreateRelationInput = z.infer<typeof CreateRelationSchema>;

// Konfiguration für ConceptRelationType (Hardware-Varianten)
const RELATION_TYPE_CONFIG: Record<
  ConceptRelationType,
  {
    label: string;
    icon: React.ReactNode;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
    description: string;
  }
> = {
  DUAL_VERSION: {
    label: 'Dual-Version',
    icon: <Link2 className="h-4 w-4" />,
    variant: 'default',
    description: 'Dual-Version (z.B. 556 ist Dual-555)',
  },
  QUAD_VERSION: {
    label: 'Quad-Version',
    icon: <Puzzle className="h-4 w-4" />,
    variant: 'default',
    description: 'Quad-Version (z.B. LM324 ist Quad-LM358)',
  },
  LOW_POWER_VERSION: {
    label: 'Low-Power',
    icon: <TrendingDown className="h-4 w-4" />,
    variant: 'success',
    description: 'Stromsparende Version (z.B. CMOS statt Bipolar)',
  },
  HIGH_SPEED_VERSION: {
    label: 'High-Speed',
    icon: <TrendingUp className="h-4 w-4" />,
    variant: 'warning',
    description: 'Schnellere Version mit höherer Bandbreite',
  },
  MILITARY_VERSION: {
    label: 'Militär-Version',
    icon: <ShieldCheck className="h-4 w-4" />,
    variant: 'destructive',
    description: 'Militärische Spezifikation (MIL-SPEC)',
  },
  AUTOMOTIVE_VERSION: {
    label: 'Automotive',
    icon: <ShieldAlert className="h-4 w-4" />,
    variant: 'secondary',
    description: 'Automotive-qualifiziert (AEC-Q100/101)',
  },
  FUNCTIONAL_EQUIV: {
    label: 'Funktions-Äquivalent',
    icon: <RefreshCw className="h-4 w-4" />,
    variant: 'success',
    description: 'Funktional gleichwertig, andere Implementierung',
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
    resolver: zodResolver(CreateRelationSchema),
    defaultValues: {
      targetId: '',
      relationType: 'FUNCTIONAL_EQUIV',
      notes: { de: '', en: '' },
    },
  });

  const loadRelations = async () => {
    try {
      setLoading(true);
      const result = await api.getComponentRelations(componentId);
      // Die API gibt { outgoing: [], incoming: [] } zurück
      // Wir kombinieren beide Arrays zu einem flachen Array
      const data = result.data as unknown as { outgoing: ComponentRelation[]; incoming: ComponentRelation[] };
      const allRelations = [...(data.outgoing || []), ...(data.incoming || [])];
      setRelations(allRelations);
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
      if (editingRelation) {
        // Update nur Notes möglich (relationType ist unveränderlich)
        await api.updateRelation(componentId, editingRelation.id, {
          notes: data.notes,
        });
        toast({
          title: 'Erfolg',
          description: 'Beziehung wurde aktualisiert.',
        });
      } else {
        // Neue Beziehung erstellen
        await api.createRelation({
          sourceId: componentId,
          targetId: data.targetId,
          relationType: data.relationType,
          notes: data.notes,
        });
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
      notes: relation.notes || { de: '', en: '' },
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (relation: ComponentRelation) => {
    try {
      await api.deleteRelation(componentId, relation.id);
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
      relationType: 'FUNCTIONAL_EQUIV',
      notes: { de: '', en: '' },
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
                    {relation.notes && (relation.notes.de || relation.notes.en) && (
                      <p className="text-sm text-muted-foreground">
                        {relation.notes.de || relation.notes.en}
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
                        {(Object.keys(RELATION_TYPE_CONFIG) as ConceptRelationType[]).map((type) => {
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen (optional)</FormLabel>
                    <FormControl>
                      <LocalizedInput
                        value={field.value || { de: '', en: '' }}
                        onChange={field.onChange}
                        placeholder="Zusätzliche Hinweise zur Beziehung"
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
