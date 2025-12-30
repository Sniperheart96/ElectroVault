'use client';

import { useState, useTransition, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { setLocale } from '@/app/actions/locale';

/**
 * Verfügbare UI-Sprachen (26 Sprachen)
 * Hinweis: Bei neuen Sprachen auch SUPPORTED_UI_LOCALES in packages/schemas/src/locale.ts erweitern
 */
const LOCALES = [
  // Westeuropäisch
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
  // Nordisch
  { code: 'da', label: 'Danish', nativeLabel: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', label: 'Finnish', nativeLabel: 'Suomi', flag: '🇫🇮' },
  { code: 'no', label: 'Norwegian', nativeLabel: 'Norsk', flag: '🇳🇴' },
  { code: 'sv', label: 'Swedish', nativeLabel: 'Svenska', flag: '🇸🇪' },
  // Osteuropäisch
  { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  { code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', flag: '🇹🇷' },
  { code: 'cs', label: 'Czech', nativeLabel: 'Čeština', flag: '🇨🇿' },
  { code: 'uk', label: 'Ukrainian', nativeLabel: 'Українська', flag: '🇺🇦' },
  { code: 'el', label: 'Greek', nativeLabel: 'Ελληνικά', flag: '🇬🇷' },
  // Asiatisch
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', label: 'Thai', nativeLabel: 'ไทย', flag: '🇹🇭' },
  // Semitisch (RTL)
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦' },
  { code: 'he', label: 'Hebrew', nativeLabel: 'עברית', flag: '🇮🇱' },
] as const;

/**
 * LocaleSwitcher - Dropdown zur Auswahl der UI-Sprache
 *
 * Features:
 * - Suchfeld zum Filtern der Sprachen (englischer und nativer Name)
 * - Lazy Loading (nur Englisch ist immer geladen, andere werden bei Auswahl nachgeladen)
 * - Loading State während des Sprachwechsels
 *
 * Die Seite wird automatisch neu geladen, um die neue Sprache anzuwenden.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLocale, setIsLoadingLocale] = useState(false);

  const handleChange = (newLocale: string) => {
    // Zeige Loading-State für Sprachen außer Englisch (die werden lazy geladen)
    if (newLocale !== 'en' && newLocale !== locale) {
      setIsLoadingLocale(true);
    }

    startTransition(async () => {
      try {
        await setLocale(newLocale);
      } finally {
        setIsLoadingLocale(false);
      }
    });
  };

  const current = LOCALES.find((l) => l.code === locale);

  // Filter locales basierend auf Suchbegriff (case-insensitive)
  const filteredLocales = useMemo(() => {
    if (!searchQuery.trim()) {
      return LOCALES;
    }

    const query = searchQuery.toLowerCase();
    return LOCALES.filter(
      (loc) =>
        loc.label.toLowerCase().includes(query) ||
        loc.nativeLabel.toLowerCase().includes(query) ||
        loc.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const isLoading = isPending || isLoadingLocale;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="gap-1"
          aria-label="Sprache wechseln"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="hidden sm:inline text-xs font-medium">
            {current?.flag ?? locale.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Suchfeld */}
        <div className="p-2 border-b">
          <Input
            type="text"
            placeholder="Sprache suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>

        {/* Sprachen-Liste */}
        <div className="max-h-64 overflow-y-auto">
          {filteredLocales.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Keine Sprache gefunden
            </div>
          ) : (
            filteredLocales.map((loc) => (
              <DropdownMenuItem
                key={loc.code}
                onClick={() => handleChange(loc.code)}
                className={locale === loc.code ? 'bg-accent' : ''}
                disabled={isLoading}
              >
                <span className="mr-2 text-xs font-medium">{loc.flag}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{loc.nativeLabel}</span>
                  {loc.label !== loc.nativeLabel && (
                    <span className="text-xs text-muted-foreground">
                      {loc.label}
                    </span>
                  )}
                </div>
                {locale === loc.code && (
                  <span className="ml-auto text-xs text-muted-foreground">✓</span>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
