'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function ContactForm() {
  const t = useTranslations('contact.form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simuliere API-Call (Backend wird später implementiert)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Für Demo-Zwecke: Erfolgreich
    setSubmitStatus('success');
    setIsSubmitting(false);

    // Form zurücksetzen nach 3 Sekunden
    setTimeout(() => {
      setSubmitStatus('idle');
      (e.target as HTMLFormElement).reset();
    }, 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <Label htmlFor="name">{t('name')}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Max Mustermann"
          disabled={isSubmitting}
          className="mt-1.5"
        />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="max@beispiel.de"
          disabled={isSubmitting}
          className="mt-1.5"
        />
      </div>

      {/* Subject */}
      <div>
        <Label htmlFor="subject">{t('subject')}</Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          required
          placeholder="Betreff Ihrer Nachricht"
          disabled={isSubmitting}
          className="mt-1.5"
        />
      </div>

      {/* Message */}
      <div>
        <Label htmlFor="message">{t('message')}</Label>
        <Textarea
          id="message"
          name="message"
          required
          placeholder="Ihre Nachricht..."
          rows={6}
          disabled={isSubmitting}
          className="mt-1.5 resize-none"
        />
      </div>

      {/* Status Messages */}
      {submitStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{t('success')}</span>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{t('error')}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('sending')}
          </>
        ) : (
          t('send')
        )}
      </Button>

      {/* Note */}
      <p className="text-xs text-muted-foreground">
        Hinweis: Das Kontaktformular ist aktuell eine Demo. Die Backend-Integration erfolgt in einer späteren Phase.
        Nutzen Sie für wichtige Anfragen bitte GitHub oder die angegebene E-Mail-Adresse.
      </p>
    </form>
  );
}
