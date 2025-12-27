'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateManufacturerSchema, type CreateManufacturerInput } from '@electrovault/schemas';
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
import { api, type Manufacturer } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ManufacturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manufacturer?: Manufacturer | null;
  onSaved: () => void;
}

export function ManufacturerDialog({
  open,
  onOpenChange,
  manufacturer,
  onSaved,
}: ManufacturerDialogProps) {
  const { toast } = useToast();
  const isEdit = !!manufacturer;

  const form = useForm<CreateManufacturerInput>({
    resolver: zodResolver(CreateManufacturerSchema),
    defaultValues: {
      name: '',
      status: 'ACTIVE',
      description: { de: '', en: '' },
    },
  });

  useEffect(() => {
    if (manufacturer) {
      form.reset({
        name: manufacturer.name,
        cageCode: manufacturer.cageCode || undefined,
        countryCode: manufacturer.countryCode || undefined,
        website: manufacturer.website || undefined,
        status: manufacturer.status,
        foundedYear: manufacturer.foundedYear || undefined,
        defunctYear: manufacturer.defunctYear || undefined,
        description: manufacturer.description || { de: '', en: '' },
      });
    }
  }, [manufacturer, form]);

  const onSubmit = async (data: CreateManufacturerInput) => {
    try {
      if (isEdit) {
        await api.updateManufacturer(manufacturer.id, data);
        toast({
          title: 'Erfolg',
          description: 'Hersteller wurde aktualisiert.',
        });
      } else {
        await api.createManufacturer(data);
        toast({
          title: 'Erfolg',
          description: 'Hersteller wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Hersteller konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Hersteller bearbeiten' : 'Neuer Hersteller'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Herstellerinformationen ändern' : 'Neuen Hersteller erstellen'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Texas Instruments" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cageCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CAGE Code</FormLabel>
                    <FormControl>
                      <Input placeholder="01295" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>5-stelliger Code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land</FormLabel>
                    <FormControl>
                      <Input placeholder="US" {...field} value={field.value || ''} maxLength={2} />
                    </FormControl>
                    <FormDescription>ISO 3166-1 alpha-2</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://www.ti.com" {...field} value={field.value || ''} />
                  </FormControl>
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
                      <SelectItem value="ACQUIRED">Übernommen</SelectItem>
                      <SelectItem value="DEFUNCT">Inaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="foundedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gründungsjahr</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1930"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defunctYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auflösungsjahr</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2020"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder="Beschreibung"
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
