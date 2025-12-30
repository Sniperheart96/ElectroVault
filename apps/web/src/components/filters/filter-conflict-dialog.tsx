'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FilterConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingFilterNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Dialog der angezeigt wird, wenn bei einem Kategoriewechsel
 * aktive Filter nicht mehr verfügbar sind
 */
export function FilterConflictDialog({
  open,
  onOpenChange,
  conflictingFilterNames,
  onConfirm,
  onCancel,
}: FilterConflictDialogProps) {
  const t = useTranslations('filters');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t('conflictTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>{t('conflictDescription')}</p>
              <ul className="list-disc list-inside space-y-1 bg-muted/50 rounded-md p-3">
                {conflictingFilterNames.map((name, index) => (
                  <li key={index} className="text-sm font-medium text-foreground">
                    {name}
                  </li>
                ))}
              </ul>
              <p className="text-sm">{t('conflictQuestion')}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {t('conflictCancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {t('conflictConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
