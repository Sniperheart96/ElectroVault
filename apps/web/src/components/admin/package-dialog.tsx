'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePackageSchema, type CreatePackageInput } from '@electrovault/schemas';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type Package } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

interface PackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  package?: Package | null;
  onSaved: () => void;
}

export function PackageDialog({
  open,
  onOpenChange,
  package: packageData,
  onSaved,
}: PackageDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const isEdit = !!packageData;

  const form = useForm<CreatePackageInput>({
    resolver: zodResolver(CreatePackageSchema) as never,
    defaultValues: {
      name: '',
      mountingType: 'SMD',
    },
  });

  useEffect(() => {
    if (packageData) {
      form.reset({
        name: packageData.name,
        mountingType: packageData.mountingType,
        pinCount: packageData.pinCount || undefined,
        lengthMm: packageData.lengthMm ? parseFloat(packageData.lengthMm) : undefined,
        widthMm: packageData.widthMm ? parseFloat(packageData.widthMm) : undefined,
        heightMm: packageData.heightMm ? parseFloat(packageData.heightMm) : undefined,
        pitchMm: packageData.pitchMm ? parseFloat(packageData.pitchMm) : undefined,
        jedecStandard: packageData.jedecStandard || undefined,
        eiaStandard: packageData.eiaStandard || undefined,
        description: packageData.description || undefined,
        drawingUrl: packageData.drawingUrl || undefined,
      });
    } else {
      form.reset({
        name: '',
        mountingType: 'SMD',
      });
    }
  }, [packageData, form]);

  const onSubmit = async (data: CreatePackageInput) => {
    try {
      if (isEdit) {
        await api.updatePackage(packageData.id, data);
        toast({
          title: 'Erfolg',
          description: 'Bauform wurde aktualisiert.',
        });
      } else {
        await api.createPackage(data);
        toast({
          title: 'Erfolg',
          description: 'Bauform wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Bauform konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Bauform bearbeiten' : 'Neue Bauform'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Bauforminformationen ändern' : 'Neue Bauform erstellen'}
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
                    <Input placeholder="SOIC-8" {...field} />
                  </FormControl>
                  <FormDescription>Eindeutiger Name der Bauform</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mountingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gehäusetyp</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SMD">SMD - Surface Mount Device</SelectItem>
                        <SelectItem value="THT">THT - Through-Hole Technology</SelectItem>
                        <SelectItem value="RADIAL">Radial - Radial Bedrahtet</SelectItem>
                        <SelectItem value="AXIAL">Axial - Axial Bedrahtet</SelectItem>
                        <SelectItem value="CHASSIS">Chassis - Gehäusemontage</SelectItem>
                        <SelectItem value="OTHER">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pinCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pin-Anzahl</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="8"
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

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="lengthMm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Länge (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="5.0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="widthMm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breite (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="4.0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heightMm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Höhe (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.5"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pitchMm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rastermaß (mm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.27"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>Abstand zwischen den Pins</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jedecStandard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>JEDEC Standard</FormLabel>
                    <FormControl>
                      <Input placeholder="MS-012" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eiaStandard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>EIA Standard</FormLabel>
                    <FormControl>
                      <Input placeholder="0805" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="drawingUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zeichnungs-URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/drawing.pdf"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Link zu technischer Zeichnung oder Datenblatt</FormDescription>
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
                    <Textarea
                      placeholder="Zusätzliche Informationen zur Bauform..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
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
