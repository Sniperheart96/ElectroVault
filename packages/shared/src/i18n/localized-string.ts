import type { LocalizedString, Locale } from './types';
import { FALLBACK_LOCALE } from './types';

/**
 * Löst einen lokalisierten String mit Fallback-Kette auf:
 * 1. Angefragte Sprache
 * 2. Englisch (bevorzugter Fallback)
 * 3. Erste verfügbare Sprache
 *
 * @param data Lokalisierter String (JSON-Objekt)
 * @param locale Gewünschte Sprache
 * @returns Aufgelöster String oder Fehlerindikator
 *
 * @example
 * ```typescript
 * const name = { de: "Kondensator", en: "Capacitor" };
 * t(name, 'de'); // "Kondensator"
 * t(name, 'fr'); // "Capacitor" (Fallback zu en)
 * t({}, 'de'); // "[MISSING TRANSLATION]"
 * ```
 */
export function t(data: LocalizedString | null | undefined, locale: Locale): string {
  if (!data || typeof data !== 'object') {
    console.error('[i18n] Invalid LocalizedString data', { data, locale });
    return '[MISSING TRANSLATION]';
  }

  // 1. Versuch: Angefragte Sprache
  if (data[locale]) {
    return data[locale]!;
  }

  // 2. Versuch: Englisch als Fallback
  if (locale !== FALLBACK_LOCALE && data[FALLBACK_LOCALE]) {
    return data[FALLBACK_LOCALE]!;
  }

  // 3. Versuch: Erste verfügbare Sprache
  const firstAvailable = Object.values(data).find((value) => typeof value === 'string' && value.length > 0);
  if (firstAvailable) {
    return firstAvailable;
  }

  // Kein Wert gefunden - sichtbarer Fehler!
  console.error('[i18n] No localized value found for any language', { data, locale });
  return '[MISSING TRANSLATION]';
}

/**
 * Prüft ob ein LocalizedString mindestens einen Wert hat
 */
export function hasTranslation(data: LocalizedString | null | undefined): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  return Object.values(data).some((value) => typeof value === 'string' && value.length > 0);
}

/**
 * Erstellt einen LocalizedString aus einem einzigen String
 */
export function createLocalizedString(text: string, locale: Locale): LocalizedString {
  return { [locale]: text };
}
