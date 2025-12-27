'use client';

import { useEffect, useState } from 'react';
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
import { LocalizedInput } from '@/components/forms/localized-input';
import { api, type Category, type CategoryTreeNode } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Local schema for category creation/editing
const CreateCategorySchema = z.object({
  name: LocalizedStringSchema,
  parentId: z.string().uuid().optional().nullable(),
  description: z.object({
    de: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  iconUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSaved: () => void;
}

function flattenCategories(nodes: CategoryTreeNode[], prefix = '', excludeId?: string): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  for (const node of nodes) {
    if (excludeId && node.id === excludeId) continue;
    const name = prefix + (node.name.de || node.name.en || 'Unbekannt');
    result.push({ id: node.id, name });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, name + ' → ', excludeId));
    }
  }
  return result;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: CategoryDialogProps) {
  const { toast } = useToast();
  const isEdit = !!category;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      name: { de: '', en: '' },
      parentId: null,
      description: { de: '', en: '' },
      iconUrl: null,
      sortOrder: 0,
      isActive: true,
    },
  });

  // Load categories for parent selection
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const result = await api.getCategoryTree();
        // Exclude current category and its children when editing
        setCategories(flattenCategories(result.data, '', category?.id));
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    if (open) {
      loadCategories();
    }
  }, [open, category?.id]);

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || { de: '', en: '' },
        parentId: category.parentId,
        description: category.description || { de: '', en: '' },
        iconUrl: category.iconUrl,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
    } else {
      form.reset({
        name: { de: '', en: '' },
        parentId: null,
        description: { de: '', en: '' },
        iconUrl: null,
        sortOrder: 0,
        isActive: true,
      });
    }
  }, [category, form]);

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      // Clean up empty strings
      const payload = {
        ...data,
        parentId: data.parentId || null,
        iconUrl: data.iconUrl || null,
      };

      if (isEdit) {
        await api.updateCategory(category.id, payload);
        toast({
          title: 'Erfolg',
          description: 'Kategorie wurde aktualisiert.',
        });
      } else {
        await api.createCategory(payload);
        toast({
          title: 'Erfolg',
          description: 'Kategorie wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Kategorie konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Kategorie-Informationen ändern' : 'Neue Kategorie erstellen'}
          </DialogDescription>
        </DialogHeader>

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
                      placeholder="Kategoriename"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Übergeordnete Kategorie</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === '_none_' ? null : value)}
                    value={field.value || '_none_'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? 'Lädt...' : 'Keine (Root-Kategorie)'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none_">Keine (Root-Kategorie)</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Leer lassen für eine Hauptkategorie (Level 0)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beschreibung</FormLabel>
                  <FormControl>
                    <LocalizedInput
                      value={field.value || { de: '', en: '' }}
                      onChange={field.onChange}
                      multiline
                      placeholder="Beschreibung der Kategorie"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === 'true')}
                      value={field.value ? 'true' : 'false'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="true">Aktiv</SelectItem>
                        <SelectItem value="false">Inaktiv</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="iconUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon-URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/icon.svg"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    URL zu einem Icon-Bild (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Speichern...' : isEdit ? 'Aktualisieren' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
