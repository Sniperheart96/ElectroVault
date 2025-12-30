'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type AttributeDefinition, type SIPrefix, SI_PREFIX_FACTORS } from '@/lib/api';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type UILocale } from '@electrovault/schemas';

// Konstante für Basis-Präfix (leerer String) - Radix UI erlaubt keine leeren Strings als value
const BASE_PREFIX_VALUE = '__BASE__';
import { useApi } from '@/hooks/use-api';

// ============================================
// NUMERIC INPUT COMPONENT
// ============================================

interface NumericInputProps {
  id: string;
  value: number | null | undefined;
  prefix: SIPrefix | null | undefined;
  onChange: (displayValue: string, prefix: SIPrefix | null) => void;
  onPrefixChange?: (newPrefix: SIPrefix) => void;
  dataType: 'INTEGER' | 'DECIMAL';
  allowedPrefixes?: SIPrefix[];
  unit?: string | null;
  className?: string;
}

/**
 * Numerisches Eingabefeld mit Komma/Punkt-Unterstützung
 * Verwendet lokalen State für die Eingabe, normalisiert bei Blur
 */
function NumericInput({
  id,
  value,
  prefix,
  onChange,
  dataType,
  allowedPrefixes,
  unit,
  className,
}: NumericInputProps) {
  // Lokaler State für die Texteingabe
  const [localValue, setLocalValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Synchronisiere lokalen State mit externem Wert (wenn nicht fokussiert)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(getDisplayValue(value, prefix));
    }
  }, [value, prefix, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Erlaube nur gültige Zeichen (Zahlen, Punkt, Komma, Minus)
    if (dataType === 'INTEGER') {
      if (!/^-?\d*$/.test(inputValue)) return;
    } else {
      if (!/^-?\d*[.,]?\d*$/.test(inputValue)) return;
    }
    setLocalValue(inputValue);
    // Sofort den normalisierten Wert aktualisieren
    onChange(inputValue, (prefix || '') as SIPrefix);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Bei Blur: Formatiere den Wert sauber
    const normalized = getNormalizedValue(localValue, prefix);
    if (normalized !== null) {
      setLocalValue(getDisplayValue(normalized, prefix));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const hasAllowedPrefixes = allowedPrefixes && allowedPrefixes.length > 0;
  const currentPrefix = prefix === '' || prefix === null || prefix === undefined
    ? BASE_PREFIX_VALUE
    : prefix;

  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        type="text"
        inputMode={dataType === 'INTEGER' ? 'numeric' : 'decimal'}
        placeholder={`z.B. ${dataType === 'INTEGER' ? '100' : '10,5'}`}
        className={hasAllowedPrefixes ? 'flex-1' : className || 'w-full'}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {hasAllowedPrefixes && (
        <>
          <Select
            value={currentPrefix}
            onValueChange={(newPrefix) => {
              const actualPrefix = newPrefix === BASE_PREFIX_VALUE ? '' : newPrefix;
              // Beim Präfix-Wechsel: Anzeigewert beibehalten, aber neu normalisieren
              onChange(localValue, actualPrefix as SIPrefix);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {allowedPrefixes.map((p) => (
                <SelectItem key={p || 'base'} value={p === '' ? BASE_PREFIX_VALUE : p}>
                  {p || '-'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {unit}
          </span>
        </>
      )}
      {!hasAllowedPrefixes && unit && (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {unit}
        </span>
      )}
    </div>
  );
}

interface AttributeValue {
  definitionId: string;
  normalizedValue?: number | null;
  normalizedMin?: number | null;
  normalizedMax?: number | null;
  prefix?: SIPrefix | null;
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
 * Rundet auf eine sinnvolle Anzahl signifikanter Stellen
 * um Floating-Point-Fehler zu vermeiden (z.B. 21.999999999 -> 22)
 */
function roundToSignificantDigits(value: number, digits: number = 12): number {
  if (value === 0) return 0;
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const scale = Math.pow(10, digits - magnitude - 1);
  return Math.round(value * scale) / scale;
}

/**
 * Berechnet den Anzeigewert aus normalizedValue und Präfix
 * Rundet das Ergebnis um Floating-Point-Fehler zu vermeiden
 */
function getDisplayValue(normalizedValue: number | null | undefined, prefix: SIPrefix | null | undefined): string {
  if (normalizedValue === null || normalizedValue === undefined) return '';
  const factor = SI_PREFIX_FACTORS[prefix || ''] || 1;
  const displayValue = normalizedValue / factor;
  // Runden um Floating-Point-Fehler zu vermeiden (z.B. 21.999999999 -> 22)
  const rounded = roundToSignificantDigits(displayValue);
  return rounded.toString();
}

/**
 * Berechnet den normalisierten Wert aus Anzeigewert und Präfix
 * Akzeptiert sowohl Punkt als auch Komma als Dezimaltrenner
 */
function getNormalizedValue(displayValue: string, prefix: SIPrefix | null | undefined): number | null {
  if (displayValue === '') return null;
  // Komma zu Punkt konvertieren für deutsche Eingaben
  const normalizedInput = displayValue.replace(',', '.');
  const num = parseFloat(normalizedInput);
  if (isNaN(num)) return null;
  const factor = SI_PREFIX_FACTORS[prefix || ''] || 1;
  return num * factor;
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
  const locale = useLocale() as UILocale;
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

  // Hilfsfunktion zum Aktualisieren eines numerischen Wertes
  const updateNumericValue = (
    definitionId: string,
    displayValue: string,
    prefix: SIPrefix | null
  ) => {
    const normalizedValue = getNormalizedValue(displayValue, prefix);
    const existing = values.find((v) => v.definitionId === definitionId);

    if (displayValue === '' && !prefix) {
      // Entfernen wenn leer
      onChange(values.filter((v) => v.definitionId !== definitionId));
      return;
    }

    // Sicherstellen dass normalizedValue eine Zahl ist (nicht String)
    const newValue: AttributeValue = {
      definitionId,
      normalizedValue: normalizedValue !== null ? Number(normalizedValue) : null,
      prefix: prefix || null,
    };

    if (existing) {
      onChange(values.map((v) => (v.definitionId === definitionId ? newValue : v)));
    } else {
      onChange([...values, newValue]);
    }
  };

  // Hilfsfunktion zum Aktualisieren eines String-Wertes
  const updateStringValue = (definitionId: string, stringValue: string) => {
    if (stringValue === '') {
      onChange(values.filter((v) => v.definitionId !== definitionId));
      return;
    }

    const existing = values.find((v) => v.definitionId === definitionId);
    const newValue: AttributeValue = { definitionId, stringValue };

    if (existing) {
      onChange(values.map((v) => (v.definitionId === definitionId ? newValue : v)));
    } else {
      onChange([...values, newValue]);
    }
  };

  // Hilfsfunktion zum Aktualisieren eines Boolean-Wertes
  const updateBooleanValue = (definitionId: string, checked: boolean | 'indeterminate') => {
    if (checked === 'indeterminate') {
      onChange(values.filter((v) => v.definitionId !== definitionId));
      return;
    }

    const existing = values.find((v) => v.definitionId === definitionId);
    const newValue: AttributeValue = {
      definitionId,
      normalizedValue: checked ? 1 : 0,
    };

    if (existing) {
      onChange(values.map((v) => (v.definitionId === definitionId ? newValue : v)));
    } else {
      onChange([...values, newValue]);
    }
  };

  // Hilfsfunktion zum Aktualisieren eines Range-Wertes
  const updateRangeValue = (
    definitionId: string,
    min: number | null,
    max: number | null,
    prefix: SIPrefix | null
  ) => {
    if (min === null && max === null) {
      onChange(values.filter((v) => v.definitionId !== definitionId));
      return;
    }

    const factor = SI_PREFIX_FACTORS[prefix || ''] || 1;
    const normalizedMin = min !== null ? min * factor : null;
    const normalizedMax = max !== null ? max * factor : null;

    const existing = values.find((v) => v.definitionId === definitionId);
    const newValue: AttributeValue = {
      definitionId,
      normalizedMin,
      normalizedMax,
      prefix: prefix || null,
    };

    if (existing) {
      onChange(values.map((v) => (v.definitionId === definitionId ? newValue : v)));
    } else {
      onChange([...values, newValue]);
    }
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
          const displayName = getLocalizedValue(attr.displayName, locale) || attr.name;
          const hasAllowedPrefixes = attr.allowedPrefixes && attr.allowedPrefixes.length > 0;

          return (
            <div key={attr.id} className="space-y-1.5">
              <Label htmlFor={`attr-${attr.id}`} className="flex items-center gap-2">
                {displayName}
                {attr.unit && !hasAllowedPrefixes && (
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
                    checked={currentValue?.normalizedValue === 1}
                    onCheckedChange={(checked) => updateBooleanValue(attr.id, checked)}
                  />
                  <label
                    htmlFor={`attr-${attr.id}`}
                    className="text-sm text-muted-foreground"
                  >
                    Ja
                  </label>
                </div>
              )}

              {/* INTEGER / DECIMAL mit SI-Präfix-Unterstützung */}
              {(attr.dataType === 'INTEGER' || attr.dataType === 'DECIMAL') && (
                <NumericInput
                  id={`attr-${attr.id}`}
                  value={currentValue?.normalizedValue}
                  prefix={currentValue?.prefix}
                  onChange={(displayValue, prefix) => {
                    updateNumericValue(attr.id, displayValue, prefix);
                  }}
                  dataType={attr.dataType}
                  allowedPrefixes={attr.allowedPrefixes}
                  unit={attr.unit}
                />
              )}

              {/* STRING */}
              {attr.dataType === 'STRING' && (
                <Input
                  id={`attr-${attr.id}`}
                  type="text"
                  placeholder={`${displayName} eingeben`}
                  value={currentValue?.stringValue || ''}
                  onChange={(e) => updateStringValue(attr.id, e.target.value)}
                />
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
