'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Filter } from 'lucide-react';
import type { AttributeDefinition, AttributeFilter } from '@electrovault/schemas';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApi } from '@/hooks/use-api';
import { AttributeFilterControl } from './filter-controls';

interface AttributeFilterSidebarProps {
  categoryId: string | null;
  filters: AttributeFilter[];
  onFiltersChange: (filters: AttributeFilter[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar zum Filtern nach Attributen
 * Lädt automatisch die filterbaren Attribute der ausgewählten Kategorie
 */
export function AttributeFilterSidebar({
  categoryId,
  filters,
  onFiltersChange,
  isOpen,
  onClose,
}: AttributeFilterSidebarProps) {
  const api = useApi();
  const t = useTranslations('filters');
  const [attributes, setAttributes] = useState<AttributeDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState<AttributeFilter[]>([]);

  // Lokale Filter synchronisieren
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Attribute laden wenn Kategorie sich ändert
  useEffect(() => {
    if (!categoryId) {
      setAttributes([]);
      return;
    }

    setLoading(true);
    api.getAttributesByCategory(categoryId, { includeInherited: true })
      .then(result => {
        // Nur filterbare Attribute anzeigen
        const filterableAttrs = result.data.filter(a => a.isFilterable);
        setAttributes(filterableAttrs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId, api]);

  // Filter für ein Attribut aktualisieren
  const handleFilterChange = (definitionId: string, filter: AttributeFilter | null) => {
    setLocalFilters(prev => {
      if (filter === null) {
        return prev.filter(f => f.definitionId !== definitionId);
      }
      const existing = prev.findIndex(f => f.definitionId === definitionId);
      if (existing >= 0) {
        const newFilters = [...prev];
        newFilters[existing] = filter;
        return newFilters;
      }
      return [...prev, filter];
    });
  };

  // Filter anwenden
  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  // Alle Filter zurücksetzen
  const clearAllFilters = () => {
    setLocalFilters([]);
    onFiltersChange([]);
  };

  // Filter für ein bestimmtes Attribut holen
  const getFilter = (definitionId: string): AttributeFilter | undefined => {
    return localFilters.find(f => f.definitionId === definitionId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('title')}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] mt-4">
          <div className="pr-4">
            {loading && (
              <p className="text-sm text-muted-foreground">Lade Attribute...</p>
            )}

            {!loading && attributes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {categoryId
                  ? 'Keine filterbaren Attribute für diese Kategorie'
                  : 'Bitte wählen Sie eine Kategorie aus'
                }
              </p>
            )}

            {!loading && attributes.map((attr) => (
              <AttributeFilterControl
                key={attr.id}
                attribute={attr}
                value={getFilter(attr.id)}
                onChange={(filter) => handleFilterChange(attr.id, filter)}
              />
            ))}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4 flex gap-2">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            disabled={localFilters.length === 0}
            className="flex-1"
          >
            {t('reset')}
          </Button>
          <Button onClick={applyFilters} className="flex-1">
            {t('apply')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
