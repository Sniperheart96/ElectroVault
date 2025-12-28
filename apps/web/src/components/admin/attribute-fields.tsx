'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { type AttributeDefinition } from '@/lib/api';
import { useApi } from '@/hooks/use-api';

interface AttributeValue {
  definitionId: string;
  displayValue: string;
  normalizedValue?: number | null;
  normalizedMin?: number | null;
  normalizedMax?: number | null;
  stringValue?: string | null;
}

interface AttributeFieldsProps {
  /** Kategorie-ID zum Laden der Attribute */
  categoryId: string | null;
  /** Filter: Nur COMPONENT, PART oder BOTH Attribute */
  scope: 'COMPONENT' | 'PART' | 'BOTH';
  /** Aktuelle Attributwerte */
  values: AttributeValue[];
  /** Callback wenn Werte sich ändern */
  onChange: (values: AttributeValue[]) => void;
  /** Label für die Sektion */
  sectionLabel?: string;
  /** Ob auch vererbte Attribute geladen werden sollen */
  includeInherited?: boolean;
}

/**
 * Dynamische Attributfelder basierend auf Kategorie-Definitionen
 */
export function AttributeFields({
  categoryId,
  scope,
  values,
  onChange,
  sectionLabel,
  includeInherited = true,
}: AttributeFieldsProps) {
  const api = useApi();
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  // Lade Attribute wenn sich Kategorie ändert
  useEffect(() => {
    const loadAttributes = async () => {
      if (!categoryId) {
        setAttributes([]);
        return;
      }

      try {
        setLoading(true);
        const result = await api.getAttributesByCategory(categoryId, {
          scope: scope === 'BOTH' ? undefined : scope,
          includeInherited,
        });

        // Filtere nach Scope
        const filtered = result.data.filter((attr) => {
          if (scope === 'COMPONENT') return attr.scope === 'COMPONENT' || attr.scope === 'BOTH';
          if (scope === 'PART') return attr.scope === 'PART' || attr.scope === 'BOTH';
          return true;
        });

        setAttributes(filtered);
      } catch (error) {
        console.error('Failed to load attributes:', error);
        setAttributes([]);
      } finally {
        setLoading(false);
      }
    };

    loadAttributes();
  }, [categoryId, scope, includeInherited]);

  // Hilfsfunktion zum Finden eines Wertes
  const getValue = (definitionId: string): AttributeValue | undefined => {
    return values.find((v) => v.definitionId === definitionId);
  };

  // Hilfsfunktion zum Aktualisieren eines Wertes
  const updateValue = (definitionId: string, displayValue: string, normalizedValue?: number | null) => {
    const existing = values.find((v) => v.definitionId === definitionId);
    const newValue: AttributeValue = {
      definitionId,
      displayValue,
      normalizedValue: normalizedValue ?? null,
    };

    if (existing) {
      onChange(values.map((v) => (v.definitionId === definitionId ? newValue : v)));
    } else {
      onChange([...values, newValue]);
    }
  };

  // Hilfsfunktion zum Entfernen eines leeren Wertes
  const removeValue = (definitionId: string) => {
    onChange(values.filter((v) => v.definitionId !== definitionId));
  };

  if (!categoryId) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
        Bitte wählen Sie zuerst eine Kategorie aus, um Attribute zu sehen.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (attributes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
        Keine Attribute für diese Kategorie definiert.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sectionLabel && (
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium">{sectionLabel}</h4>
          <Badge variant="secondary" className="text-xs">
            {attributes.length} Attribute
          </Badge>
        </div>
      )}

      <div className="grid gap-4">
        {attributes.map((attr) => {
          const currentValue = getValue(attr.id);
          const displayName = attr.displayName.de || attr.displayName.en || attr.name;

          return (
            <div key={attr.id} className="space-y-1.5">
              <Label htmlFor={`attr-${attr.id}`} className="flex items-center gap-2">
                {displayName}
                {attr.unit && (
                  <span className="text-xs text-muted-foreground">({attr.unit})</span>
                )}
                {attr.isRequired && (
                  <span className="text-destructive">*</span>
                )}
              </Label>

              {/* BOOLEAN */}
              {attr.dataType === 'BOOLEAN' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`attr-${attr.id}`}
                    checked={currentValue?.displayValue === 'true'}
                    onCheckedChange={(checked) => {
                      if (checked === 'indeterminate') {
                        removeValue(attr.id);
                      } else {
                        updateValue(attr.id, checked ? 'true' : 'false');
                      }
                    }}
                  />
                  <label
                    htmlFor={`attr-${attr.id}`}
                    className="text-sm text-muted-foreground"
                  >
                    Ja
                  </label>
                </div>
              )}

              {/* INTEGER */}
              {attr.dataType === 'INTEGER' && (
                <Input
                  id={`attr-${attr.id}`}
                  type="number"
                  step="1"
                  placeholder={`z.B. 100${attr.unit ? ` ${attr.unit}` : ''}`}
                  value={currentValue?.displayValue || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      removeValue(attr.id);
                    } else {
                      const num = parseInt(val);
                      const normalized = attr.siMultiplier ? num * attr.siMultiplier : num;
                      updateValue(attr.id, val, normalized);
                    }
                  }}
                />
              )}

              {/* DECIMAL */}
              {attr.dataType === 'DECIMAL' && (
                <Input
                  id={`attr-${attr.id}`}
                  type="number"
                  step="any"
                  placeholder={`z.B. 10.5${attr.unit ? ` ${attr.unit}` : ''}`}
                  value={currentValue?.displayValue || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      removeValue(attr.id);
                    } else {
                      const num = parseFloat(val);
                      const normalized = attr.siMultiplier ? num * attr.siMultiplier : num;
                      updateValue(attr.id, val, normalized);
                    }
                  }}
                />
              )}

              {/* STRING */}
              {attr.dataType === 'STRING' && (
                <Input
                  id={`attr-${attr.id}`}
                  type="text"
                  placeholder={`${displayName} eingeben`}
                  value={currentValue?.displayValue || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      removeValue(attr.id);
                    } else {
                      updateValue(attr.id, val);
                    }
                  }}
                />
              )}

              {/* RANGE (Min-Max) */}
              {attr.dataType === 'RANGE' && (
                <div className="flex items-center gap-2">
                  <Input
                    id={`attr-${attr.id}-min`}
                    type="number"
                    step="any"
                    placeholder="Min"
                    className="flex-1"
                    value={currentValue?.normalizedMin?.toString() || ''}
                    onChange={(e) => {
                      const min = e.target.value ? parseFloat(e.target.value) : null;
                      const max = currentValue?.normalizedMax ?? null;
                      const display = min !== null && max !== null ? `${min} - ${max}` : min?.toString() || max?.toString() || '';
                      onChange(values.map((v) =>
                        v.definitionId === attr.id
                          ? { ...v, displayValue: display, normalizedMin: min, normalizedMax: max }
                          : v
                      ).filter((v) => v.displayValue !== ''));
                      if (display === '' && !values.find((v) => v.definitionId === attr.id)) return;
                      if (display === '') {
                        removeValue(attr.id);
                      } else if (!values.find((v) => v.definitionId === attr.id)) {
                        onChange([...values, { definitionId: attr.id, displayValue: display, normalizedMin: min, normalizedMax: max }]);
                      }
                    }}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    id={`attr-${attr.id}-max`}
                    type="number"
                    step="any"
                    placeholder="Max"
                    className="flex-1"
                    value={currentValue?.normalizedMax?.toString() || ''}
                    onChange={(e) => {
                      const max = e.target.value ? parseFloat(e.target.value) : null;
                      const min = currentValue?.normalizedMin ?? null;
                      const display = min !== null && max !== null ? `${min} - ${max}` : min?.toString() || max?.toString() || '';
                      if (display === '') {
                        removeValue(attr.id);
                      } else {
                        const existing = values.find((v) => v.definitionId === attr.id);
                        if (existing) {
                          onChange(values.map((v) =>
                            v.definitionId === attr.id
                              ? { ...v, displayValue: display, normalizedMin: min, normalizedMax: max }
                              : v
                          ));
                        } else {
                          onChange([...values, { definitionId: attr.id, displayValue: display, normalizedMin: min, normalizedMax: max }]);
                        }
                      }
                    }}
                  />
                  {attr.unit && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {attr.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
