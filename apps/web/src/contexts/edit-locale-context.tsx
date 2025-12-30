'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { type UILocale, DEFAULT_UI_LOCALE } from '@electrovault/schemas';

// ============================================
// CONTEXT DEFINITION
// ============================================

interface EditLocaleContextType {
  /** Aktuelle Bearbeitungssprache für LocalizedString-Felder */
  editLocale: UILocale;
  /** Setzt die Bearbeitungssprache */
  setEditLocale: (locale: UILocale) => void;
}

const EditLocaleContext = createContext<EditLocaleContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface EditLocaleProviderProps {
  children: ReactNode;
  /** Optional: Initiale Bearbeitungssprache (default: User-Locale) */
  initialLocale?: UILocale;
}

/**
 * Provider für die Bearbeitungssprache in Dialogen.
 *
 * Wird um Dialog-Content gewrappt, damit alle LocalizedInput-Felder
 * die gleiche Bearbeitungssprache verwenden.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogContent>
 *     <EditLocaleProvider>
 *       <DialogLocaleSelector />
 *       <LocalizedInput value={name} onChange={setName} />
 *     </EditLocaleProvider>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export function EditLocaleProvider({
  children,
  initialLocale,
}: EditLocaleProviderProps) {
  // User-Locale als Default verwenden
  const userLocale = useLocale() as UILocale;
  const defaultLocale = initialLocale ?? userLocale ?? DEFAULT_UI_LOCALE;

  const [editLocale, setEditLocale] = useState<UILocale>(defaultLocale);

  return (
    <EditLocaleContext.Provider value={{ editLocale, setEditLocale }}>
      {children}
    </EditLocaleContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

/**
 * Hook um die aktuelle Bearbeitungssprache zu lesen/setzen.
 *
 * Muss innerhalb eines `EditLocaleProvider` verwendet werden.
 *
 * @example
 * ```tsx
 * const { editLocale, setEditLocale } = useEditLocale();
 * ```
 */
export function useEditLocale(): EditLocaleContextType {
  const context = useContext(EditLocaleContext);

  if (!context) {
    throw new Error(
      'useEditLocale must be used within an EditLocaleProvider. ' +
        'Wrap your component tree with <EditLocaleProvider>.'
    );
  }

  return context;
}

/**
 * Hook um die Bearbeitungssprache zu lesen (optional, ohne Fehler wenn kein Provider).
 *
 * Gibt die User-Locale zurück wenn kein Provider vorhanden ist.
 */
export function useEditLocaleOptional(): UILocale {
  const context = useContext(EditLocaleContext);
  const userLocale = useLocale() as UILocale;

  return context?.editLocale ?? userLocale ?? DEFAULT_UI_LOCALE;
}
