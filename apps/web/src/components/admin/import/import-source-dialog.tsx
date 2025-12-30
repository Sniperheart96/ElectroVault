'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

// Source types
const SOURCE_TYPES = [
  'API_MOUSER',
  'API_DIGIKEY',
  'API_FARNELL',
  'API_LCSC',
  'API_TME',
  'API_REICHELT',
  'API_CUSTOM',
  'FILE_CSV',
  'FILE_XML',
  'FILE_JSON',
] as const;

// Form schema (simplified for frontend - API handles full validation)
const ImportSourceFormSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  slug: z.string().optional(),
  sourceType: z.enum(SOURCE_TYPES),
  apiBaseUrl: z.string().url().optional().or(z.literal('')),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  // Rate Limiting
  rateLimitPerSecond: z.coerce.number().int().min(1).max(100).optional().or(z.literal('')),
  rateLimitPerMinute: z.coerce.number().int().min(1).max(10000),
  rateLimitPerDay: z.coerce.number().int().min(1).max(1000000).optional().or(z.literal('')),
  maxResultsPerRequest: z.coerce.number().int().min(1).max(10000).optional().or(z.literal('')),
  description: z.string().optional(),
  isActive: z.boolean(),
});

type ImportSourceFormValues = z.infer<typeof ImportSourceFormSchema>;

interface ImportSource {
  id: string;
  name: string;
  slug: string;
  sourceType: string;
  apiBaseUrl: string | null;
  rateLimitPerSecond: number | null;
  rateLimitPerMinute: number;
  rateLimitPerDay: number | null;
  maxResultsPerRequest: number | null;
  description: string | null;
  isActive: boolean;
}

interface ImportSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: ImportSource | null;
  onSuccess: () => void;
}

export function ImportSourceDialog({
  open,
  onOpenChange,
  source,
  onSuccess,
}: ImportSourceDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin.import.sources');
  const tCommon = useTranslations('common');
  const isEdit = !!source;

  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ImportSourceFormValues>({
    resolver: zodResolver(ImportSourceFormSchema) as never,
    defaultValues: {
      name: '',
      slug: '',
      sourceType: 'API_MOUSER',
      apiBaseUrl: '',
      apiKey: '',
      apiSecret: '',
      rateLimitPerSecond: '',
      rateLimitPerMinute: 60,
      rateLimitPerDay: '',
      maxResultsPerRequest: '',
      description: '',
      isActive: true,
    },
  });

  // Watch sourceType to show/hide API fields
  const sourceType = form.watch('sourceType');
  const isApiSource = sourceType?.startsWith('API_');

  useEffect(() => {
    if (source) {
      form.reset({
        name: source.name,
        slug: source.slug,
        sourceType: source.sourceType as typeof SOURCE_TYPES[number],
        apiBaseUrl: source.apiBaseUrl || '',
        apiKey: '', // Don't prefill API keys for security
        apiSecret: '',
        rateLimitPerSecond: source.rateLimitPerSecond ?? '',
        rateLimitPerMinute: source.rateLimitPerMinute,
        rateLimitPerDay: source.rateLimitPerDay ?? '',
        maxResultsPerRequest: source.maxResultsPerRequest ?? '',
        description: source.description || '',
        isActive: source.isActive,
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        sourceType: 'API_MOUSER',
        apiBaseUrl: '',
        apiKey: '',
        apiSecret: '',
        rateLimitPerSecond: '',
        rateLimitPerMinute: 60,
        rateLimitPerDay: '',
        maxResultsPerRequest: '',
        description: '',
        isActive: true,
      });
    }
  }, [source, form, open]);

  const handleSubmit = async (data: ImportSourceFormValues) => {
    setIsSaving(true);

    try {
      // Prepare data - remove empty strings
      const payload = {
        ...data,
        slug: data.slug || undefined,
        apiBaseUrl: data.apiBaseUrl || undefined,
        apiKey: data.apiKey || undefined,
        apiSecret: data.apiSecret || undefined,
        rateLimitPerSecond: typeof data.rateLimitPerSecond === 'number' ? data.rateLimitPerSecond : undefined,
        rateLimitPerDay: typeof data.rateLimitPerDay === 'number' ? data.rateLimitPerDay : undefined,
        maxResultsPerRequest: typeof data.maxResultsPerRequest === 'number' ? data.maxResultsPerRequest : undefined,
        description: data.description || undefined,
      };

      if (isEdit && source) {
        await api.put(`/import/sources/${source.id}`, payload);
        toast({
          title: tCommon('success'),
          description: 'Import-Quelle wurde aktualisiert',
        });
      } else {
        await api.post('/import/sources', payload);
        toast({
          title: tCommon('success'),
          description: 'Import-Quelle wurde erstellt',
        });
      }

      onSuccess();
    } catch (error: unknown) {
      console.error('Failed to save source:', error);
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>
            {isEdit ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            Konfigurieren Sie eine Import-Quelle für Bauteil-Daten
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
            {/* Name + Slug in one row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('form.namePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.slug')}</FormLabel>
                    <FormControl>
                      <Input placeholder="auto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Source Type + Active in one row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="sourceType"
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
                        {SOURCE_TYPES.map((type) => (
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
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('form.active')}</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2 h-9 px-3 border rounded-md">
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* API Fields - only shown for API sources */}
            {isApiSource && (
              <>
                {/* API URL */}
                <FormField
                  control={form.control}
                  name="apiBaseUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('form.apiUrl')}</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder={t('form.apiUrlPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* API Key + Secret in one row */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.apiKey')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={isEdit ? '(unverändert)' : 'API Key'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apiSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('form.apiSecret')}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={isEdit ? '(unverändert)' : 'API Secret'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Rate Limits in a grid */}
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="text-sm font-medium">Rate Limiting</div>
                  <div className="grid grid-cols-4 gap-3">
                    <FormField
                      control={form.control}
                      name="rateLimitPerSecond"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Pro Sekunde</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              placeholder="-"
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
                      name="rateLimitPerMinute"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Pro Minute *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10000}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rateLimitPerDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Pro Tag</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={1000000}
                              placeholder="-"
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
                      name="maxResultsPerRequest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Max. Ergebnisse</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10000}
                              placeholder="-"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormDescription className="text-xs">
                    Nur &quot;Pro Minute&quot; ist Pflichtfeld. Leere Felder = kein Limit.
                  </FormDescription>
                </div>
              </>
            )}

            {/* Description - compact */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.descriptionPlaceholder')}
                      {...field}
                      rows={2}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
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
