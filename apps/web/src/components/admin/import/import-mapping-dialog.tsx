'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Loader2, Globe } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

// Mapping types
const MAPPING_TYPES = ['ATTRIBUTE', 'CATEGORY', 'MANUFACTURER', 'UNIT'] as const;

// Form schema
const ImportMappingFormSchema = z.object({
  sourceId: z.string().optional(),
  mappingType: z.enum(MAPPING_TYPES),
  sourceKey: z.string().min(1, 'Quell-Schlüssel ist erforderlich'),
  sourceValue: z.string().optional(),
  targetAttributeId: z.string().optional(),
  targetCategoryId: z.string().optional(),
  targetManufacturerId: z.string().optional(),
  conversionFactor: z.coerce.number().optional(),
  conversionOffset: z.coerce.number().optional(),
  parsePattern: z.string().optional(),
  priority: z.coerce.number().int().min(0).max(100),
  isActive: z.boolean(),
});

type ImportMappingFormValues = z.infer<typeof ImportMappingFormSchema>;

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
}

interface ImportSource {
  id: string;
  name: string;
  slug: string;
}

interface AttributeDefinition {
  id: string;
  name: string;
  displayName: Record<string, string>;
}

interface Category {
  id: string;
  name: Record<string, string>;
  slug: string;
}

interface Manufacturer {
  id: string;
  name: string;
  slug: string;
}

interface ImportMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping?: ImportMapping | null;
  sources: ImportSource[];
  onSuccess: () => void;
}

export function ImportMappingDialog({
  open,
  onOpenChange,
  mapping,
  sources,
  onSuccess,
}: ImportMappingDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin.import.mappings');
  const tCommon = useTranslations('common');
  const isEdit = !!mapping;

  const [isSaving, setIsSaving] = useState(false);
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const form = useForm<ImportMappingFormValues>({
    resolver: zodResolver(ImportMappingFormSchema) as never,
    defaultValues: {
      sourceId: '',
      mappingType: 'ATTRIBUTE',
      sourceKey: '',
      sourceValue: '',
      targetAttributeId: '',
      targetCategoryId: '',
      targetManufacturerId: '',
      conversionFactor: undefined,
      conversionOffset: undefined,
      parsePattern: '',
      priority: 0,
      isActive: true,
    },
  });

  const mappingType = form.watch('mappingType');

  // Load target options
  const loadTargetOptions = useCallback(async () => {
    try {
      const [attrsRes, catsRes, mfrsRes] = await Promise.all([
        api.get<AttributeDefinition[]>('/attributes', { limit: 500 }),
        api.get<Category[]>('/categories', { limit: 500 }),
        api.get<Manufacturer[]>('/manufacturers', { limit: 500 }),
      ]);
      setAttributes(attrsRes.data ?? []);
      setCategories(catsRes.data ?? []);
      setManufacturers(mfrsRes.data ?? []);
    } catch (error) {
      console.error('Failed to load target options:', error);
    }
  }, [api]);

  useEffect(() => {
    if (open) {
      loadTargetOptions();
    }
  }, [open, loadTargetOptions]);

  useEffect(() => {
    if (mapping) {
      form.reset({
        sourceId: mapping.sourceId || '',
        mappingType: mapping.mappingType,
        sourceKey: mapping.sourceKey,
        sourceValue: mapping.sourceValue || '',
        targetAttributeId: mapping.targetAttributeId || '',
        targetCategoryId: mapping.targetCategoryId || '',
        targetManufacturerId: mapping.targetManufacturerId || '',
        conversionFactor: mapping.conversionFactor ?? undefined,
        conversionOffset: mapping.conversionOffset ?? undefined,
        parsePattern: mapping.parsePattern || '',
        priority: mapping.priority,
        isActive: mapping.isActive,
      });
    } else {
      form.reset({
        sourceId: '',
        mappingType: 'ATTRIBUTE',
        sourceKey: '',
        sourceValue: '',
        targetAttributeId: '',
        targetCategoryId: '',
        targetManufacturerId: '',
        conversionFactor: undefined,
        conversionOffset: undefined,
        parsePattern: '',
        priority: 0,
        isActive: true,
      });
    }
  }, [mapping, form, open]);

  const handleSubmit = async (data: ImportMappingFormValues) => {
    setIsSaving(true);

    try {
      // Prepare data - remove empty strings and set appropriate target
      const payload = {
        ...data,
        sourceId: data.sourceId || undefined,
        sourceValue: data.sourceValue || undefined,
        targetAttributeId: data.mappingType === 'ATTRIBUTE' ? data.targetAttributeId || undefined : undefined,
        targetCategoryId: data.mappingType === 'CATEGORY' ? data.targetCategoryId || undefined : undefined,
        targetManufacturerId: data.mappingType === 'MANUFACTURER' ? data.targetManufacturerId || undefined : undefined,
        conversionFactor: data.conversionFactor || undefined,
        conversionOffset: data.conversionOffset || undefined,
        parsePattern: data.parsePattern || undefined,
      };

      if (isEdit && mapping) {
        await api.put(`/import/mappings/${mapping.id}`, payload);
        toast({
          title: tCommon('success'),
          description: 'Mapping wurde aktualisiert',
        });
      } else {
        await api.post('/import/mappings', payload);
        toast({
          title: tCommon('success'),
          description: 'Mapping wurde erstellt',
        });
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Failed to save mapping:', error);
      const errorMessage = error instanceof Error ? error.message : 'Speichern fehlgeschlagen';
      toast({
        title: tCommon('error'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            Definieren Sie eine Übersetzungsregel für importierte Daten
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Source */}
            <FormField
              control={form.control}
              name="sourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.source')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('form.sourceGlobal')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          {t('form.sourceGlobal')}
                        </span>
                      </SelectItem>
                      {sources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Globale Mappings gelten für alle Quellen
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mapping Type */}
            <FormField
              control={form.control}
              name="mappingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.type')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MAPPING_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`types.${type}` as const)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source Key */}
            <FormField
              control={form.control}
              name="sourceKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sourceKey')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.sourceKeyPlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>
                    Der Attribut-Name aus der Import-Quelle
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Source Value (optional) */}
            <FormField
              control={form.control}
              name="sourceValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.sourceValue')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.sourceValuePlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional: Für wertbasiertes Mapping (z.B. Kategorie-Namen)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Target Attribute */}
            {mappingType === 'ATTRIBUTE' && (
              <FormField
                control={form.control}
                name="targetAttributeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.targetAttribute')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Attribut auswählen..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {attributes.map((attr) => (
                          <SelectItem key={attr.id} value={attr.id}>
                            {attr.displayName?.de || attr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Target Category */}
            {mappingType === 'CATEGORY' && (
              <FormField
                control={form.control}
                name="targetCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.targetCategory')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie auswählen..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name?.de || cat.slug}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Target Manufacturer */}
            {mappingType === 'MANUFACTURER' && (
              <FormField
                control={form.control}
                name="targetManufacturerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.targetManufacturer')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hersteller auswählen..." />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Conversion fields for UNIT type */}
            {mappingType === 'UNIT' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="conversionFactor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.conversionFactor')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="1.0"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conversionOffset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.conversionOffset')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="any"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Parse Pattern */}
            <FormField
              control={form.control}
              name="parsePattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.parsePattern')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.parsePatternPlaceholder')}
                      {...field}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Regex zur Wert-Extraktion (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.priority')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Höhere Priorität wird bevorzugt (0-100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t('form.active')}</FormLabel>
                    <FormDescription>
                      Deaktivierte Mappings werden ignoriert
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? 'Speichern...' : tCommon('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
