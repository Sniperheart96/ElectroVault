'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LocalizedStringSchema } from '@electrovault/schemas';
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
import { LocalizedInput } from '@/components/forms/localized-input';
import { type AttributeDefinition } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { useCategoriesFlat } from '@/hooks/use-categories-flat';

// Schema für Attribut-Definition
const CreateAttributeSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayName: LocalizedStringSchema,
  unit: z.string().max(50).optional().nullable(),
  dataType: z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN', 'RANGE']),
  scope: z.enum(['COMPONENT', 'PART', 'BOTH']),
  isFilterable: z.boolean().default(true),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  enumValues: z.string().optional(), // Kommaseparierte Liste für ENUM (später)
});

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
      sortOrder: 0,
      enumValues: '',
    },
  });

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
        sortOrder: attribute.sortOrder,
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
        sortOrder: 0,
        enumValues: '',
      });
    }
  }, [attribute, form, presetCategoryId]);

  const onSubmit = async (data: CreateAttributeInput) => {
    try {
      // Remove enumValues from payload (not yet supported in backend)
      const { enumValues, ...payload } = data;

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
                        <SelectItem value="RANGE">Bereich (Min-Max)</SelectItem>
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

            <div className="flex gap-6">
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
            </div>

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
