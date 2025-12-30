'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useEditLocaleOptional } from '@/contexts/edit-locale-context';
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

interface LocalizedInputProps {
  /** Der aktuelle LocalizedString-Wert */
  value: LocalizedString;
  /** Callback wenn sich der Wert ändert */
  onChange: (value: LocalizedString) => void;
  /** Mehrzeilige Eingabe (Textarea statt Input) */
  multiline?: boolean;
  /** Placeholder-Text */
  placeholder?: string;
  /** Zusätzliche CSS-Klassen */
  className?: string;
  /** Deaktiviert das Eingabefeld */
  disabled?: boolean;
}

// ============================================
// COMPONENT
// ============================================

/**
 * LocalizedInput - Eingabefeld für mehrsprachige Texte
 *
 * Nutzt den EditLocaleContext um die aktuelle Bearbeitungssprache zu ermitteln.
 * Zeigt einen "Original"-Badge wenn die aktuelle Sprache die Originalsprache ist.
 *
 * Features:
 * - Verwendet die globale Bearbeitungssprache aus EditLocaleContext
 * - Setzt `_original` automatisch bei erster Eingabe
 * - Zeigt "Original"-Badge bei der Originalsprache
 * - RTL-Support für Arabisch und Hebräisch
 *
 * @example
 * ```tsx
 * <EditLocaleProvider>
 *   <DialogEditLocaleSelector />
 *   <LocalizedInput
 *     value={name}
 *     onChange={setName}
 *     placeholder="Bauteilname"
 *   />
 * </EditLocaleProvider>
 * ```
 */
export function LocalizedInput({
  value,
  onChange,
  multiline = false,
  placeholder,
  className,
  disabled = false,
}: LocalizedInputProps) {
  // Bearbeitungssprache aus Context (oder User-Locale als Fallback)
  const editLocale = useEditLocaleOptional();
  const localeMeta = LOCALE_METADATA[editLocale];
  const isRtl = isRTL(editLocale);

  // Prüfen ob aktuelle Sprache die Originalsprache ist
  const isOriginal = value?._original === editLocale;

  // Aktueller Text in der Bearbeitungssprache
  const currentText = value?.[editLocale as keyof Omit<LocalizedString, '_original'>] || '';

  /**
   * Handler für Textänderungen
   * Setzt _original automatisch bei erster Eingabe
   */
  const handleChange = (text: string) => {
    const newValue = { ...value, [editLocale]: text };

    // _original setzen wenn noch nicht vorhanden und Text eingegeben wird
    if (!value?._original && text.length > 0) {
      newValue._original = editLocale;
    }

    onChange(newValue);
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={cn('space-y-1', className)}>
      {/* Header mit Sprache und Original-Badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <span>{localeMeta.flag}</span>
          <span>{editLocale.toUpperCase()}</span>
        </span>
        {isOriginal && (
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            Original
          </Badge>
        )}
      </div>

      {/* Eingabefeld */}
      <InputComponent
        value={currentText}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(isRtl && 'text-right')}
      />
    </div>
  );
}

// ============================================
// LEGACY SUPPORT
// ============================================

interface LegacyLocalizedInputProps {
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  /** @deprecated Wird ignoriert - nutze EditLocaleContext stattdessen */
  locales?: string[];
  multiline?: boolean;
  placeholder?: string;
}

/**
 * @deprecated Verwende LocalizedInput mit EditLocaleProvider stattdessen
 *
 * Diese Version behält die alte Tab-basierte Sprachauswahl für Abwärtskompatibilität.
 */
export function LegacyLocalizedInput({
  value,
  onChange,
  locales = ['de', 'en'],
  multiline = false,
  placeholder,
}: LegacyLocalizedInputProps) {
  // Diese Komponente ist deprecated - verwende LocalizedInput mit EditLocaleProvider
  console.warn(
    'LegacyLocalizedInput is deprecated. Use LocalizedInput with EditLocaleProvider instead.'
  );

  return (
    <LocalizedInput
      value={value}
      onChange={onChange}
      multiline={multiline}
      placeholder={placeholder}
    />
  );
}
