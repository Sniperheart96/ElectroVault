'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { LocalizedString } from '@/lib/api';

interface LocalizedInputProps {
  value: LocalizedString;
  onChange: (value: LocalizedString) => void;
  locales?: string[];
  multiline?: boolean;
  placeholder?: string;
}

export function LocalizedInput({
  value,
  onChange,
  locales = ['de', 'en'],
  multiline = false,
  placeholder,
}: LocalizedInputProps) {
  const [activeLocale, setActiveLocale] = useState(locales[0]);

  const handleChange = (locale: string, text: string) => {
    onChange({ ...value, [locale]: text });
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 border-b">
        {locales.map((locale) => (
          <Button
            key={locale}
            type="button"
            variant={activeLocale === locale ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveLocale(locale)}
            className="rounded-b-none"
          >
            {locale.toUpperCase()}
          </Button>
        ))}
      </div>
      <InputComponent
        value={value[activeLocale as keyof LocalizedString] || ''}
        onChange={(e) => handleChange(activeLocale, e.target.value)}
        placeholder={placeholder ? `${placeholder} (${activeLocale.toUpperCase()})` : undefined}
      />
    </div>
  );
}
