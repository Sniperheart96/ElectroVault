'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  type UILocale,
  LOCALE_METADATA,
  isRTL,
} from '@electrovault/schemas';
import type { LocalizedString } from '@/lib/api';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface LocalizedTextProps {
  /** Der LocalizedString-Wert */
  value: LocalizedString | null | undefined;
  /** Button zum Anzeigen des Originaltexts */
  showOriginalButton?: boolean;
  /** Als welches Element rendern */
  as?: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4';
  /** Zusätzliche CSS-Klassen */
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * LocalizedText - Zeigt einen lokalisierten Text an
 *
 * Zeigt den Text in der aktuellen User-Locale an.
 * Optional mit Button zum Anzeigen des Originaltexts.
 *
 * @example
 * ```tsx
 * <LocalizedText value={component.name} />
 *
 * <LocalizedText
 *   value={component.description}
 *   showOriginalButton
 *   as="p"
 * />
 * ```
 */
export function LocalizedText({
  value,
  showOriginalButton = false,
  as: Component = 'span',
  className,
}: LocalizedTextProps) {
  const userLocale = useLocale() as UILocale;
  const [showingOriginal, setShowingOriginal] = useState(false);

  // Leerer Wert
  if (!value) {
    return null;
  }

  // Originalsprache und -text
  const originalLocale = value._original as UILocale | undefined;
  const originalText = originalLocale
    ? value[originalLocale as keyof Omit<LocalizedString, '_original'>]
    : undefined;
  const originalMeta = originalLocale ? LOCALE_METADATA[originalLocale] : null;

  // Text in User-Locale
  const localizedText = value[userLocale as keyof Omit<LocalizedString, '_original'>] || '';

  // RTL-Check für User-Locale
  const isRtl = isRTL(userLocale);

  // Welcher Text angezeigt werden soll
  const displayText = showingOriginal && originalText ? originalText : localizedText;
  const displayLocale = showingOriginal && originalLocale ? originalLocale : userLocale;
  const displayRtl = isRTL(displayLocale);

  // Original-Button nur zeigen wenn:
  // - showOriginalButton = true
  // - Es eine Originalsprache gibt
  // - Die Originalsprache != User-Locale
  const shouldShowOriginalButton =
    showOriginalButton &&
    originalLocale &&
    originalLocale !== userLocale &&
    originalText;

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Component
        dir={displayRtl ? 'rtl' : 'ltr'}
        className={cn(displayRtl && 'text-right')}
      >
        {displayText}
      </Component>

      {shouldShowOriginalButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowingOriginal(!showingOriginal)}
              >
                <FileText className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showingOriginal ? (
                <span>
                  Original ({originalMeta?.nativeLabel}) - Klicken für Übersetzung
                </span>
              ) : (
                <span>
                  Original anzeigen ({originalMeta?.nativeLabel})
                </span>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </span>
  );
}

// ============================================
// UTILITY HOOK
// ============================================

/**
 * Hook um den lokalisierten Text aus einem LocalizedString zu extrahieren.
 * Mit Fallback-Kette: User-Locale → Original-Locale → en → de → erste verfügbare
 *
 * @example
 * ```tsx
 * const name = useLocalizedValue(component.name);
 * ```
 */
export function useLocalizedValue(value: LocalizedString | null | undefined): string {
  const userLocale = useLocale() as UILocale;

  if (!value) {
    return '';
  }

  // 1. User-Locale
  const userText = value[userLocale as keyof Omit<LocalizedString, '_original'>];
  if (userText) return userText;

  // 2. Original-Locale (falls vorhanden)
  const originalLocale = value._original as UILocale | undefined;
  if (originalLocale) {
    const originalText = value[originalLocale as keyof Omit<LocalizedString, '_original'>];
    if (originalText) return originalText;
  }

  // 3. Fallback: en → de → erste verfügbare
  if (value.en) return value.en;
  if (value.de) return value.de;

  // 4. Erste verfügbare Sprache
  const { _original, ...translations } = value;
  const firstValue = Object.values(translations).find((v) => v && v.length > 0);
  return firstValue || '';
}

/**
 * Extrahiert lokalisierten Text ohne Hook (für Utility-Funktionen).
 * Mit Fallback-Kette: locale → Original → en → de → erste verfügbare
 *
 * @example
 * ```tsx
 * const name = getLocalizedValue(component.name, 'de');
 * ```
 */
export function getLocalizedValue(
  value: LocalizedString | null | undefined,
  locale: UILocale
): string {
  if (!value) {
    return '';
  }

  // 1. Angeforderte Locale
  const localeText = value[locale as keyof Omit<LocalizedString, '_original'>];
  if (localeText) return localeText;

  // 2. Original-Locale (falls vorhanden)
  const originalLocale = value._original as UILocale | undefined;
  if (originalLocale) {
    const originalText = value[originalLocale as keyof Omit<LocalizedString, '_original'>];
    if (originalText) return originalText;
  }

  // 3. Fallback: en → de → erste verfügbare
  if (value.en) return value.en;
  if (value.de) return value.de;

  // 4. Erste verfügbare Sprache
  const { _original, ...translations } = value;
  const firstValue = Object.values(translations).find((v) => v && v.length > 0);
  return firstValue || '';
}

/**
 * Hook um den Originaltext und die Originalsprache zu ermitteln.
 *
 * @example
 * ```tsx
 * const { originalText, originalLocale, isOriginal } = useOriginalValue(component.name);
 * ```
 */
export function useOriginalValue(value: LocalizedString | null | undefined) {
  const userLocale = useLocale() as UILocale;

  if (!value) {
    return { originalText: '', originalLocale: null, isOriginal: false };
  }

  const originalLocale = value._original as UILocale | undefined;
  const originalText = originalLocale
    ? value[originalLocale as keyof Omit<LocalizedString, '_original'>] || ''
    : '';
  const isOriginal = originalLocale === userLocale;

  return {
    originalText,
    originalLocale,
    isOriginal,
    originalMeta: originalLocale ? LOCALE_METADATA[originalLocale] : null,
  };
}
