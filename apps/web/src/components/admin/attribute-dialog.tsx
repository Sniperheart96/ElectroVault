'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { LocalizedStringSchema, SIPrefixSchema } from '@electrovault/schemas';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { LocalizedInput } from '@/components/forms/localized-input';
import { DialogEditLocaleSelector } from '@/components/forms/dialog-edit-locale-selector';
import { EditLocaleProvider } from '@/contexts/edit-locale-context';
import { type AttributeDefinition, type SIPrefix } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

// Alle verfügbaren SI-Präfixe mit Anzeigenamen
const ALL_SI_PREFIXES: { value: SIPrefix; label: string; name: string }[] = [
  { value: 'P', label: 'P', name: 'Peta (10¹⁵)' },
  { value: 'T', label: 'T', name: 'Tera (10¹²)' },
  { value: 'G', label: 'G', name: 'Giga (10⁹)' },
  { value: 'M', label: 'M', name: 'Mega (10⁶)' },
  { value: 'k', label: 'k', name: 'Kilo (10³)' },
  { value: 'h', label: 'h', name: 'Hekto (10²)' },
  { value: 'da', label: 'da', name: 'Deka (10¹)' },
  { value: '', label: '-', name: 'Basis (10⁰)' },
  { value: 'd', label: 'd', name: 'Dezi (10⁻¹)' },
  { value: 'c', label: 'c', name: 'Zenti (10⁻²)' },
  { value: 'm', label: 'm', name: 'Milli (10⁻³)' },
  { value: '\u00B5', label: 'µ', name: 'Mikro (10⁻⁶)' },
  { value: 'n', label: 'n', name: 'Nano (10⁻⁹)' },
  { value: 'p', label: 'p', name: 'Piko (10⁻¹²)' },
  { value: 'f', label: 'f', name: 'Femto (10⁻¹⁵)' },
];

// Feste Sortierreihenfolge für Präfixe (groß → klein)
const PREFIX_ORDER = ['P', 'T', 'G', 'M', 'k', 'h', 'da', '', 'd', 'c', 'm', '\u00B5', 'n', 'p', 'f'];

const sortPrefixes = (prefixes: SIPrefix[]): SIPrefix[] => {
  return [...prefixes].sort((a, b) =>
    PREFIX_ORDER.indexOf(a) - PREFIX_ORDER.indexOf(b)
  );
};

// Schema für Attribut-Definition (categoryId wird via presetCategoryId gesetzt, sortOrder via D&D)
const CreateAttributeSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayName: LocalizedStringSchema,
  unit: z.string().max(50).optional().nullable(),
  dataType: z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN', 'RANGE', 'SELECT', 'MULTISELECT']),
  scope: z.enum(['COMPONENT', 'PART', 'BOTH']),
  isFilterable: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isLabel: z.boolean().default(false),
  allowedPrefixes: z.array(SIPrefixSchema).default([]),
  allowedValues: z.string().optional(), // Kommaseparierte Liste für SELECT/MULTISELECT
}).refine(
  (data) => !data.isLabel || data.isRequired,
  { message: 'Label erfordert Pflichtfeld', path: ['isLabel'] }
).refine(
  (data) => {
    // SELECT und MULTISELECT erfordern allowedValues
    if (data.dataType === 'SELECT' || data.dataType === 'MULTISELECT') {
      return data.allowedValues && data.allowedValues.trim().length > 0;
    }
    return true;
  },
  { message: 'Auswahlfelder erfordern mindestens eine Option', path: ['allowedValues'] }
);

type CreateAttributeInput = z.infer<typeof CreateAttributeSchema>;

interface AttributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: AttributeDefinition | null;
  onSaved: () => void;
  presetCategoryId: string; // Pflicht - Kategorie wird immer vom CategoryDialog gesetzt
}

