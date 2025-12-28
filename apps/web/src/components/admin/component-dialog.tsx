'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateComponentSchema, type CreateComponentInput } from '@electrovault/schemas';
import { Plus, Pencil, Trash2, AlertCircle, Package as PackageIcon } from 'lucide-react';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LocalizedInput } from '@/components/forms/localized-input';
import { type Component, type CategoryTreeNode, type Part, type Manufacturer, type Package } from '@/lib/api';
import { PartDialog } from '@/components/admin/part-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { AttributeFields } from '@/components/admin/attribute-fields';
import { RelationsEditor } from '@/components/admin/relations-editor';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

interface AttributeValue {
  definitionId: string;
  displayValue: string;
  normalizedValue?: number | null;
  normalizedMin?: number | null;
  normalizedMax?: number | null;
  stringValue?: string | null;
}

interface ComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: Component | null;
  onSaved: () => void;
  /** Called when data changes but dialog should stay open (for list refresh) */
  onDataChanged?: () => void;
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

export function ComponentDialog({
  open,
  onOpenChange,
  component,
  onSaved,
  onDataChanged,
}: ComponentDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Local component state - allows switching to edit mode after creation
  const [localComponent, setLocalComponent] = useState<Component | null>(component || null);
  const isEdit = !!localComponent;
  const [activeTab, setActiveTab] = useState('details');

  // Parts state
  const [parts, setParts] = useState<Part[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isPartCreateDialogOpen, setIsPartCreateDialogOpen] = useState(false);
  const [isPartEditDialogOpen, setIsPartEditDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);

  // Attribute values state (for COMPONENT scope attributes)
  const [componentAttributes, setComponentAttributes] = useState<AttributeValue[]>([]);

  const form = useForm<CreateComponentInput>({
    resolver: zodResolver(CreateComponentSchema) as never,
    defaultValues: {
      name: { de: '', en: '' },
      categoryId: '',
      status: 'DRAFT',
      shortDescription: { de: '', en: '' },
      fullDescription: { de: '', en: '' },
      series: '',
    },
  });

  // Sync localComponent with prop
  useEffect(() => {
    setLocalComponent(component || null);
    if (!component) {
      setActiveTab('details');
    }
  }, [component]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setLocalComponent(null);
      setActiveTab('details');
      setParts([]);
    }
  }, [open]);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const result = await api.getCategoryTree();
        setCategories(flattenCategories(result.data));
      } catch (error) {
        console.error('Failed to load categories:', error);
        toast({
          title: 'Fehler',
          description: 'Kategorien konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    if (open) {
      loadCategories();
    }
  }, [open, toast]);

  // Load parts when editing
  useEffect(() => {
    const loadParts = async () => {
      if (!localComponent) {
        setParts([]);
        return;
      }

      try {
        setLoadingParts(true);
        const [partsResult, manufacturersResult, packagesResult] = await Promise.all([
          api.getParts({ componentId: localComponent.id, limit: 500 }),
          api.getManufacturers({ limit: 500 }),
          api.getPackages({ limit: 500 }),
        ]);
        setParts(partsResult.data);
        setManufacturers(manufacturersResult.data);
        setPackages(packagesResult.data);
      } catch (error) {
        console.error('Failed to load parts:', error);
      } finally {
        setLoadingParts(false);
      }
    };

    if (open && isEdit) {
      loadParts();
    }
  }, [open, localComponent, isEdit]);

  useEffect(() => {
    if (localComponent) {
      form.reset({
        name: localComponent.name || { de: '', en: '' },
        categoryId: localComponent.categoryId,
        status: localComponent.status,
        shortDescription: localComponent.shortDescription || { de: '', en: '' },
        fullDescription: localComponent.description || { de: '', en: '' },
        series: '',
      });
    } else {
      form.reset({
        name: { de: '', en: '' },
        categoryId: '',
        status: 'DRAFT',
        shortDescription: { de: '', en: '' },
        fullDescription: { de: '', en: '' },
        series: '',
      });
    }
  }, [localComponent, form]);

  const onSubmit = async (data: CreateComponentInput) => {
    try {
      if (isEdit && localComponent) {
        await api.updateComponent(localComponent.id, data);
        toast({
          title: 'Erfolg',
          description: 'Bauteil wurde aktualisiert.',
        });
        onSaved();
      } else {
        // Create new component and switch to edit mode
        const result = await api.createComponent(data);
        const newComponent = result.data;

        toast({
          title: 'Erfolg',
          description: 'Bauteil wurde erstellt. Sie können jetzt Hersteller-Varianten hinzufügen.',
        });

        // Switch to edit mode with the new component
        setLocalComponent(newComponent);
        setActiveTab('parts');

        // Load manufacturers and packages for parts tab
        try {
          const [manufacturersResult, packagesResult] = await Promise.all([
            api.getManufacturers({ limit: 500 }),
            api.getPackages({ limit: 500 }),
          ]);
          setManufacturers(manufacturersResult.data);
          setPackages(packagesResult.data);
        } catch (error) {
          console.error('Failed to load dropdown data:', error);
        }

        // Notify parent to reload list (but DON'T close dialog - use onDataChanged if available)
        if (onDataChanged) {
          onDataChanged();
        }
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Bauteil konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  // Parts management functions
  const reloadParts = async () => {
    if (!localComponent) return;
    try {
      setLoadingParts(true);
      const result = await api.getParts({ componentId: localComponent.id, limit: 500 });
      setParts(result.data);
    } catch (error) {
      console.error('Failed to reload parts:', error);
    } finally {
      setLoadingParts(false);
    }
  };

  const handlePartEdit = (part: Part) => {
    setSelectedPart(part);
    setIsPartEditDialogOpen(true);
  };

  const handlePartDelete = async (part: Part) => {
    try {
      await api.deletePart(part.id);
      toast({
        title: 'Erfolg',
        description: 'Hersteller-Variante wurde gelöscht.',
      });
      reloadParts();
      setPartToDelete(null);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Hersteller-Variante konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handlePartSaved = () => {
    reloadParts();
    setIsPartCreateDialogOpen(false);
    setIsPartEditDialogOpen(false);
    setSelectedPart(null);
  };

  const getStatusBadge = (status: Part['status']) => {
    const variants = {
      DRAFT: 'secondary',
      PENDING: 'warning',
      PUBLISHED: 'default',
      ARCHIVED: 'outline',
    } as const;

    const labels = {
      DRAFT: 'Entwurf',
      PENDING: 'Prüfung',
      PUBLISHED: 'Veröffentlicht',
      ARCHIVED: 'Archiviert',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const getLifecycleBadge = (status: Part['lifecycleStatus']) => {
    const variants = {
      ACTIVE: 'default',
      NRND: 'secondary',
      EOL: 'warning',
      OBSOLETE: 'destructive',
    } as const;

    const labels = {
      ACTIVE: 'Aktiv',
      NRND: 'NRND',
      EOL: 'Auslaufend',
      OBSOLETE: 'Obsolet',
    };

    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>;
  };

  const getManufacturerName = (manufacturerId: string) => {
    const manufacturer = manufacturers.find((m) => m.id === manufacturerId);
    return manufacturer?.name || 'Unbekannt';
  };

  const getPackageName = (packageId: string | null) => {
    if (!packageId) return null;
    const pkg = packages.find((p) => p.id === packageId);
    return pkg?.name || null;
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Bauteil bearbeiten' : 'Neues Bauteil'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Bauteilinformationen und Hersteller-Varianten verwalten'
              : 'Neues Bauteil erstellen - nach dem Speichern können Sie Hersteller-Varianten hinzufügen'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Stammdaten</TabsTrigger>
            <TabsTrigger value="parts" disabled={!isEdit}>
              Hersteller-Varianten {isEdit && `(${parts.length})`}
            </TabsTrigger>
            <TabsTrigger value="relations" disabled={!isEdit}>
              Beziehungen
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          placeholder="Bauteilname"
                        />
                      </FormControl>
                      <FormDescription>
                        Der Name in Deutsch und/oder Englisch
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategorie *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCategories ? 'Lädt...' : 'Kategorie auswählen'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Entwurf</SelectItem>
                          <SelectItem value="PENDING">Ausstehend</SelectItem>
                          <SelectItem value="PUBLISHED">Veröffentlicht</SelectItem>
                          <SelectItem value="ARCHIVED">Archiviert</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serie</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="z.B. 74HC, ATmega"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Optionale Bauteil-Serie oder -Familie
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kurzbeschreibung</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          placeholder="Kurze Beschreibung"
                        />
                      </FormControl>
                      <FormDescription>
                        Ein kurzer Satz zur Beschreibung des Bauteils
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ausführliche Beschreibung</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          multiline
                          placeholder="Ausführliche Beschreibung"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dynamische Attributfelder basierend auf Kategorie */}
                <div className="border-t pt-4 mt-4">
                  <AttributeFields
                    categoryId={form.watch('categoryId') || null}
                    scope="COMPONENT"
                    values={componentAttributes}
                    onChange={setComponentAttributes}
                    sectionLabel="Bauteil-Attribute"
                    includeInherited={true}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? 'Speichern...'
                      : isEdit
                        ? 'Aktualisieren'
                        : 'Speichern & Varianten hinzufügen'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Parts Tab */}
          <TabsContent value="parts" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Speichern Sie zuerst das Bauteil, um Hersteller-Varianten hinzuzufügen.</p>
              </div>
            ) : loadingParts ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Hersteller-spezifische Varianten dieses Bauteils
                  </p>
                  <Button size="sm" onClick={() => setIsPartCreateDialogOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Neue Variante
                  </Button>
                </div>

                {/* Warning if no parts */}
                {parts.length === 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Dieses Bauteil hat keine Hersteller-Varianten. Mindestens eine Variante ist erforderlich.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Parts Table */}
                {parts.length > 0 && (
                  <div className="max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>MPN</TableHead>
                          <TableHead>Hersteller</TableHead>
                          <TableHead>Bauform</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Lifecycle</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parts.map((part) => (
                          <TableRow key={part.id}>
                            <TableCell>
                              <div>
                                <span className="font-medium">{part.mpn}</span>
                                {part.orderingCode && (
                                  <p className="text-xs text-muted-foreground">
                                    {part.orderingCode}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {part.manufacturer?.name || getManufacturerName(part.manufacturerId)}
                            </TableCell>
                            <TableCell>
                              {part.package?.name || getPackageName(part.packageId) ? (
                                <div className="flex items-center gap-1">
                                  <PackageIcon className="h-3 w-3" />
                                  <span className="text-sm">
                                    {part.package?.name || getPackageName(part.packageId)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(part.status)}</TableCell>
                            <TableCell>{getLifecycleBadge(part.lifecycleStatus)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePartEdit(part)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPartToDelete(part)}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Summary */}
                {parts.length > 0 && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{parts.length} Variante{parts.length !== 1 ? 'n' : ''}</span>
                    <span>|</span>
                    <span>
                      {parts.filter((p) => p.lifecycleStatus === 'ACTIVE').length} aktiv
                    </span>
                    {parts.filter((p) => p.lifecycleStatus === 'OBSOLETE').length > 0 && (
                      <>
                        <span>|</span>
                        <span className="text-destructive">
                          {parts.filter((p) => p.lifecycleStatus === 'OBSOLETE').length} obsolet
                        </span>
                      </>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    Schließen
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>

          {/* Relations Tab */}
          <TabsContent value="relations" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Speichern Sie zuerst das Bauteil, um Beziehungen hinzuzufügen.</p>
              </div>
            ) : localComponent ? (
              <RelationsEditor
                componentId={localComponent.id}
                componentName={localComponent.name}
              />
            ) : null}
          </TabsContent>
        </Tabs>

        {/* Part Dialogs */}
        {localComponent && (
          <>
            <PartDialog
              open={isPartCreateDialogOpen}
              onOpenChange={setIsPartCreateDialogOpen}
              onSaved={handlePartSaved}
              presetComponentId={localComponent.id}
              presetCategoryId={localComponent.categoryId}
            />

            <PartDialog
              open={isPartEditDialogOpen}
              onOpenChange={setIsPartEditDialogOpen}
              part={selectedPart}
              onSaved={handlePartSaved}
              presetCategoryId={localComponent.categoryId}
            />

            <DeleteConfirmDialog
              open={!!partToDelete}
              onOpenChange={(open) => !open && setPartToDelete(null)}
              title="Hersteller-Variante löschen?"
              description={`Möchten Sie die Hersteller-Variante "${partToDelete?.mpn}" wirklich löschen?`}
              onConfirm={() => partToDelete && handlePartDelete(partToDelete)}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
