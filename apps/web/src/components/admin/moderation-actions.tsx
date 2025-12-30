'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ModerationQueueItem } from '@/lib/api';

interface ModerationActionsProps {
  item?: ModerationQueueItem;
  onApprove?: () => void;
  onReject?: (comment?: string) => void;
  onBatchApprove?: () => void;
  selectedCount?: number;
}

export function ModerationActions({
  item,
  onApprove,
  onReject,
  onBatchApprove,
  selectedCount,
}: ModerationActionsProps) {
  const t = useTranslations('admin.moderation');
  const tCommon = useTranslations('common');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const handleReject = () => {
    if (onReject) {
      onReject(rejectComment || undefined);
      setRejectComment('');
      setRejectDialogOpen(false);
    }
  };

  // Batch Actions (ohne item)
  if (!item && onBatchApprove) {
    return (
      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="default" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('batchApproveButton', { count: selectedCount })}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('batchApproval')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('confirmBatchApproval', { count: selectedCount })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onBatchApprove}>
                {t('approve')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Single Item Actions
  if (!item) return null;

  const itemType = item.type === 'COMPONENT' ? t('typeComponent') : t('typePart');

  return (
    <div className="flex gap-2 justify-end">
      {/* Approve Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="default" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('approve')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmApprove')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmApproveDescription', { type: itemType })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onApprove}>
              {t('approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Button with Comment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <XCircle className="h-4 w-4 mr-2" />
            {t('reject')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectWithReason')}</DialogTitle>
            <DialogDescription>
              {t('rejectDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                {t('rejectReasonLabel')} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder={t('rejectReasonPlaceholder')}
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                {t('rejectReasonHelp')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectComment.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t('reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
