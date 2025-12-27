/**
 * Unterstützte Sprachen in ElectroVault
 */
export type Locale = 'en' | 'de' | 'fr' | 'es' | 'zh';

/**
 * Standard-Fallback-Sprache
 */
export const FALLBACK_LOCALE: Locale = 'en';

/**
 * Alle unterstützten Sprachen
 */
export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'de', 'fr', 'es', 'zh'] as const;

/**
 * Lokalisierte Strings - JSON-Struktur für mehrsprachige Texte
 *
 * @example
 * ```typescript
 * const name: LocalizedString = {
 *   de: "Kondensator",
 *   en: "Capacitor"
 * };
 * ```
 */
export interface LocalizedString {
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  zh?: string;
  [key: string]: string | undefined;
}
