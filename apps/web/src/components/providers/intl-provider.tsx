'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { useRef, useCallback, useEffect } from 'react';

interface IntlProviderProps {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}

// Sammelt fehlende Übersetzungen auf Client-Side
const missingTranslationsClient: Map<string, Set<string>> = new Map();
let logTimerClient: ReturnType<typeof setTimeout> | null = null;
const LOG_DELAY_MS = 2000;

function logMissingTranslationsClient(): void {
  if (missingTranslationsClient.size === 0) return;

  let totalMissing = 0;
  const summary: string[] = [];

  for (const [locale, keys] of missingTranslationsClient.entries()) {
    totalMissing += keys.size;
    summary.push(`  ${locale}: ${keys.size} keys`);

    // Keys einzeln auflisten (nur in Development, max 20)
    if (process.env.NODE_ENV === 'development' && keys.size <= 20) {
      for (const key of keys) {
        summary.push(`    - ${key}`);
      }
    }
  }

  console.warn(
    `[i18n Client] Missing translations summary: ${totalMissing} total\n${summary.join('\n')}`
  );

  // Nach dem Loggen leeren
  missingTranslationsClient.clear();
}

/**
 * Wrapper um NextIntlClientProvider mit Error-Handling.
 * Sammelt fehlende Übersetzungen und loggt sie gebündelt.
 */
export function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const handleError = useCallback((error: { code: string; key?: string }) => {
    // MISSING_MESSAGE Fehler sammeln statt werfen
    if (error.code === 'MISSING_MESSAGE') {
      const currentLocale = localeRef.current;
      if (!missingTranslationsClient.has(currentLocale)) {
        missingTranslationsClient.set(currentLocale, new Set());
      }
      missingTranslationsClient.get(currentLocale)!.add(error.key || 'unknown');

      // Debounced Logging
      if (logTimerClient) {
        clearTimeout(logTimerClient);
      }
      logTimerClient = setTimeout(() => {
        logMissingTranslationsClient();
      }, LOG_DELAY_MS);
      return;
    }
    // Andere Fehler normal loggen
    console.error('[i18n Client]', error);
  }, []);

  const getMessageFallback = useCallback(
    ({ key, namespace }: { key: string; namespace?: string }) => {
      const fullKey = namespace ? `${namespace}.${key}` : key;
      return `[${fullKey}]`;
    },
    []
  );

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      if (logTimerClient) {
        clearTimeout(logTimerClient);
        // Sofort loggen wenn noch ausstehend
        logMissingTranslationsClient();
      }
    };
  }, []);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      onError={handleError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}
