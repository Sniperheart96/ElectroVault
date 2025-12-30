'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
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
import { DialogEditLocaleSelector } from '@/components/forms/dialog-edit-locale-selector';
import { EditLocaleProvider } from '@/contexts/edit-locale-context';
import { type Manufacturer } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

// API Base URL für Proxy-Endpunkte
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tForm = useTranslations('admin.form');
  const isEdit = !!manufacturer;

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
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
      // Verwende Proxy-URL für die Vorschau, um CORS-Probleme zu vermeiden
      setLogoPreviewUrl(manufacturer.logoUrl ? `${API_BASE_URL}/manufacturers/${manufacturer.id}/logo` : null);
      setLogoFile(null);
    } else {
      setLogoPreviewUrl(null);
      setLogoFile(null);
    }
  }, [manufacturer, form]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  // Logo upload handler
  const handleLogoUpload = async (file: File) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: t('messages.error'),
        description: tForm('logoMaxSize'),
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('messages.error'),
        description: tForm('logoAllowedTypes'),
        variant: 'destructive',
      });
      return;
    }

    // Bei bestehendem Hersteller: Sofort hochladen
    if (isEdit && manufacturer) {
      setLogoUploading(true);
      try {
        const result = await api.uploadManufacturerLogo(file, manufacturer.id);
        const uploadedUrl = result.data.logoUrl;

        // Verwende Proxy-URL für die Vorschau, um CORS-Probleme zu vermeiden
        // Füge timestamp hinzu um Browser-Cache zu umgehen nach Upload
        setLogoPreviewUrl(`${API_BASE_URL}/manufacturers/${manufacturer.id}/logo?t=${Date.now()}`);
        form.setValue('logoUrl', uploadedUrl);

        toast({
          title: t('messages.success'),
          description: t('messages.manufacturer.logoUploaded'),
        });
      } catch (error) {
        toast({
          title: t('messages.error'),
          description: t('messages.manufacturer.logoUploadFailed'),
          variant: 'destructive',
        });
      } finally {
        setLogoUploading(false);
      }
    } else {
      // Bei neuem Hersteller: Nur File speichern und lokale Vorschau erstellen
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreviewUrl(previewUrl);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    const isValid = await form.trigger();
    if (!isValid) return;

    const data = form.getValues();
    setIsSaving(true);

    try {
      if (isEdit) {
        await api.updateManufacturer(manufacturer.id, data);
        toast({
          title: t('messages.success'),
          description: t('messages.manufacturer.updated'),
        });
      } else {
        // Neuer Hersteller: Erst erstellen, dann Logo hochladen falls vorhanden
        const result = await api.createManufacturer({ ...data, saveAsDraft });
        const newManufacturerId = result.data.id;

        // Logo hochladen falls ausgewählt
        if (logoFile && newManufacturerId) {
          try {
            const uploadResult = await api.uploadManufacturerLogo(logoFile, newManufacturerId);
            const uploadedUrl = uploadResult.data.logoUrl;

            // Hersteller mit logoUrl aktualisieren
            await api.updateManufacturer(newManufacturerId, {
              ...data,
              logoUrl: uploadedUrl,
            });
          } catch (uploadError) {
            toast({
              title: t('messages.warning'),
              description: tForm('manufacturerCreatedLogoFailed'),
              variant: 'destructive',
            });
          }
        }

        toast({
          title: t('messages.success'),
          description: saveAsDraft ? tForm('createdAsDraft') : t('messages.manufacturer.created'),
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.manufacturer.saveFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
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
                  {isEdit ? t('dialogs.manufacturer.titleEdit') : t('dialogs.manufacturer.title')}
                </DialogTitle>
                <DialogDescription>
                  {t('dialogs.manufacturer.description')}
                </DialogDescription>
              </div>
              <DialogEditLocaleSelector />
            </div>
          </DialogHeader>

          <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('name')}</FormLabel>
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
                    <FormLabel>{tForm('cageCode')}</FormLabel>
                    <FormControl>
                      <Input placeholder={tForm('cageCodePlaceholder')} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>{tForm('cageCodeHint')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForm('country')}</FormLabel>
                    <FormControl>
                      <Input placeholder={tForm('countryPlaceholder')} {...field} value={field.value || ''} maxLength={2} />
                    </FormControl>
                    <FormDescription>{tForm('countryHint')}</FormDescription>
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
                  <FormLabel>{tForm('website')}</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder={tForm('websitePlaceholder')} {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <div className="space-y-2">
              <FormLabel>{tForm('logo')}</FormLabel>
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
                  ) : logoPreviewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoPreviewUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLogoPreviewUrl(null);
                          setLogoFile(null);
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
                      <span className="text-xs text-muted-foreground">{tForm('logo')}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {tForm('logoUploadHint')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tForm('logoClickOrDrag')}
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForm('status')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">{tForm('statusActive')}</SelectItem>
                      <SelectItem value="ACQUIRED">{tForm('statusAcquired')}</SelectItem>
                      <SelectItem value="DEFUNCT">{tForm('statusDefunct')}</SelectItem>
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
                    <FormLabel>{tForm('foundedYear')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={tForm('foundedYearPlaceholder')}
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
                    <FormLabel>{tForm('defunctYear')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={tForm('defunctYearPlaceholder')}
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
                  <FormLabel>{tForm('description')}</FormLabel>
                  <FormControl>
                    <LocalizedInput
                      value={field.value || { de: '', en: '' }}
                      onChange={field.onChange}
                      multiline
                      placeholder={tForm('descriptionPlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                {tCommon('cancel')}
              </Button>
              {!isEdit && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleSubmit(true)}
                  disabled={isSaving}
                >
                  {isSaving ? t('buttons.saving') : t('buttons.saveAsDraft')}
                </Button>
              )}
              <Button type="button" onClick={() => handleSubmit(false)} disabled={isSaving}>
                {isSaving ? t('buttons.saving') : isEdit ? t('buttons.update') : tForm('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </EditLocaleProvider>
      </DialogContent>
    </Dialog>
  );
}
