'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { CreatePartSchema, type CreatePartInput, type UILocale } from '@electrovault/schemas';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { type Part, type Component, type Manufacturer, type SIPrefix } from '@/lib/api';
import { AttributeFields } from '@/components/admin/attribute-fields';
import { PartFilesManager } from '@/components/admin/part-files-manager';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { getLocalizedValue } from '@/components/ui/localized-text';

interface AttributeValue {
  definitionId: string;
  normalizedValue?: number | null;
  normalizedMin?: number | null;
  normalizedMax?: number | null;
  prefix?: SIPrefix | null;
  stringValue?: string | null;
}

interface PartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part?: Part | null;
  onSaved: () => void;
  presetComponentId?: string;
  /** Kategorie-ID für Attribut-Felder (wird benötigt für PART scope Attribute) */
  presetCategoryId?: string;
}

export function PartDialog({
  open,
  onOpenChange,
  part,
  onSaved,
  presetComponentId,
  presetCategoryId,
}: PartDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const locale = useLocale() as UILocale;
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tComponents = useTranslations('components');
  const isEdit = !!part;

  const [components, setComponents] = useState<Component[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Attribute values state (for PART scope attributes)
  const [partAttributes, setPartAttributes] = useState<AttributeValue[]>([]);

  // Track selected component's categoryId for attribute loading
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(presetCategoryId || null);

  const form = useForm<CreatePartInput>({
    resolver: zodResolver(CreatePartSchema) as never,
    defaultValues: {
      coreComponentId: presetComponentId || '',
      manufacturerId: '',
      mpn: '',
      orderingCode: '',
      weightGrams: undefined,
      dateCodeFormat: '',
      introductionYear: undefined,
      discontinuedYear: undefined,
      rohsCompliant: undefined,
      reachCompliant: undefined,
      nsn: '',
      milSpec: '',
      status: 'DRAFT',
      lifecycleStatus: 'ACTIVE',
    },
  });

  // Load dropdown data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [componentsResult, manufacturersResult] = await Promise.all([
          api.getComponents({ limit: 100 }),
          api.getManufacturers({ limit: 100 }),
        ]);
        setComponents(componentsResult.data);
        setManufacturers(manufacturersResult.data);
      } catch (error) {
        console.error('Failed to load dropdown data:', error);
        toast({
          title: t('messages.error'),
          description: t('messages.part.loadFailed'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      loadData();
      setActiveTab('details');
    }
  }, [open, toast]);

  // Reset form when part changes - wait for loading to complete
  useEffect(() => {
    // Don't reset until dropdown data is loaded (for Select components to work properly)
    if (loading) {
      return;
    }

    if (part) {
      form.reset({
        coreComponentId: part.coreComponentId,
        manufacturerId: part.manufacturerId,
        mpn: part.mpn,
        orderingCode: part.orderingCode || '',
        weightGrams: part.weightGrams || undefined,
        dateCodeFormat: part.dateCodeFormat || '',
        introductionYear: part.introductionYear || undefined,
        discontinuedYear: part.discontinuedYear || undefined,
        rohsCompliant: part.rohsCompliant ?? undefined,
        reachCompliant: part.reachCompliant ?? undefined,
        nsn: part.nsn || '',
        milSpec: part.milSpec || '',
        status: part.status,
        lifecycleStatus: part.lifecycleStatus,
      });
    } else {
      form.reset({
        coreComponentId: presetComponentId || '',
        manufacturerId: '',
        mpn: '',
        orderingCode: '',
        weightGrams: undefined,
        dateCodeFormat: '',
        introductionYear: undefined,
        discontinuedYear: undefined,
        rohsCompliant: undefined,
        reachCompliant: undefined,
        nsn: '',
        milSpec: '',
        status: 'DRAFT',
        lifecycleStatus: 'ACTIVE',
      });
    }
  }, [part, form, presetComponentId, loading]);

  const onSubmit = async (data: CreatePartInput) => {
    try {
      // Clean up empty strings to undefined
      const cleanData = {
        ...data,
        orderingCode: data.orderingCode || undefined,
        dateCodeFormat: data.dateCodeFormat || undefined,
        nsn: data.nsn || undefined,
        milSpec: data.milSpec || undefined,
      };

      if (isEdit) {
        await api.updatePart(part.id, cleanData);
        toast({
          title: t('messages.success'),
          description: t('messages.part.updated'),
        });
      } else {
        await api.createPart(cleanData);
        toast({
          title: t('messages.success'),
          description: t('messages.part.created'),
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.part.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[60]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialogs.part.titleEdit') : t('dialogs.part.title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('dialogs.part.descriptionEdit') : t('dialogs.part.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            <TabsTrigger value="attributes">{t('tabs.attributes')}</TabsTrigger>
            <TabsTrigger value="files" disabled={!isEdit}>
              {t('tabs.files')}
            </TabsTrigger>
          </TabsList>

          {/* Stammdaten Tab */}
          <TabsContent value="details" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Bauteil - nur anzeigen wenn nicht vordefiniert */}
                {!presetComponentId && (
                  <FormField
                    control={form.control}
                    name="coreComponentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.coreComponent')} *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue=""
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={loading ? tCommon('loading') : t('partForm.selectComponent')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {components.map((comp) => (
                              <SelectItem key={comp.id} value={comp.id}>
                                {getLocalizedValue(comp.name, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t('partForm.coreComponentDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Hersteller */}
                <FormField
                  control={form.control}
                  name="manufacturerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partForm.manufacturer')} *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue=""
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={loading ? tCommon('loading') : t('partForm.manufacturerPlaceholder')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {manufacturers.map((mfr) => (
                            <SelectItem key={mfr.id} value={mfr.id}>
                              {mfr.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('partForm.manufacturerDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* MPN */}
                <FormField
                  control={form.control}
                  name="mpn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partForm.mpn')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('partForm.mpnPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('partForm.mpnDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ordering Code */}
                <FormField
                  control={form.control}
                  name="orderingCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('partForm.orderingCode')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('partForm.orderingCodePlaceholder')}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('partForm.orderingCodeDesc')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Status */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.statusRecord')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue="DRAFT"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DRAFT">{tComponents('status.DRAFT')}</SelectItem>
                            <SelectItem value="PENDING">{tComponents('status.PENDING')}</SelectItem>
                            <SelectItem value="PUBLISHED">{tComponents('status.PUBLISHED')}</SelectItem>
                            <SelectItem value="ARCHIVED">{tComponents('status.ARCHIVED')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lifecycleStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.lifecycleStatus')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue="ACTIVE"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">{tComponents('lifecycle.ACTIVE')}</SelectItem>
                            <SelectItem value="NRND">{tComponents('lifecycle.NRND')}</SelectItem>
                            <SelectItem value="EOL">{tComponents('lifecycle.EOL')}</SelectItem>
                            <SelectItem value="OBSOLETE">{tComponents('lifecycle.OBSOLETE')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Years */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="introductionYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.introductionYear')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('partForm.introductionYearPlaceholder')}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="discontinuedYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.discontinuedYear')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t('partForm.discontinuedYearPlaceholder')}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Compliance */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rohsCompliant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true ? true : undefined);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('partForm.rohsCompliant')}</FormLabel>
                          <FormDescription>
                            {t('partForm.rohsDesc')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reachCompliant"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value === true}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true ? true : undefined);
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>{t('partForm.reachCompliant')}</FormLabel>
                          <FormDescription>
                            {t('partForm.reachDesc')}
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Optional fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weightGrams"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.weight')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={t('partForm.weightPlaceholder')}
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateCodeFormat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.dateCodeFormat')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('partForm.dateCodePlaceholder')}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('partForm.dateCodeDesc')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Military specs */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nsn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.nsn')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('partForm.nsnPlaceholder')}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="milSpec"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('partForm.milSpec')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('partForm.milSpecPlaceholder')}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting
                      ? t('buttons.saving')
                      : isEdit
                      ? t('buttons.update')
                      : tCommon('create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Attribute Tab */}
          <TabsContent value="attributes" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('partForm.partAttributesDesc')}
              </p>

              <AttributeFields
                categoryId={selectedCategoryId}
                scope="PART"
                values={partAttributes}
                onChange={setPartAttributes}
                sectionLabel={t('partForm.partAttributesLabel')}
                includeInherited={true}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? t('buttons.saving')
                    : isEdit
                    ? t('buttons.update')
                    : tCommon('create')}
                </Button>
              </DialogFooter>
            </div>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('dialogs.part.saveFirstFiles')}</p>
              </div>
            ) : part ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('partForm.filesDesc')}
                </p>
                <PartFilesManager partId={part.id} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {t('partForm.close')}
                  </Button>
                </DialogFooter>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
