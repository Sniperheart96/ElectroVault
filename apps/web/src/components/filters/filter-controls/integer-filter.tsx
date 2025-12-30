'use client';

import { useState, useRef, useCallback } from 'react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { Input } from '@/components/ui/input';

interface IntegerFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für INTEGER Attribute
 * Zeigt Min/Max Eingaben ohne Dezimalstellen
 */
export function IntegerFilter({ attribute, value, onChange }: IntegerFilterProps) {
  const [minValue, setMinValue] = useState<string>('');
  const [maxValue, setMaxValue] = useState<string>('');
  const initializedRef = useRef(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Einmalige Initialisierung
  if (value && !initializedRef.current) {
    initializedRef.current = true;
    if (value.operator === 'between') {
      if (value.value !== undefined) setMinValue(String(value.value));
      if (value.valueTo !== undefined) setMaxValue(String(value.valueTo));
    } else if (value.operator === 'gte' && value.value !== undefined) {
      setMinValue(String(value.value));
    } else if (value.operator === 'lte' && value.value !== undefined) {
      setMaxValue(String(value.value));
    }
  }

  // Filter anwenden
  const applyFilter = () => {
    const minStr = minValue.trim();
    const maxStr = maxValue.trim();

    if (!minStr && !maxStr) {
      onChange(null);
      return;
    }

    const min = minStr ? parseInt(minStr, 10) : null;
    const max = maxStr ? parseInt(maxStr, 10) : null;

    // Ungültige Zahlen ignorieren
    if ((minStr && (min === null || isNaN(min))) || (maxStr && (max === null || isNaN(max)))) {
      return;
    }

    if (min !== null && max !== null) {
      onChange({
        definitionId: attribute.id,
        operator: 'between',
        value: min,
        valueTo: max,
      });
    } else if (min !== null) {
      onChange({
        definitionId: attribute.id,
        operator: 'gte',
        value: min,
      });
    } else if (max !== null) {
      onChange({
        definitionId: attribute.id,
        operator: 'lte',
        value: max,
      });
    }
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
  }, [minValue, maxValue]);

  return (
    <div className="space-y-1 pt-1">
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minValue}
          onChange={(e) => setMinValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
          className="h-8"
        />
        <Input
          type="number"
          placeholder="Max"
          value={maxValue}
          onChange={(e) => setMaxValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
          className="h-8"
        />
      </div>
      {attribute.unit && (
        <span className="text-xs text-muted-foreground">{attribute.unit}</span>
      )}
    </div>
  );
}
