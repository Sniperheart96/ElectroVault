'use client';

import { useState, useRef } from 'react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface BooleanFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für BOOLEAN Attribute
 * Zeigt Tri-State Radio: Alle / Ja / Nein
 */
export function BooleanFilter({ attribute, value, onChange }: BooleanFilterProps) {
  const [selected, setSelected] = useState<'all' | 'true' | 'false'>('all');
  const initializedRef = useRef(false);

  // Einmalige Initialisierung
  if (value && !initializedRef.current) {
    initializedRef.current = true;
    if (value.operator === 'isTrue') {
      setSelected('true');
    } else if (value.operator === 'isFalse') {
      setSelected('false');
    }
  }

  // Filter anwenden
  const handleChange = (newValue: string) => {
    setSelected(newValue as 'all' | 'true' | 'false');

    if (newValue === 'all') {
      onChange(null);
    } else if (newValue === 'true') {
      onChange({
        definitionId: attribute.id,
        operator: 'isTrue',
      });
    } else {
      onChange({
        definitionId: attribute.id,
        operator: 'isFalse',
      });
    }
  };

  return (
    <div className="pt-1">
      <RadioGroup value={selected} onValueChange={handleChange} className="flex gap-4">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id={`${attribute.id}-all`} />
          <Label htmlFor={`${attribute.id}-all`} className="text-sm font-normal cursor-pointer">
            Alle
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="true" id={`${attribute.id}-true`} />
          <Label htmlFor={`${attribute.id}-true`} className="text-sm font-normal cursor-pointer">
            Ja
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="false" id={`${attribute.id}-false`} />
          <Label htmlFor={`${attribute.id}-false`} className="text-sm font-normal cursor-pointer">
            Nein
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
