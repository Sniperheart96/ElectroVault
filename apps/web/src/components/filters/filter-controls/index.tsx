'use client';

import { useState } from 'react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import { ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { useLocale } from 'next-intl';
import { DecimalFilter } from './decimal-filter';
import { IntegerFilter } from './integer-filter';
import { StringFilter } from './string-filter';
import { BooleanFilter } from './boolean-filter';
import { RangeFilter } from './range-filter';
import { SelectFilter } from './select-filter';
import { MultiselectFilter } from './multiselect-filter';

interface AttributeFilterControlProps {
  attribute: AttributeDefinition;
  value: AttributeFilter | undefined;
  onChange: (filter: AttributeFilter | null) => void;
}

/**
 * Wrapper-Komponente die Filter in einem einklappbaren Bereich anzeigt
 */
export function AttributeFilterControl({
  attribute,
  value,
  onChange,
}: AttributeFilterControlProps) {
  const locale = useLocale();
  const displayName = getLocalizedValue(attribute.displayName, locale);
  const [isOpen, setIsOpen] = useState(!!value); // Offen wenn Filter aktiv
  const hasValue = !!value;

  const renderFilterContent = () => {
    switch (attribute.dataType) {
      case 'DECIMAL':
        return (
          <DecimalFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      case 'INTEGER':
        return (
          <IntegerFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      case 'STRING':
        return (
          <StringFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      case 'BOOLEAN':
        return (
          <BooleanFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      case 'RANGE':
        return (
          <RangeFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      case 'SELECT':
        return (
          <SelectFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      case 'MULTISELECT':
        return (
          <MultiselectFilter
            attribute={attribute}
            value={value}
            onChange={onChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className="flex items-center justify-between w-full py-1 px-1 hover:bg-muted/50 rounded-md transition-colors group"
        onMouseDown={(e) => {
          // Verhindert dass onBlur vom vorherigen Input ausgelöst wird
          // bevor der Click-Event registriert wird
          e.preventDefault();
        }}
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-90"
          )} />
          <span className="text-sm font-medium">{displayName}</span>
        </div>
        {hasValue && (
          <Badge variant="secondary" className="text-xs h-5">
            aktiv
          </Badge>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pr-1 pb-1">
        {renderFilterContent()}
      </CollapsibleContent>
    </Collapsible>
  );
}
