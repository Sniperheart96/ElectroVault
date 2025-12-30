'use client';

import { useState, useRef } from 'react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface SelectFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für SELECT Attribute
 * Zeigt Radio-Buttons für Einfachauswahl
 */
export function SelectFilter({ attribute, value, onChange }: SelectFilterProps) {
  const [selected, setSelected] = useState<string>('_all');
  const initializedRef = useRef(false);

  // Erlaubte Werte aus Attribut
  const allowedValues = attribute.allowedValues || [];

  // Einmalige Initialisierung
  if (value && (value.operator === 'eq' || value.operator === 'in') && !initializedRef.current) {
    initializedRef.current = true;
    const val = Array.isArray(value.value) ? value.value[0] : value.value;
    if (val) setSelected(String(val));
  }

  // Filter anwenden
  const handleChange = (newValue: string) => {
    setSelected(newValue);

    if (newValue === '_all') {
      onChange(null);
    } else {
      onChange({
        definitionId: attribute.id,
        operator: 'eq',
        value: newValue,
      });
    }
  };

  if (allowedValues.length === 0) {
    return (
      <div className="pt-1">
        <p className="text-xs text-muted-foreground">Keine Auswahloptionen definiert</p>
      </div>
    );
  }

  return (
    <div className="pt-1">
      <RadioGroup value={selected} onValueChange={handleChange} className="space-y-1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="_all" id={`${attribute.id}-all`} />
          <Label htmlFor={`${attribute.id}-all`} className="text-sm font-normal cursor-pointer">
            Alle
          </Label>
        </div>
        {allowedValues.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`${attribute.id}-${option}`} />
            <Label htmlFor={`${attribute.id}-${option}`} className="text-sm font-normal cursor-pointer">
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
