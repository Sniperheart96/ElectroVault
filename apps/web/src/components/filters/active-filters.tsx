'use client';

import { X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getLocalizedValue } from '@/components/ui/localized-text';

interface ActiveFiltersProps {
  filters: AttributeFilter[];
  attributes: AttributeDefinition[];
  onRemove: (definitionId: string) => void;
  onClearAll: () => void;
}

/**
 * Zeigt aktive Filter als Badges an
 */
export function ActiveFilters({
  filters,
  attributes,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const t = useTranslations('filters');
  const locale = useLocale();

  if (filters.length === 0) return null;

  // Formatiert einen Filter-Wert für die Anzeige
  const formatFilterValue = (filter: AttributeFilter): string => {
    switch (filter.operator) {
      case 'eq':
        return `= ${filter.value}`;
      case 'ne':
        return `≠ ${filter.value}`;
      case 'gt':
        return `> ${filter.value}`;
      case 'gte':
        return `≥ ${filter.value}`;
      case 'lt':
        return `< ${filter.value}`;
      case 'lte':
        return `≤ ${filter.value}`;
      case 'between':
        return `${filter.value} - ${filter.valueTo}`;
      case 'contains':
        return `"${filter.value}"`;
      case 'isTrue':
        return 'Ja';
      case 'isFalse':
        return 'Nein';
      case 'withinRange':
        return `im Bereich: ${filter.value}`;
      case 'in':
        return Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value);
      case 'hasAny':
        return `ODER: ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}`;
      case 'hasAll':
        return `UND: ${Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}`;
      default:
        return String(filter.value ?? '');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t('activeFilters')}:</span>
      {filters.map((filter) => {
        const attr = attributes.find((a) => a.id === filter.definitionId);
        if (!attr) return null;

        const displayName = getLocalizedValue(attr.displayName, locale);

        return (
          <Badge
            key={filter.definitionId}
            variant="secondary"
            className="gap-1 pr-1"
          >
            <span className="font-medium">{displayName}:</span>
            <span>{formatFilterValue(filter)}</span>
            <button
              onClick={() => onRemove(filter.definitionId)}
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 px-2 text-xs"
      >
        {t('clearAll')}
      </Button>
    </div>
  );
}
