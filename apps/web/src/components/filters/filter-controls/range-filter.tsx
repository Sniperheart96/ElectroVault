'use client';

import { useState, useRef, useCallback } from 'react';
import type { AttributeDefinition, AttributeFilter, SIPrefix } from '@electrovault/schemas';
import { SI_PREFIXES } from '@electrovault/schemas';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RangeFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für RANGE Attribute
 * Der Benutzer gibt einen Wert ein, der innerhalb des gespeicherten Bereichs liegen muss
 */
export function RangeFilter({ attribute, value, onChange }: RangeFilterProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [prefix, setPrefix] = useState<SIPrefix>('');
  const initializedRef = useRef(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Erlaubte Präfixe
  const allowedPrefixes = attribute.allowedPrefixes?.length
    ? attribute.allowedPrefixes
    : [''];

  // Einmalige Initialisierung
  if (value && value.operator === 'withinRange' && !initializedRef.current) {
    initializedRef.current = true;
    // Display-Werte und Präfix aus dem Filter wiederherstellen
    if (value.displayValue !== undefined) {
      setInputValue(String(value.displayValue));
      if (value.displayPrefix) setPrefix(value.displayPrefix);
    }
  }

  // Filter anwenden
  const applyFilter = () => {
    const valStr = inputValue.trim();
    if (!valStr) {
      onChange(null);
      return;
    }

    const val = parseFloat(valStr.replace(',', '.'));
    if (isNaN(val)) {
      return;
    }

    // Normalisieren
    const normalizedValue = val * (SI_PREFIXES[prefix]?.factor ?? 1);

    onChange({
      definitionId: attribute.id,
      operator: 'withinRange',
      value: normalizedValue,
      // Display-Werte für UI-Wiederherstellung speichern
      displayValue: val,
      displayPrefix: prefix || undefined,
    });
  };

  // Verzögertes Blur um Collapsible-Wechsel nicht zu stören
  const handleBlur = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => {
      applyFilter();
      blurTimeoutRef.current = null;
    }, 150);
  }, [inputValue, prefix]);

  return (
    <div className="space-y-1 pt-1">
      <p className="text-xs text-muted-foreground">
        Mein Wert muss im Bereich des Bauteils liegen
      </p>
      <div className="flex gap-1">
        <Input
          type="text"
          inputMode="decimal"
          placeholder="Wert"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
          className="flex-1 h-8"
        />
        {allowedPrefixes.length > 1 && (
          <Select
            value={prefix || '_base'}
            onValueChange={(v) => { setPrefix((v === '_base' ? '' : v) as SIPrefix); setTimeout(applyFilter, 0); }}
          >
            <SelectTrigger className="w-14 h-8">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {allowedPrefixes.map((p) => (
                <SelectItem key={p || 'base'} value={p || '_base'}>
                  {p || '-'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {attribute.unit && (
        <span className="text-xs text-muted-foreground">{attribute.unit}</span>
      )}
    </div>
  );
}
