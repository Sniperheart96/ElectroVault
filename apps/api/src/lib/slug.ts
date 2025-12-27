/**
 * Slug Utilities - URL-freundliche Identifier generieren
 */

/**
 * Generiert einen URL-freundlichen Slug aus einem Text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Deutsche Umlaute ersetzen
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // Akzente entfernen
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Nicht-alphanumerische Zeichen durch Bindestriche ersetzen
    .replace(/[^a-z0-9]+/g, '-')
    // Mehrfache Bindestriche entfernen
    .replace(/-+/g, '-')
    // Führende und folgende Bindestriche entfernen
    .replace(/^-|-$/g, '');
}

/**
 * Generiert einen einzigartigen Slug mit optionalem Suffix
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Extrahiert den primären Text aus einem LocalizedString für die Slug-Generierung
 * Priorität: en > de > erster verfügbarer
 */
export function getSlugSourceText(
  localizedString: Record<string, string | undefined>
): string {
  return (
    localizedString.en ||
    localizedString.de ||
    Object.values(localizedString).find((v) => v && v.length > 0) ||
    ''
  );
}
