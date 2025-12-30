'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { CreateComponentSchema, type CreateComponentInput } from '@electrovault/schemas';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
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
import { DialogEditLocaleSelector } from '@/components/forms/dialog-edit-locale-selector';
import { EditLocaleProvider } from '@/contexts/edit-locale-context';
import { CategoryCascadeSelect } from '@/components/forms/category-cascade-select';
import { type Component, type CategoryTreeNode, type Part, type Manufacturer, type Package } from '@/lib/api';
import { PartDialog } from '@/components/admin/part-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { AttributeFields } from '@/components/admin/attribute-fields';
import { RelationsEditor } from '@/components/admin/relations-editor';
import { PinMappingEditor } from '@/components/admin/pin-mapping-editor';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

import { type SIPrefix } from '@/lib/api';

interface AttributeValue {
  definitionId: string;
  normalizedValue?: number | null;
  normalizedMin?: number | null;
  normalizedMax?: number | null;
  prefix?: SIPrefix | null;
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

export function ComponentDialog({
  open,
  onOpenChange,
  component,
  onSaved,
  onDataChanged,
}: ComponentDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tComponents = useTranslations('components');
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingComponent, setLoadingComponent] = useState(false);

  // Local component state - allows switching to edit mode after creation
  const [localComponent, setLocalComponent] = useState<Component | null>(null);
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
      packageId: undefined,
      saveAsDraft: false,
      shortDescription: { de: '', en: '' },
      fullDescription: { de: '', en: '' },
      series: '',
    },
  });

  // Load full component data when editing (list items don't have all fields)
  useEffect(() => {
    const loadFullComponent = async () => {
      if (component && open) {
        setLoadingComponent(true);
        try {
          const result = await api.getComponentById(component.id);
          setLocalComponent(result.data);
        } catch (error) {
          console.error('Failed to load component details:', error);
          // Fallback to the partial data from list
          setLocalComponent(component as Component);
        } finally {
          setLoadingComponent(false);
        }
      } else if (!open) {
        // Only reset when closing
        setLocalComponent(null);
        setActiveTab('details');
      }
    };
    loadFullComponent();
  }, [component, open]);

  // Reset parts on close
  useEffect(() => {
    if (!open) {
      setParts([]);
    }
  }, [open]);

  // Load categories and packages
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingCategories(true);
        const [categoriesResult, packagesResult] = await Promise.all([
          api.getCategoryTree(),
          api.getPackages({ limit: 100 }),
        ]);
        setCategoryTree(categoriesResult.data);
        setPackages(packagesResult.data);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast({
          title: t('messages.error'),
          description: t('messages.component.loadFailed'),
          variant: 'destructive',
        });
      } finally {
        setLoadingCategories(false);
      }
    };
    if (open) {
      loadInitialData();
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
          api.getParts({ componentId: localComponent.id, limit: 100 }),
          api.getManufacturers({ limit: 100 }),
          api.getPackages({ limit: 100 }),
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

  // Reset form when localComponent changes - must wait for categories to be loaded
  useEffect(() => {
    // Don't reset until categories are loaded (for Select to work properly)
    if (loadingCategories) {
      return;
    }

    if (localComponent) {
      form.reset({
        name: localComponent.name || { de: '', en: '' },
        categoryId: localComponent.categoryId,
        packageId: localComponent.packageId || undefined,
        saveAsDraft: localComponent.status === 'DRAFT',
        shortDescription: localComponent.shortDescription || { de: '', en: '' },
        fullDescription: localComponent.fullDescription || { de: '', en: '' },
        series: localComponent.series || '',
      });

      // Initialize componentAttributes from existing attribute values
      // Sicherstellen dass alle numerischen Werte auch wirklich Zahlen sind
      if (localComponent.attributeValues && localComponent.attributeValues.length > 0) {
        const loadedAttributes: AttributeValue[] = localComponent.attributeValues.map((av) => ({
          definitionId: av.definitionId,
          normalizedValue: av.normalizedValue !== null && av.normalizedValue !== undefined
            ? Number(av.normalizedValue)
            : null,
          normalizedMin: av.normalizedMin !== null && av.normalizedMin !== undefined
            ? Number(av.normalizedMin)
            : null,
          normalizedMax: av.normalizedMax !== null && av.normalizedMax !== undefined
            ? Number(av.normalizedMax)
            : null,
          prefix: av.prefix,
          stringValue: av.stringValue,
        }));
        setComponentAttributes(loadedAttributes);
      } else {
        setComponentAttributes([]);
      }
    } else {
      form.reset({
        name: { de: '', en: '' },
        categoryId: '',
        packageId: undefined,
        saveAsDraft: false,
        shortDescription: { de: '', en: '' },
        fullDescription: { de: '', en: '' },
        series: '',
      });
      setComponentAttributes([]);
    }
  }, [localComponent, form, loadingCategories, categoryTree.length]);

  const onSubmit = async (data: CreateComponentInput) => {
    // Add attribute values to the data
    const dataWithAttributes = {
      ...data,
      attributeValues: componentAttributes.length > 0 ? componentAttributes : undefined,
    };

    try {
      if (isEdit && localComponent) {
        // Remove categoryId from update payload (not allowed in UpdateComponentSchema)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { categoryId, ...updateData } = dataWithAttributes;
        await api.updateComponent(localComponent.id, updateData);
        toast({
          title: t('messages.success'),
          description: t('messages.component.updated'),
        });
        onSaved();
      } else {
        // Create new component and switch to edit mode
        const result = await api.createComponent(dataWithAttributes);
        const newComponent = result.data;

        toast({
          title: t('messages.success'),
          description: t('dialogs.component.createdWithVariants'),
        });

        // Switch to edit mode with the new component
        setLocalComponent(newComponent);
        setActiveTab('parts');

        // Load manufacturers and packages for parts tab
        try {
          const [manufacturersResult, packagesResult] = await Promise.all([
            api.getManufacturers({ limit: 100 }),
            api.getPackages({ limit: 100 }),
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
        title: t('messages.error'),
        description: t('messages.component.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  // Parts management functions
  const reloadParts = async () => {
    if (!localComponent) return;
    try {
      setLoadingParts(true);
      const result = await api.getParts({ componentId: localComponent.id, limit: 100 });
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
        title: t('messages.success'),
        description: t('messages.part.deleted'),
      });
      reloadParts();
      setPartToDelete(null);
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.part.deleteFailed'),
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

    return <Badge variant={variants[status] || 'secondary'}>{tComponents(`status.${status}`)}</Badge>;
  };

  const getLifecycleBadge = (status: Part['lifecycleStatus']) => {
    const variants = {
      ACTIVE: 'default',
      NRND: 'secondary',
      EOL: 'warning',
      OBSOLETE: 'destructive',
    } as const;

    return <Badge variant={variants[status] || 'secondary'}>{tComponents(`lifecycle.${status}`)}</Badge>;
  };

  const getManufacturerName = (manufacturerId: string) => {
    const manufacturer = manufacturers.find((m) => m.id === manufacturerId);
    return manufacturer?.name || t('parts.unknown');
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <EditLocaleProvider>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {isEdit ? t('dialogs.component.titleEdit') : t('dialogs.component.title')}
                </DialogTitle>
                <DialogDescription>
                  {isEdit
                    ? t('dialogs.component.descriptionEdit')
                    : t('dialogs.component.description')}
                </DialogDescription>
              </div>
              <DialogEditLocaleSelector />
            </div>
          </DialogHeader>

          {loadingComponent ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            <TabsTrigger value="attributes">{t('tabs.attributes')}</TabsTrigger>
            <TabsTrigger value="pins" disabled={!isEdit}>
              {t('tabs.pins')}
            </TabsTrigger>
            <TabsTrigger value="parts" disabled={!isEdit}>
              {t('tabs.parts')} {isEdit && `(${parts.length})`}
            </TabsTrigger>
            <TabsTrigger value="relations" disabled={!isEdit}>
              {t('tabs.relations')}
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
                      <FormLabel>{t('form.name')}</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          placeholder={t('form.namePlaceholder')}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('form.nameDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <CategoryCascadeSelect
                        categoryTree={categoryTree}
                        value={field.value || ''}
                        onChange={field.onChange}
                        loading={loadingCategories}
                        error={fieldState.error?.message}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.series')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('form.seriesPlaceholder')}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('form.seriesDescription')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="packageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.package')}</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === '__none__' ? undefined : value)}
                        value={field.value || '__none__'}
                        defaultValue="__none__"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('form.selectPackage')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">{t('form.noPackage')}</SelectItem>
                          {packages.map((pkg) => (
                            <SelectItem key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.mountingType})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('form.packageDescription')}
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
                      <FormLabel>{t('form.shortDescription')}</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          placeholder={t('form.shortDescriptionPlaceholder')}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('form.shortDescriptionDescription')}
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
                      <FormLabel>{t('form.fullDescription')}</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          multiline
                          placeholder={t('form.fullDescriptionPlaceholder')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    {tCommon('cancel')}
                  </Button>
                  {!isEdit && (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={form.formState.isSubmitting}
                      onClick={() => {
                        form.setValue('saveAsDraft', true);
                        form.handleSubmit(onSubmit)();
                      }}
                    >
                      {form.formState.isSubmitting ? t('buttons.saving') : t('buttons.saveAsDraft')}
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={form.formState.isSubmitting}
                    onClick={() => {
                      form.setValue('saveAsDraft', false);
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    {form.formState.isSubmitting
                      ? t('buttons.saving')
                      : isEdit
                        ? t('buttons.update')
                        : tCommon('save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('form.attributesDescription')}
                {!form.watch('categoryId') && (
                  <span className="text-warning ml-1">
                    {t('form.selectCategoryFirst')}
                  </span>
                )}
              </p>

              <AttributeFields
                categoryId={form.watch('categoryId') || null}
                scope="COMPONENT"
                values={componentAttributes}
                onChange={setComponentAttributes}
                sectionLabel="Bauteil-Attribute"
                includeInherited={true}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  {tCommon('cancel')}
                </Button>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={form.formState.isSubmitting}
                    onClick={() => {
                      form.setValue('saveAsDraft', true);
                      form.handleSubmit(onSubmit)();
                    }}
                  >
                    {form.formState.isSubmitting ? t('buttons.saving') : t('buttons.saveAsDraft')}
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={form.formState.isSubmitting}
                  onClick={() => {
                    form.setValue('saveAsDraft', false);
                    form.handleSubmit(onSubmit)();
                  }}
                >
                  {form.formState.isSubmitting
                    ? t('buttons.saving')
                    : isEdit
                      ? t('buttons.update')
                      : tCommon('save')}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          {/* Pin-Mapping Tab */}
          <TabsContent value="pins" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('dialogs.component.saveFirstPinMapping')}</p>
              </div>
            ) : localComponent ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('form.pinMappingDescription')}
                </p>
                <PinMappingEditor componentId={localComponent.id} />
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>
                    {t('form.close')}
                  </Button>
                </DialogFooter>
              </div>
            ) : null}
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
        )}

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
        </EditLocaleProvider>
      </DialogContent>
    </Dialog>
  );
}
