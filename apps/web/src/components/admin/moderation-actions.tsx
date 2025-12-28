'use client';

import { useState } from 'react';
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
              {selectedCount} freigeben
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Batch-Freigabe</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie {selectedCount} Elemente freigeben? Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={onBatchApprove}>
                Freigeben
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Single Item Actions
  if (!item) return null;

  return (
    <div className="flex gap-2 justify-end">
      {/* Approve Button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="default" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Freigeben
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Freigeben bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie dieses {item.type === 'COMPONENT' ? 'Bauteil' : 'Part'} wirklich freigeben?
              Es wird anschließend öffentlich sichtbar sein.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={onApprove}>
              Freigeben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Button with Comment Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <XCircle className="h-4 w-4 mr-2" />
            Ablehnen
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ablehnen mit Begründung</DialogTitle>
            <DialogDescription>
              Bitte geben Sie eine Begründung für die Ablehnung an. Diese wird dem Ersteller angezeigt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">
                Begründung <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Warum wird dieses Element abgelehnt?"
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Eine aussagekräftige Begründung hilft dem Ersteller, die Ablehnung zu verstehen.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectComment.trim()}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Ablehnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
