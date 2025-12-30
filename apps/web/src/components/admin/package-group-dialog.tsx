'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
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
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { LocalizedInput } from '@/components/forms/localized-input';
import { type PackageGroup } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

// Simple schema - at least one language required
const formSchema = z.object({
  name: z
    .object({
      en: z.string().optional(),
      de: z.string().optional(),
    })
    .refine((data) => Object.values(data).some((v) => v && v.length > 0), {
      message: 'At least one translation is required',
    }),
  description: z
    .object({
      en: z.string().optional(),
      de: z.string().optional(),
    })
    .optional()
    .nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface PackageGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: PackageGroup | null;
  onSaved: () => void;
}

export function PackageGroupDialog({
  open,
  onOpenChange,
  group,
  onSaved,
}: PackageGroupDialogProps) {
  const t = useTranslations('admin.packageGroups');
  const api = useApi();
  const { toast } = useToast();
  const isEdit = !!group;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: { en: '', de: '' },
      description: null,
    },
  });

  useEffect(() => {
    if (group) {
      form.reset({
        name: group.name || { en: '', de: '' },
        description: group.description,
      });
    } else {
      form.reset({
        name: { en: '', de: '' },
        description: null,
      });
    }
  }, [group, form, open]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit && group) {
        await api.updatePackageGroup(group.id, data);
        toast({ title: t('success'), description: t('updated') });
      } else {
        await api.createPackageGroup(data);
        toast({ title: t('success'), description: t('created') });
      }
      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('saveFailed');
      toast({
        title: t('error'),
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('titleEdit') : t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.name')}</FormLabel>
                  <FormControl>
                    <LocalizedInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t('form.namePlaceholder')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.description')}</FormLabel>
                  <FormControl>
                    <LocalizedInput
                      value={field.value || {}}
                      onChange={field.onChange}
                      placeholder={t('form.descriptionPlaceholder')}
                      multiline
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? t('saving')
                  : isEdit
                    ? t('update')
                    : t('create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
