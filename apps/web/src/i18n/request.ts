import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@electrovault/database';
import {
  SUPPORTED_UI_LOCALES,
  DEFAULT_UI_LOCALE,
  LOCALE_COOKIE_NAME,
  type UILocale,
} from '@electrovault/schemas';
import type { AbstractIntlMessages } from 'next-intl';

// ============================================================================
// Missing Translation Tracking (Server-Side)
// ============================================================================

// Sammelt fehlende Übersetzungen pro Locale
const missingTranslations: Map<string, Set<string>> = new Map();

// Debounce-Timer für das Logging
let logTimer: ReturnType<typeof setTimeout> | null = null;
const LOG_DELAY_MS = 2000; // 2 Sekunden nach letztem Fehler loggen

/**
 * Registriert eine fehlende Übersetzung.
 * Wird von getTranslations (Server) aufgerufen.
 */
export function trackMissingTranslation(locale: string, key: string): void {
  if (!missingTranslations.has(locale)) {
    missingTranslations.set(locale, new Set());
  }
  missingTranslations.get(locale)!.add(key);

  // Debounced Logging
  if (logTimer) {
    clearTimeout(logTimer);
  }
  logTimer = setTimeout(() => {
    logMissingTranslations();
  }, LOG_DELAY_MS);
}

/**
 * Loggt alle gesammelten fehlenden Übersetzungen.
 */
function logMissingTranslations(): void {
  if (missingTranslations.size === 0) return;

  let totalMissing = 0;
  const summary: string[] = [];

  for (const [locale, keys] of missingTranslations.entries()) {
    totalMissing += keys.size;
    summary.push(`  ${locale}: ${keys.size} keys`);

    // Bei Bedarf die Keys einzeln auflisten (nur in Development)
    if (process.env.NODE_ENV === 'development' && keys.size <= 20) {
      for (const key of keys) {
        summary.push(`    - ${key}`);
      }
    }
  }

  console.warn(
    `[i18n] Missing translations summary: ${totalMissing} total\n${summary.join('\n')}`
  );

  // Nach dem Loggen leeren
  missingTranslations.clear();
}

// Cache für erfolgreich geladene Sprachdateien
const messagesCache: Map<UILocale, AbstractIntlMessages> = new Map();

// Set von Sprachen, die nicht geladen werden konnten
const failedLocales: Set<UILocale> = new Set();

/**
 * Löst die aktuelle UI-Sprache nach Priority-Kette auf:
 * 1. User.preferences.locale (DB) - eingeloggte Benutzer
 * 2. NEXT_LOCALE Cookie - Gäste
 * 3. Accept-Language Header - Browser-Präferenz
 * 4. Default: 'en'
 */
async function resolveLocale(): Promise<UILocale> {
  // 1. DB-Preference für eingeloggte Benutzer
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { externalId: session.user.id },
        select: { preferences: true },
      });
      const prefs = user?.preferences as { locale?: string } | null;
      if (prefs?.locale && SUPPORTED_UI_LOCALES.includes(prefs.locale as UILocale)) {
        return prefs.locale as UILocale;
      }
    }
  } catch (error) {
    // Session/DB-Fehler ignorieren, weiter mit Fallbacks
    console.error('Failed to fetch user locale preference:', error);
  }

  // 2. Cookie-Preference
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    if (cookieLocale && SUPPORTED_UI_LOCALES.includes(cookieLocale as UILocale)) {
      return cookieLocale as UILocale;
    }
  } catch {
    // Cookie-Fehler ignorieren
  }

  // 3. Accept-Language Header
  try {
    const headerStore = await headers();
    const acceptLang = headerStore.get('accept-language');
    if (acceptLang) {
      const match = acceptLang
        .split(',')
        .map((l) => l.split(';')[0].trim().substring(0, 2).toLowerCase())
        .find((l) => SUPPORTED_UI_LOCALES.includes(l as UILocale));
      if (match) {
        return match as UILocale;
      }
    }
  } catch {
    // Header-Fehler ignorieren
  }

  // 4. Default-Sprache
  return DEFAULT_UI_LOCALE;
}

/**
 * Lädt Messages für eine Sprache mit Fehlerbehandlung.
 * Bei fehlerhaften Sprachdateien wird auf DEFAULT_UI_LOCALE zurückgefallen.
 */
async function loadMessages(locale: UILocale): Promise<{
  messages: AbstractIntlMessages;
  actualLocale: UILocale;
}> {
  // Prüfen ob bereits im Cache
  const cached = messagesCache.get(locale);
  if (cached) {
    return { messages: cached, actualLocale: locale };
  }

  // Prüfen ob diese Sprache bereits als fehlerhaft markiert ist
  if (failedLocales.has(locale)) {
    // Fallback zur Default-Sprache (diese muss immer funktionieren)
    const fallbackMessages = messagesCache.get(DEFAULT_UI_LOCALE);
    if (fallbackMessages) {
      return { messages: fallbackMessages, actualLocale: DEFAULT_UI_LOCALE };
    }
  }

  // Versuche die Sprachdatei zu laden
  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;
    messagesCache.set(locale, messages);
    return { messages, actualLocale: locale };
  } catch (error) {
    // Fehler loggen
    console.error(
      `[i18n] Failed to load messages for locale "${locale}":`,
      error instanceof Error ? error.message : error
    );

    // Sprache als fehlerhaft markieren
    failedLocales.add(locale);

    // Fallback zur Default-Sprache
    if (locale !== DEFAULT_UI_LOCALE) {
      console.warn(
        `[i18n] Falling back to default locale "${DEFAULT_UI_LOCALE}" for failed locale "${locale}"`
      );

      try {
        const fallbackMessages = (
          await import(`../../messages/${DEFAULT_UI_LOCALE}.json`)
        ).default;
        messagesCache.set(DEFAULT_UI_LOCALE, fallbackMessages);
        return { messages: fallbackMessages, actualLocale: DEFAULT_UI_LOCALE };
      } catch (fallbackError) {
        // Kritischer Fehler: Auch Default-Sprache kann nicht geladen werden
        console.error(
          `[i18n] CRITICAL: Failed to load default locale "${DEFAULT_UI_LOCALE}":`,
          fallbackError instanceof Error ? fallbackError.message : fallbackError
        );
        // Leeres Messages-Objekt zurückgeben, um Absturz zu vermeiden
        return { messages: {} as AbstractIntlMessages, actualLocale: DEFAULT_UI_LOCALE };
      }
    }

    // Leeres Messages-Objekt zurückgeben, wenn Default-Sprache fehlschlägt
    return { messages: {} as AbstractIntlMessages, actualLocale: locale };
  }
}

export default getRequestConfig(async () => {
  const requestedLocale = await resolveLocale();
  const { messages, actualLocale } = await loadMessages(requestedLocale);

  return {
    locale: actualLocale,
    messages,
    // Error-Handler für fehlende Übersetzungen (Server-Side)
    onError(error) {
      // MISSING_MESSAGE Fehler sammeln statt werfen
      if (error.code === 'MISSING_MESSAGE') {
        // Key aus der Error-Message extrahieren (Format: "Could not resolve `key` in messages")
        const keyMatch = error.message?.match(/Could not resolve `([^`]+)`/);
        const key = keyMatch ? keyMatch[1] : error.message || 'unknown';
        trackMissingTranslation(actualLocale, key);
        return;
      }
      // Andere Fehler normal loggen
      console.error('[i18n]', error);
    },
    // Fallback-Wert für fehlende Übersetzungen: Key anzeigen
    getMessageFallback({ key, namespace }) {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return `[${fullKey}]`;
    },
  };
});
