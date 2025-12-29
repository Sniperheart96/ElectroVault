'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { type AttributeDefinition, type SIPrefix } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { useCategoriesFlat } from '@/hooks/use-categories-flat';
import { X } from 'lucide-react';

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

// Schema für Attribut-Definition
const CreateAttributeSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayName: LocalizedStringSchema,
  unit: z.string().max(50).optional().nullable(),
  dataType: z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN']),
  scope: z.enum(['COMPONENT', 'PART', 'BOTH']),
  isFilterable: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  isLabel: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  allowedPrefixes: z.array(SIPrefixSchema).default([]),
  enumValues: z.string().optional(), // Kommaseparierte Liste für ENUM (später)
}).refine(
  (data) => !data.isLabel || data.isRequired,
  { message: 'Label erfordert Pflichtfeld', path: ['isLabel'] }
);

type CreateAttributeInput = z.infer<typeof CreateAttributeSchema>;

interface AttributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attribute?: AttributeDefinition | null;
  onSaved: () => void;
  presetCategoryId?: string;
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
  const isEdit = !!attribute;
  const { categories, loading: loadingCategories } = useCategoriesFlat();

  const form = useForm<CreateAttributeInput>({
    resolver: zodResolver(CreateAttributeSchema) as never,
    defaultValues: {
      categoryId: presetCategoryId || '',
      name: '',
      displayName: { de: '', en: '' },
      unit: null,
      dataType: 'STRING',
      scope: 'PART',
      isFilterable: true,
      isRequired: false,
      isLabel: false,
      sortOrder: 0,
      allowedPrefixes: [],
      enumValues: '',
    },
  });

  // Watch dataType to show/hide prefix selection
  const dataType = form.watch('dataType');
  const showPrefixes = dataType === 'DECIMAL' || dataType === 'INTEGER';

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
        dataType: (attribute.dataType as string) === 'RANGE' ? 'DECIMAL' : attribute.dataType,
        scope: attribute.scope,
        isFilterable: attribute.isFilterable,
        isRequired: attribute.isRequired,
        isLabel: attribute.isLabel || false,
        sortOrder: attribute.sortOrder,
        allowedPrefixes: attribute.allowedPrefixes || [],
        enumValues: '',
      });
    } else {
      form.reset({
        categoryId: presetCategoryId || '',
        name: '',
        displayName: { de: '', en: '' },
        unit: null,
        dataType: 'STRING',
        scope: 'PART',
        isFilterable: true,
        isRequired: false,
        isLabel: false,
        sortOrder: 0,
        allowedPrefixes: [],
        enumValues: '',
      });
    }
  }, [attribute, form, presetCategoryId]);

  const onSubmit = async (data: CreateAttributeInput) => {
    try {
      // Remove enumValues from payload (not yet supported in backend)
      // Clear allowedPrefixes if not a numeric type
      const { enumValues, ...rest } = data;
      const payload = {
        ...rest,
        allowedPrefixes: (data.dataType === 'DECIMAL' || data.dataType === 'INTEGER')
          ? data.allowedPrefixes
          : [],
      };

      if (isEdit) {
        await api.updateAttributeDefinition(attribute.id, payload);
        toast({
          title: 'Erfolg',
          description: 'Attribut-Definition wurde aktualisiert.',
        });
      } else {
        await api.createAttributeDefinition(payload);
        toast({
          title: 'Erfolg',
          description: 'Attribut-Definition wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Attribut-Definition konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
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

  // Helper to get prefix label
  const getPrefixLabel = (prefix: SIPrefix) => {
    const found = ALL_SI_PREFIXES.find((p) => p.value === prefix);
    return found?.label || prefix || '-';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Attribut-Definition bearbeiten' : 'Neue Attribut-Definition'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Attribut-Informationen ändern'
              : 'Neue Attribut-Definition für eine Kategorie erstellen'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!presetCategoryId && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={loadingCategories ? 'Lädt...' : 'Kategorie wählen'}
                          />
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
                    <FormDescription>
                      Kategorie, für die dieses Attribut gilt
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sortierreihenfolge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Niedrigere Werte = weiter oben
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        <SelectItem value="STRING">Text</SelectItem>
                        <SelectItem value="BOOLEAN">Ja/Nein</SelectItem>
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
                    <FormDescription>
                      Wählen Sie die Präfixe aus, die bei der Eingabe verwendet werden können.
                      Ohne Auswahl wird kein Präfix-Dropdown angezeigt.
                    </FormDescription>

                    {/* Ausgewählte Präfixe als Badges */}
                    {field.value && field.value.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {field.value.map((prefix) => (
                          <Badge
                            key={prefix || 'base'}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => togglePrefix(prefix)}
                          >
                            {getPrefixLabel(prefix)}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Präfix-Grid zur Auswahl */}
                    <div className="grid grid-cols-5 gap-1 p-2 border rounded-md bg-muted/30">
                      {ALL_SI_PREFIXES.map((prefix) => {
                        const isSelected = field.value?.includes(prefix.value);
                        return (
                          <button
                            key={prefix.value || 'base'}
                            type="button"
                            className={`
                              p-2 text-sm rounded border transition-colors
                              ${isSelected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background hover:bg-accent border-input'
                              }
                            `}
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
                Abbrechen
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Speichern...'
                  : isEdit
                    ? 'Aktualisieren'
                    : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
