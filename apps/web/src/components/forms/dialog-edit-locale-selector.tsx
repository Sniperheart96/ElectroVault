'use client';

import { useState, useMemo } from 'react';
import { Globe } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useEditLocale } from '@/contexts/edit-locale-context';
import {
  SUPPORTED_UI_LOCALES,
  LOCALE_METADATA,
  type UILocale,
} from '@electrovault/schemas';

/**
 * DialogEditLocaleSelector - Globaler Sprachselektor für Dialoge
 *
 * Zeigt die aktuelle Bearbeitungssprache an und ermöglicht deren Wechsel.
 * Wird im DialogHeader platziert und gilt für alle LocalizedInput-Felder.
 *
 * @example
 * ```tsx
 * <DialogHeader>
 *   <DialogTitle>Bauteil bearbeiten</DialogTitle>
 *   <DialogEditLocaleSelector />
 * </DialogHeader>
 * ```
 */
export function DialogEditLocaleSelector() {
  const t = useTranslations('admin');
  const { editLocale, setEditLocale } = useEditLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const currentMeta = LOCALE_METADATA[editLocale];

  // Filter locales based on search query
  const filteredLocales = useMemo(() => {
    if (!searchQuery.trim()) {
      return SUPPORTED_UI_LOCALES;
    }

    const query = searchQuery.toLowerCase();
    return SUPPORTED_UI_LOCALES.filter((code) => {
      const meta = LOCALE_METADATA[code];
      return (
        meta.label.toLowerCase().includes(query) ||
        meta.nativeLabel.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const handleSelect = (locale: UILocale) => {
    setEditLocale(locale);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t('form.editIn')}</span>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-8">
            <Globe className="h-3.5 w-3.5" />
            <span>{currentMeta.flag}</span>
            <span className="font-medium">{currentMeta.nativeLabel}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Suchfeld */}
          <div className="p-2 border-b">
            <Input
              type="text"
              placeholder={t('form.searchLanguage')}
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
                {t('form.noLanguageFound')}
              </div>
            ) : (
              filteredLocales.map((code) => {
                const meta = LOCALE_METADATA[code];
                return (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => handleSelect(code)}
                    className={editLocale === code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2 text-base">{meta.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{meta.nativeLabel}</span>
                      {meta.label !== meta.nativeLabel && (
                        <span className="text-xs text-muted-foreground">
                          {meta.label}
                        </span>
                      )}
                    </div>
                    {editLocale === code && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        ✓
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
