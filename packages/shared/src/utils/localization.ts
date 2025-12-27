/**
 * LocalizedString Type
 * Repräsentiert mehrsprachige Texte
 */
export type LocalizedString = {
  en?: string;
  de?: string;
  fr?: string;
  es?: string;
  zh?: string;
};

/**
 * Extrahiert den Text in der gewünschten Sprache mit Fallback-Kette
 * Fallback: Angefragte Sprache → Englisch → Erste verfügbare
 *
 * @param data - Das LocalizedString-Objekt
 * @param locale - Die gewünschte Sprache (z.B. 'de', 'en')
 * @returns Der Text in der besten verfügbaren Sprache
 */
export function getLocalizedText(
  data: LocalizedString,
  locale: string = 'de'
): string {
  // 1. Versuch: Angefragte Sprache
  if (data[locale as keyof LocalizedString]) {
    return data[locale as keyof LocalizedString]!;
  }

  // 2. Versuch: Englisch als Fallback
  if (data.en) {
    return data.en;
  }

  // 3. Versuch: Erste verfügbare Sprache
  const firstAvailable = Object.values(data).find((val) => val);
  if (firstAvailable) {
    return firstAvailable;
  }

  // Fehlerfall: Keine Übersetzung vorhanden
  console.error('No localized value found for any language', { data, locale });
  return '[MISSING TRANSLATION]';
}

/**
 * Prüft, ob ein LocalizedString mindestens eine Übersetzung enthält
 */
export function hasTranslation(data: LocalizedString): boolean {
  return Object.values(data).some((val) => val && val.trim().length > 0);
}

/**
 * Erstellt einen Slug aus einem lokalisierten Text
 * Verwendet die beste verfügbare Übersetzung
 */
export function slugifyLocalized(
  data: LocalizedString,
  locale: string = 'de'
): string {
  const text = getLocalizedText(data, locale);

  if (text === '[MISSING TRANSLATION]') {
    return 'untitled';
  }

  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
