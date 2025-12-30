/**
 * UI-Lokalisierung - Schemas und Typen
 *
 * Definiert die unterstützten UI-Sprachen und User-Preferences.
 * Erweiterbar für neue Sprachen durch Hinzufügen zu SUPPORTED_UI_LOCALES.
 */

import { z } from 'zod';

// ============================================
// UI-SPRACHEN KONFIGURATION
// ============================================

/**
 * Unterstützte UI-Sprachen
 * Neue Sprachen hier hinzufügen (erfordert entsprechende messages/{locale}.json)
 *
 * Aktuell unterstützt (26 Sprachen):
 * - Westeuropäisch: en, de, fr, es, it, nl, pt
 * - Nordisch: da, fi, no, sv
 * - Osteuropäisch: pl, ru, tr, cs, uk, el
 * - Asiatisch: zh, ja, ko, hi, id, vi, th
 * - Semitisch (RTL): ar, he
 */
export const SUPPORTED_UI_LOCALES = [
  'en', // English
  'de', // Deutsch
  'fr', // Français
  'es', // Español
  'it', // Italiano
  'nl', // Nederlands
  'pt', // Português
  'da', // Dansk
  'fi', // Suomi
  'no', // Norsk
  'sv', // Svenska
  'pl', // Polski
  'ru', // Русский
  'tr', // Türkçe
  'cs', // Čeština
  'uk', // Українська
  'el', // Ελληνικά
  'zh', // 中文
  'ja', // 日本語
  'ko', // 한국어
  'hi', // हिन्दी
  'id', // Bahasa Indonesia
  'vi', // Tiếng Việt
  'th', // ไทย
  'ar', // العربية
  'he', // עברית
] as const;

/**
 * UI-Sprache Typ (z.B. 'en' | 'de')
 */
export type UILocale = (typeof SUPPORTED_UI_LOCALES)[number];

/**
 * Standard-Sprache für die UI (Fallback)
 */
export const DEFAULT_UI_LOCALE: UILocale = 'en';

/**
 * Zod-Schema für UI-Sprache Validierung
 */
export const UILocaleSchema = z.enum(SUPPORTED_UI_LOCALES);

// ============================================
// USER PREFERENCES
// ============================================

/**
 * Schema für User-Preferences (gespeichert in User.preferences JSON)
 */
export const UserPreferencesSchema = z.object({
  /** Bevorzugte UI-Sprache */
  locale: UILocaleSchema.optional(),
  // Erweiterbar für weitere Präferenzen:
  // theme: z.enum(['light', 'dark', 'system']).optional(),
  // notifications: z.boolean().optional(),
});

/**
 * TypeScript-Typ für User-Preferences
 */
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ============================================
// LOCALE COOKIE KONSTANTEN
// ============================================

/**
 * Name des Locale-Cookies
 */
export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Cookie-Lebensdauer in Sekunden (1 Jahr)
 */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// ============================================
// RTL-SPRACHEN
// ============================================

/**
 * Right-to-Left Sprachen
 */
export const RTL_LOCALES: readonly UILocale[] = ['ar', 'he'] as const;

/**
 * Prüft ob eine Sprache RTL ist
 */
export const isRTL = (locale: UILocale): boolean =>
  (RTL_LOCALES as readonly string[]).includes(locale);

// ============================================
// LOCALE METADATEN
// ============================================

/**
 * Metadaten für jede unterstützte Sprache
 * Wird für Dropdown-Anzeigen und Sprachauswahl verwendet
 */
export const LOCALE_METADATA: Record<UILocale, {
  label: string;
  nativeLabel: string;
  flag: string;
}> = {
  // Westeuropäisch
  en: { label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  de: { label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  fr: { label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  es: { label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  it: { label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  nl: { label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  pt: { label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
  // Nordisch
  da: { label: 'Danish', nativeLabel: 'Dansk', flag: '🇩🇰' },
  fi: { label: 'Finnish', nativeLabel: 'Suomi', flag: '🇫🇮' },
  no: { label: 'Norwegian', nativeLabel: 'Norsk', flag: '🇳🇴' },
  sv: { label: 'Swedish', nativeLabel: 'Svenska', flag: '🇸🇪' },
  // Osteuropäisch
  pl: { label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
  ru: { label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  tr: { label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  cs: { label: 'Czech', nativeLabel: 'Čeština', flag: '🇨🇿' },
  uk: { label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦' },
  el: { label: 'Greek', nativeLabel: 'Ελληνικά', flag: '🇬🇷' },
  // Asiatisch
  zh: { label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
  ja: { label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  ko: { label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
  hi: { label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  id: { label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩' },
  vi: { label: 'Vietnamese', nativeLabel: 'Tiếng Việt', flag: '🇻🇳' },
  th: { label: 'Thai', nativeLabel: 'ไทย', flag: '🇹🇭' },
  // Semitisch (RTL)
  ar: { label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  he: { label: 'Hebrew', nativeLabel: 'עברית', flag: '🇮🇱' },
};

/**
 * Holt Metadaten für eine Sprache
 */
export const getLocaleMetadata = (locale: UILocale) => LOCALE_METADATA[locale];
