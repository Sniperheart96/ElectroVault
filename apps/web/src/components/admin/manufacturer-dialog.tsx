'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateManufacturerSchema, type CreateManufacturerInput } from '@electrovault/schemas';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
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
import { type Manufacturer } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

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
  const api = useApi();
  const { toast } = useToast();
  const isEdit = !!manufacturer;

  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragging, setLogoDragging] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateManufacturerInput>({
    resolver: zodResolver(CreateManufacturerSchema) as never,
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
        logoUrl: manufacturer.logoUrl || undefined,
        status: manufacturer.status,
        foundedYear: manufacturer.foundedYear || undefined,
        defunctYear: manufacturer.defunctYear || undefined,
        description: manufacturer.description || { de: '', en: '' },
      });
      setLogoUrl(manufacturer.logoUrl || null);
    } else {
      setLogoUrl(null);
    }
  }, [manufacturer, form]);

  // Logo upload handler
  const handleLogoUpload = async (file: File) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: 'Fehler',
        description: 'Logo darf maximal 5 MB groß sein.',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Fehler',
        description: 'Nur JPEG, PNG, WebP oder SVG erlaubt.',
        variant: 'destructive',
      });
      return;
    }

    setLogoUploading(true);
    try {
      // For now, we'll create a data URL for preview
      // The actual upload will happen when the form is submitted
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLogoUrl(dataUrl);
        // Note: In production, you would upload to MinIO and get a URL
        // For now, we'll store the data URL (works for small images)
        form.setValue('logoUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Logo konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLogoUploading(false);
    }
  };

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

            {/* Logo Upload */}
            <div className="space-y-2">
              <FormLabel>Logo</FormLabel>
              <div className="flex items-start gap-4">
                {/* Logo Preview */}
                <div
                  className={cn(
                    'relative flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                    logoDragging && 'border-primary bg-primary/5',
                    !logoDragging && 'hover:border-primary/50 hover:bg-muted/30',
                    logoUploading && 'opacity-50 cursor-not-allowed',
                  )}
                  onClick={() => !logoUploading && logoInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setLogoDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setLogoDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setLogoDragging(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleLogoUpload(files[0]);
                    }
                  }}
                >
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        handleLogoUpload(files[0]);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  {logoUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : logoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogoUrl(null);
                          form.setValue('logoUrl', undefined);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto" />
                      <span className="text-xs text-muted-foreground">Logo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Hersteller-Logo hochladen. Max. 5 MB, JPEG/PNG/WebP/SVG.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Klicken oder Datei hierher ziehen.
                  </p>
                </div>
              </div>
            </div>

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
