'use client';

import { useState, useRef, useCallback } from 'react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { Input } from '@/components/ui/input';

interface StringFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für STRING Attribute
 * Zeigt Texteingabe für Contains-Suche
 */
export function StringFilter({ attribute, value, onChange }: StringFilterProps) {
  const [searchValue, setSearchValue] = useState<string>('');
  const initializedRef = useRef(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Einmalige Initialisierung
  if (value && value.operator === 'contains' && !initializedRef.current) {
    initializedRef.current = true;
    setSearchValue(String(value.value ?? ''));
  }

  // Filter anwenden
  const applyFilter = () => {
    if (!searchValue.trim()) {
      onChange(null);
      return;
    }

    onChange({
      definitionId: attribute.id,
      operator: 'contains',
      value: searchValue.trim(),
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
  }, [searchValue]);

  return (
    <div className="pt-1">
      <Input
        type="text"
        placeholder="Suchen..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
        className="h-8"
      />
    </div>
  );
}
