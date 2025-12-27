'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateComponentSchema, type CreateComponentInput } from '@electrovault/schemas';
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
import { type Component, type CategoryTreeNode } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

interface ComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component?: Component | null;
  onSaved: () => void;
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
}: ComponentDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const isEdit = !!component;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const form = useForm<CreateComponentInput>({
    resolver: zodResolver(CreateComponentSchema),
    defaultValues: {
      name: { de: '', en: '' },
      categoryId: '',
      status: 'ACTIVE',
      shortDescription: { de: '', en: '' },
      fullDescription: { de: '', en: '' },
      series: '',
    },
  });

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

  useEffect(() => {
    if (component) {
      form.reset({
        name: component.name || { de: '', en: '' },
        categoryId: component.categoryId,
        status: component.status,
        shortDescription: component.shortDescription || { de: '', en: '' },
        fullDescription: component.description || { de: '', en: '' },
        series: '',
      });
    } else {
      form.reset({
        name: { de: '', en: '' },
        categoryId: '',
        status: 'ACTIVE',
        shortDescription: { de: '', en: '' },
        fullDescription: { de: '', en: '' },
        series: '',
      });
    }
  }, [component, form]);

  const onSubmit = async (data: CreateComponentInput) => {
    try {
      if (isEdit) {
        await api.updateComponent(component.id, data);
        toast({
          title: 'Erfolg',
          description: 'Bauteil wurde aktualisiert.',
        });
      } else {
        await api.createComponent(data);
        toast({
          title: 'Erfolg',
          description: 'Bauteil wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Bauteil konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Bauteil bearbeiten' : 'Neues Bauteil'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Bauteilinformationen ändern' : 'Neues Bauteil erstellen'}
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
                      <SelectItem value="ACTIVE">Aktiv</SelectItem>
                      <SelectItem value="NRND">Nicht für Neuentwicklungen</SelectItem>
                      <SelectItem value="EOL">Auslaufend</SelectItem>
                      <SelectItem value="OBSOLETE">Obsolet</SelectItem>
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
