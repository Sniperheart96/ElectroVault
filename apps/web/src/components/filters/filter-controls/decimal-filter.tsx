'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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

interface DecimalFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für DECIMAL Attribute
 * Zeigt Min/Max Eingaben mit SI-Präfix-Dropdown
 */
export function DecimalFilter({ attribute, value, onChange }: DecimalFilterProps) {
  // Lokaler State für die Eingabefelder - unabhängig vom Filter-Wert
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const [minPrefix, setMinPrefix] = useState<SIPrefix>('');
  const [maxPrefix, setMaxPrefix] = useState<SIPrefix>('');

  // Track ob wir bereits initialisiert haben
  const initializedRef = useRef(false);
  // Timeout-Ref für verzögertes Blur
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Erlaubte Präfixe aus Attribut oder Standard
  const allowedPrefixes = attribute.allowedPrefixes?.length
    ? attribute.allowedPrefixes
    : [''];

  // Einmalige Initialisierung wenn value vorhanden und noch nicht initialisiert
  if (value && !initializedRef.current) {
    initializedRef.current = true;
    // Display-Werte und Präfixe aus dem Filter wiederherstellen
    if (value.operator === 'between') {
      if (value.displayValue !== undefined) {
        setMinValue(String(value.displayValue));
        if (value.displayPrefix) setMinPrefix(value.displayPrefix);
      }
      if (value.displayValueTo !== undefined) {
        setMaxValue(String(value.displayValueTo));
        if (value.displayPrefixTo) setMaxPrefix(value.displayPrefixTo);
      }
    } else if (value.operator === 'gte' && value.displayValue !== undefined) {
      setMinValue(String(value.displayValue));
      if (value.displayPrefix) setMinPrefix(value.displayPrefix);
    } else if (value.operator === 'lte' && value.displayValue !== undefined) {
      setMaxValue(String(value.displayValue));
      if (value.displayPrefix) setMaxPrefix(value.displayPrefix);
    }
  }

  // Filter anwenden wenn Werte sich ändern
  const applyFilter = () => {
    const minStr = minValue.trim();
    const maxStr = maxValue.trim();

    // Leere Strings = kein Filter
    if (!minStr && !maxStr) {
      onChange(null);
      return;
    }

    const min = minStr ? parseFloat(minStr.replace(',', '.')) : null;
    const max = maxStr ? parseFloat(maxStr.replace(',', '.')) : null;

    // Ungültige Zahlen ignorieren
    if ((minStr && (min === null || isNaN(min))) || (maxStr && (max === null || isNaN(max)))) {
      return;
    }

    // Zu SI-Basiseinheit normalisieren
    const normalizedMin = min !== null ? min * (SI_PREFIXES[minPrefix]?.factor ?? 1) : null;
    const normalizedMax = max !== null ? max * (SI_PREFIXES[maxPrefix]?.factor ?? 1) : null;

    if (normalizedMin !== null && normalizedMax !== null) {
      onChange({
        definitionId: attribute.id,
        operator: 'between',
        value: normalizedMin,
        valueTo: normalizedMax,
        // Display-Werte für UI-Wiederherstellung speichern
        displayValue: min!,
        displayValueTo: max!,
        displayPrefix: minPrefix || undefined,
        displayPrefixTo: maxPrefix || undefined,
      });
    } else if (normalizedMin !== null) {
      onChange({
        definitionId: attribute.id,
        operator: 'gte',
        value: normalizedMin,
        displayValue: min!,
        displayPrefix: minPrefix || undefined,
      });
    } else if (normalizedMax !== null) {
      onChange({
        definitionId: attribute.id,
        operator: 'lte',
        value: normalizedMax,
        displayValue: max!,
        displayPrefix: maxPrefix || undefined,
      });
    }
  };

  // Bei Präfix-Änderung nur State setzen - useEffect wendet Filter an
  const handlePrefixChange = (type: 'min' | 'max', newPrefix: SIPrefix) => {
    if (type === 'min') {
      setMinPrefix(newPrefix);
    } else {
      setMaxPrefix(newPrefix);
    }
  };

  // Filter automatisch anwenden wenn Präfix sich ändert (ohne Race Condition)
  const prevPrefixRef = useRef({ min: minPrefix, max: maxPrefix });
  useEffect(() => {
    // Nur anwenden wenn sich Präfix tatsächlich geändert hat und Werte vorhanden sind
    const prefixChanged =
      prevPrefixRef.current.min !== minPrefix ||
      prevPrefixRef.current.max !== maxPrefix;

    if (prefixChanged && (minValue.trim() || maxValue.trim())) {
      applyFilter();
    }
    prevPrefixRef.current = { min: minPrefix, max: maxPrefix };
  }, [minPrefix, maxPrefix]);

  // Verzögertes Blur um Collapsible-Wechsel nicht zu stören
  const handleBlur = useCallback(() => {
    // Vorherigen Timeout abbrechen
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    // Verzögert ausführen - gibt Zeit für Collapsible-Click
    blurTimeoutRef.current = setTimeout(() => {
      applyFilter();
      blurTimeoutRef.current = null;
    }, 150);
  }, [minValue, maxValue, minPrefix, maxPrefix]);

  return (
    <div className="space-y-1 pt-1">
      <div className="grid grid-cols-2 gap-2">
        {/* Min */}
        <div className="flex gap-1">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Min"
            value={minValue}
            onChange={(e) => setMinValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="flex-1 h-8"
          />
          {allowedPrefixes.length > 1 && (
            <Select
              value={minPrefix || '_base'}
              onValueChange={(v) => handlePrefixChange('min', (v === '_base' ? '' : v) as SIPrefix)}
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
        {/* Max */}
        <div className="flex gap-1">
          <Input
            type="text"
            inputMode="decimal"
            placeholder="Max"
            value={maxValue}
            onChange={(e) => setMaxValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="flex-1 h-8"
          />
          {allowedPrefixes.length > 1 && (
            <Select
              value={maxPrefix || '_base'}
              onValueChange={(v) => handlePrefixChange('max', (v === '_base' ? '' : v) as SIPrefix)}
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
      </div>
      {attribute.unit && (
        <span className="text-xs text-muted-foreground">{attribute.unit}</span>
      )}
    </div>
  );
}