export function AttributeDialog({
  open,
  onOpenChange,
  attribute,
  onSaved,
  presetCategoryId,
}: AttributeDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const isEdit = !!attribute;

  const form = useForm<CreateAttributeInput>({
    resolver: zodResolver(CreateAttributeSchema) as never,
    defaultValues: {
      categoryId: presetCategoryId,
      name: '',
      displayName: { de: '', en: '' },
      unit: null,
      dataType: 'STRING',
      scope: 'PART',
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      allowedPrefixes: [],
      allowedValues: '',
    },
  });

  // Watch dataType to show/hide prefix selection and allowed values
  const dataType = form.watch('dataType');
  const showPrefixes = dataType === 'DECIMAL' || dataType === 'INTEGER' || dataType === 'RANGE';
  const showAllowedValues = dataType === 'SELECT' || dataType === 'MULTISELECT';

  // Watch isRequired for isLabel checkbox
  const isRequired = form.watch('isRequired');

  // Wenn isRequired deaktiviert wird, auch isLabel deaktivieren
  useEffect(() => {
    if (!isRequired) {
      form.setValue('isLabel', false);
    }
  }, [isRequired, form]);

  useEffect(() => {
    if (attribute) {
      form.reset({
        categoryId: attribute.categoryId,
        name: attribute.name,
        displayName: attribute.displayName || { de: '', en: '' },
        unit: attribute.unit,
        dataType: attribute.dataType,
        scope: attribute.scope,
        isFilterable: attribute.isFilterable,
        isRequired: attribute.isRequired,
        isLabel: attribute.isLabel || false,
        allowedPrefixes: attribute.allowedPrefixes || [],
        // allowedValues als kommaseparierter String aus Array
        allowedValues: attribute.allowedValues ? attribute.allowedValues.join(', ') : '',
      });
    } else {
      form.reset({
        categoryId: presetCategoryId,
        name: '',
        displayName: { de: '', en: '' },
        unit: null,
        dataType: 'STRING',
        scope: 'PART',
        isFilterable: true,
        isRequired: false,
        isLabel: false,
        allowedPrefixes: [],
        allowedValues: '',
      });
    }
  }, [attribute, form, presetCategoryId]);

  const onSubmit = async (data: CreateAttributeInput) => {
    try {
      // allowedValues String zu Array konvertieren
      // allowedPrefixes nur bei numerischen Typen senden
      const { allowedValues, ...rest } = data;

      // allowedValues: kommaseparierter String -> Array (nur für SELECT/MULTISELECT)
      const parsedAllowedValues = (data.dataType === 'SELECT' || data.dataType === 'MULTISELECT')
        ? (allowedValues || '').split(',').map(v => v.trim()).filter(v => v.length > 0)
        : null;

      // Präfixe sortieren (groß → klein) bevor sie gespeichert werden
      const sortedPrefixes = (data.dataType === 'DECIMAL' || data.dataType === 'INTEGER' || data.dataType === 'RANGE')
        ? sortPrefixes(data.allowedPrefixes)
        : [];

      const payload = {
        ...rest,
        allowedPrefixes: sortedPrefixes,
        allowedValues: parsedAllowedValues,
      };

      if (isEdit) {
        await api.updateAttributeDefinition(attribute.id, payload);
        toast({
          title: t('messages.success'),
          description: t('messages.attribute.updated'),
        });
      } else {
        await api.createAttributeDefinition(payload);
        toast({
          title: t('messages.success'),
          description: t('messages.attribute.created'),
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.attribute.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  // Helper to toggle prefix in array
  const togglePrefix = (prefix: SIPrefix) => {
    const current = form.getValues('allowedPrefixes') || [];
    if (current.includes(prefix)) {
      form.setValue('allowedPrefixes', current.filter((p) => p !== prefix));
    } else {
      form.setValue('allowedPrefixes', [...current, prefix]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <EditLocaleProvider>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {isEdit ? t('dialogs.attribute.titleEdit') : t('dialogs.attribute.title')}
                </DialogTitle>
                <DialogDescription>
                  {t('dialogs.attribute.description')}
                </DialogDescription>
              </div>
              <DialogEditLocaleSelector />
            </div>
          </DialogHeader>

          <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Anzeigename zuerst */}
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anzeigename *</FormLabel>
                  <FormControl>
                    <LocalizedInput
                      value={field.value || { de: '', en: '' }}
                      onChange={field.onChange}
                      placeholder="Anzeigename in verschiedenen Sprachen"
                    />
                  </FormControl>
                  <FormDescription>
                    Name, der in der UI angezeigt wird
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interner Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (Intern) *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. capacitance, voltage_max"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Interner Name für API/Datenbank (keine Leerzeichen)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Einheit */}
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Einheit</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. µF, V, Ω"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Maßeinheit (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Datentyp *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DECIMAL">Dezimalzahl</SelectItem>
                        <SelectItem value="INTEGER">Ganzzahl</SelectItem>
                        <SelectItem value="RANGE">Bereich (Min-Max)</SelectItem>
                        <SelectItem value="STRING">Text</SelectItem>
                        <SelectItem value="BOOLEAN">Ja/Nein</SelectItem>
                        <SelectItem value="SELECT">Einfachauswahl</SelectItem>
                        <SelectItem value="MULTISELECT">Mehrfachauswahl</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COMPONENT">Component (herstellerunabhängig)</SelectItem>
                        <SelectItem value="PART">Part (herstellerspezifisch)</SelectItem>
                        <SelectItem value="BOTH">Beide (Component + Part)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Wo wird dieses Attribut verwendet?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SI-Präfix-Auswahl - nur für numerische Typen */}
            {showPrefixes && (
              <FormField
                control={form.control}
                name="allowedPrefixes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Erlaubte SI-Präfixe</FormLabel>
                    <FormDescription className="text-xs">
                      Ohne Auswahl wird kein Präfix-Dropdown angezeigt.
                    </FormDescription>

                    {/* Kompaktes Präfix-Grid (einzeilig) */}
                    <div className="flex flex-wrap gap-0.5 p-1.5 border rounded bg-muted/30">
                      {ALL_SI_PREFIXES.map((prefix) => {
                        const isSelected = field.value?.includes(prefix.value);
                        return (
                          <button
                            key={prefix.value || 'base'}
                            type="button"
                            className={cn(
                              'px-1.5 py-0.5 text-xs rounded border transition-colors min-w-[26px]',
                              isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-accent border-input'
                            )}
                            onClick={() => togglePrefix(prefix.value)}
                            title={prefix.name}
                          >
                            {prefix.label}
                          </button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Erlaubte Werte für SELECT/MULTISELECT */}
            {showAllowedValues && (
              <FormField
                control={form.control}
                name="allowedValues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Erlaubte Werte *</FormLabel>
                    <FormDescription>
                      Geben Sie die Auswahloptionen kommasepariert ein (z.B. &quot;NPN, PNP&quot; oder &quot;SMD, THT, Axial&quot;).
                    </FormDescription>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </FormControl>
                    {/* Vorschau der Optionen als Badges */}
                    {field.value && field.value.trim().length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value.split(',').map((v, i) => v.trim()).filter(v => v.length > 0).map((v, i) => (
                          <Badge key={i} variant="outline">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex gap-6 flex-wrap">
              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Pflichtfeld</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isFilterable"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Filterbar</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isLabel"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isRequired}
                      />
                    </FormControl>
                    <FormLabel className={`!mt-0 ${!isRequired ? 'text-muted-foreground' : ''}`}>
                      Label
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isRequired && (
              <p className="text-xs text-muted-foreground">
                Label-Attribute werden zur dynamischen Bauteilbezeichnung zusammengesetzt.
                Sortierreihenfolge bestimmt die Reihenfolge im Namen.
              </p>
            )}

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
        </EditLocaleProvider>
      </DialogContent>
    </Dialog>
  );
}
