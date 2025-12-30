'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations, useLocale } from 'next-intl';
import { CreatePackageSchema, type CreatePackageInput, type UILocale } from '@electrovault/schemas';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { type Package, type PackageGroup } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { Package3DModels } from '@/components/admin/package-3d-models';
import { getLocalizedValue } from '@/components/ui/localized-text';

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
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const api = useApi();
  const { toast } = useToast();
  const locale = useLocale() as UILocale;
  const isEdit = !!packageData;
  const [activeTab, setActiveTab] = useState('details');
  const [groups, setGroups] = useState<PackageGroup[]>([]);

  // Load package groups
  useEffect(() => {
    api.getAllPackageGroups().then((result) => setGroups(result.data)).catch(() => {});
  }, [api]);

  const form = useForm<CreatePackageInput>({
    resolver: zodResolver(CreatePackageSchema) as never,
    defaultValues: {
      name: '',
      mountingType: 'SMD',
      groupId: null,
    },
  });

  useEffect(() => {
    if (packageData) {
      form.reset({
        name: packageData.name,
        mountingType: packageData.mountingType,
        groupId: packageData.groupId || null,
        pinCount: packageData.pinCount || undefined,
        lengthMm: packageData.lengthMm ? parseFloat(packageData.lengthMm) : undefined,
        widthMm: packageData.widthMm ? parseFloat(packageData.widthMm) : undefined,
        heightMm: packageData.heightMm ? parseFloat(packageData.heightMm) : undefined,
        pitchMm: packageData.pitchMm ? parseFloat(packageData.pitchMm) : undefined,
        jedecStandard: packageData.jedecStandard || undefined,
        eiaStandard: packageData.eiaStandard || undefined,
        description: packageData.description || undefined,
      });
    } else {
      form.reset({
        name: '',
        mountingType: 'SMD',
        groupId: null,
      });
    }
  }, [packageData, form]);

  const onSubmit = async (data: CreatePackageInput) => {
    try {
      if (isEdit) {
        await api.updatePackage(packageData.id, data);
        toast({
          title: t('messages.success'),
          description: t('messages.package.updated'),
        });
      } else {
        await api.createPackage(data);
        toast({
          title: t('messages.success'),
          description: t('messages.package.created'),
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.package.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (open) {
      setActiveTab('details');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('dialogs.package.titleEdit') : t('dialogs.package.title')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.package.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            <TabsTrigger value="models" disabled={!isEdit}>
              {t('tabs.models')}
            </TabsTrigger>
          </TabsList>

          {/* Stammdaten Tab */}
          <TabsContent value="details" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('packageForm.namePlaceholder')} {...field} />
                  </FormControl>
                  <FormDescription>{t('packageForm.nameDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('packageForm.group')}</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === '__none__' ? null : val)}
                    value={field.value || '__none__'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('packageForm.selectGroup')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">{t('packageForm.noGroup')}</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {getLocalizedValue(group.name, locale)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <FormLabel>{t('packageForm.mountingType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SMD">{t('packageForm.mountingTypes.SMD')}</SelectItem>
                        <SelectItem value="THT">{t('packageForm.mountingTypes.THT')}</SelectItem>
                        <SelectItem value="RADIAL">{t('packageForm.mountingTypes.RADIAL')}</SelectItem>
                        <SelectItem value="AXIAL">{t('packageForm.mountingTypes.AXIAL')}</SelectItem>
                        <SelectItem value="CHASSIS">{t('packageForm.mountingTypes.CHASSIS')}</SelectItem>
                        <SelectItem value="OTHER">{t('packageForm.mountingTypes.OTHER')}</SelectItem>
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
                    <FormLabel>{t('packageForm.pinCount')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t('packageForm.pinCountPlaceholder')}
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
                    <FormLabel>{t('packageForm.lengthMm')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('packageForm.lengthPlaceholder')}
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
                    <FormLabel>{t('packageForm.widthMm')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('packageForm.widthPlaceholder')}
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
                    <FormLabel>{t('packageForm.heightMm')}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t('packageForm.heightPlaceholder')}
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
                  <FormLabel>{t('packageForm.pitchMm')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t('packageForm.pitchPlaceholder')}
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>{t('packageForm.pitchDescription')}</FormDescription>
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
                    <FormLabel>{t('packageForm.jedecStandard')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('packageForm.jedecPlaceholder')} {...field} value={field.value || ''} />
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
                    <FormLabel>{t('packageForm.eiaStandard')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('packageForm.eiaPlaceholder')} {...field} value={field.value || ''} />
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
                  <FormLabel>{t('packageForm.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('packageForm.descriptionPlaceholder')}
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
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('buttons.saving') : isEdit ? t('buttons.update') : tCommon('create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* 3D-Modelle Tab */}
          <TabsContent value="models" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('packageForm.saveFirstModels')}</p>
              </div>
            ) : packageData ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('packageForm.modelsDescription')}
                </p>
                <Package3DModels packageId={packageData.id} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {t('form.close')}
                  </Button>
                </DialogFooter>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
