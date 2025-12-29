/**
 * JSON Helpers - Prisma JSON-Feld Konvertierungen
 *
 * Prisma behandelt JSON-Felder besonders:
 * - `null` JavaScript-Wert muss zu `Prisma.JsonNull` konvertiert werden
 * - `undefined` bedeutet "nicht ändern" beim Update
 * - Leere Objekte `{}` werden als leeres JSON gespeichert
 */

import { Prisma } from '@electrovault/database';
import type { LocalizedString, LocalizedStringLoose } from '@electrovault/schemas';

/**
 * Konvertiert einen LocalizedString-Wert für Prisma JSON-Felder
 *
 * @param value - Der Eingabewert (kann null, undefined oder ein Objekt sein)
 * @returns Prisma-kompatiblen Wert (JsonNull für null, undefined für undefined, sonst das Objekt)
 *
 * @example
 * // null -> Prisma.JsonNull (speichert NULL in DB)
 * toJsonValue(null) // => Prisma.JsonNull
 *
 * // undefined -> undefined (Feld wird nicht verändert)
 * toJsonValue(undefined) // => undefined
 *
 * // Leeres Objekt -> leeres Objekt (speichert {} in DB)
 * toJsonValue({}) // => {}
 *
 * // Objekt mit Werten -> Objekt (speichert JSON in DB)
 * toJsonValue({ de: 'Hallo' }) // => { de: 'Hallo' }
 */
export function toJsonValue(
  value: LocalizedString | LocalizedStringLoose | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
}

/**
 * Konvertiert einen optionalen LocalizedString-Wert für Prisma JSON-Felder
 * Ähnlich wie toJsonValue, aber explizit für optionale Felder bei Updates
 *
 * @param value - Der Eingabewert
 * @param isSet - Ob der Wert explizit gesetzt wurde (true) oder nicht (false/undefined)
 * @returns Prisma-kompatiblen Wert oder undefined wenn nicht gesetzt
 */
export function toJsonValueIfSet(
  value: LocalizedString | LocalizedStringLoose | null | undefined,
  isSet: boolean
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (!isSet) {
    return undefined;
  }
  return toJsonValue(value);
}
