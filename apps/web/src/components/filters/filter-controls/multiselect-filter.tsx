'use client';

import { useState, useRef } from 'react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

interface MultiselectFilterProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Filter für MULTISELECT Attribute
 * Zeigt Checkboxen für Mehrfachauswahl mit AND/OR Toggle
 */
export function MultiselectFilter({ attribute, value, onChange }: MultiselectFilterProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [mode, setMode] = useState<'AND' | 'OR'>('OR');
  const initializedRef = useRef(false);

  // Erlaubte Werte aus Attribut
  const allowedValues = attribute.allowedValues || [];

  // Einmalige Initialisierung
  if (value && !initializedRef.current) {
    initializedRef.current = true;
    if (value.operator === 'hasAll') {
      setMode('AND');
      setSelectedValues(Array.isArray(value.value) ? value.value : []);
    } else if (value.operator === 'hasAny') {
      setMode('OR');
      setSelectedValues(Array.isArray(value.value) ? value.value : []);
    }
  }

  // Filter anwenden
  const applyFilter = (values: string[], newMode: 'AND' | 'OR') => {
    if (values.length === 0) {
      onChange(null);
      return;
    }

    onChange({
      definitionId: attribute.id,
      operator: newMode === 'AND' ? 'hasAll' : 'hasAny',
      value: values,
    });
  };

  // Checkbox toggle
  const toggleValue = (val: string) => {
    const newValues = selectedValues.includes(val)
      ? selectedValues.filter(v => v !== val)
      : [...selectedValues, val];
    setSelectedValues(newValues);
    applyFilter(newValues, mode);
  };

  // Mode toggle
  const toggleMode = () => {
    const newMode = mode === 'AND' ? 'OR' : 'AND';
    setMode(newMode);
    if (selectedValues.length > 0) {
      applyFilter(selectedValues, newMode);
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
    <div className="space-y-1 pt-1">
      <div className="flex items-center justify-end">
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'OR' ? 'default' : 'outline'}
            onClick={toggleMode}
            className="h-6 px-2 text-xs"
          >
            ODER
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'AND' ? 'default' : 'outline'}
            onClick={toggleMode}
            className="h-6 px-2 text-xs"
          >
            UND
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {mode === 'OR'
          ? 'Mindestens einer der Werte muss zutreffen'
          : 'Alle ausgewählten Werte müssen zutreffen'
        }
      </p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {allowedValues.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${attribute.id}-${option}`}
              checked={selectedValues.includes(option)}
              onCheckedChange={() => toggleValue(option)}
            />
            <Label
              htmlFor={`${attribute.id}-${option}`}
              className="text-sm font-normal cursor-pointer"
            >
              {option}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
