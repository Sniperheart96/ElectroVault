'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { AttributeFilter } from '@electrovault/schemas';
import { AttributeFilterSchema } from '@electrovault/schemas';
import { z } from 'zod';

/**
 * Hook zum Verwalten von Attribut-Filtern im URL-State
 *
 * Filter werden als JSON-String im 'filters' Query-Parameter gespeichert.
 * Bei Filteränderungen wird die Seite auf 1 zurückgesetzt.
 */
export function useFilterState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter aus URL lesen mit Zod-Validierung
  const filters = useMemo<AttributeFilter[]>(() => {
    const filtersParam = searchParams.get('filters');
    if (!filtersParam) return [];

    try {
      const parsed = JSON.parse(decodeURIComponent(filtersParam));

      // Zod-Validierung für Typsicherheit
      const result = z.array(AttributeFilterSchema).safeParse(parsed);
      if (!result.success) {
        console.error('[useFilterState] Invalid filter format in URL', {
          errors: result.error.errors,
          input: parsed,
        });
        return [];
      }
      return result.data;
    } catch (error) {
      console.error('[useFilterState] Failed to parse filters from URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        param: filtersParam?.substring(0, 100),
      });
      return [];
    }
  }, [searchParams]);

  // Filter in URL schreiben
  const setFilters = useCallback((newFilters: AttributeFilter[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.length === 0) {
      params.delete('filters');
    } else {
      params.set('filters', encodeURIComponent(JSON.stringify(newFilters)));
    }

    // Bei Filter-Änderung: page zurücksetzen
    params.delete('page');

    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  // Einzelnen Filter hinzufügen oder aktualisieren
  const setFilter = useCallback((filter: AttributeFilter) => {
    const existing = filters.findIndex(f => f.definitionId === filter.definitionId);
    const newFilters = [...filters];

    if (existing >= 0) {
      newFilters[existing] = filter;
    } else {
      newFilters.push(filter);
    }

    setFilters(newFilters);
  }, [filters, setFilters]);

  // Einzelnen Filter entfernen
  const removeFilter = useCallback((definitionId: string) => {
    setFilters(filters.filter(f => f.definitionId !== definitionId));
  }, [filters, setFilters]);

  // Alle Filter löschen
  const clearFilters = useCallback(() => {
    setFilters([]);
  }, [setFilters]);

  // Filter für ein bestimmtes Attribut holen
  const getFilter = useCallback((definitionId: string): AttributeFilter | undefined => {
    return filters.find(f => f.definitionId === definitionId);
  }, [filters]);

  // Prüfen ob Filter aktiv sind
  const hasFilters = filters.length > 0;

  return {
    filters,
    setFilters,
    setFilter,
    removeFilter,
    clearFilters,
    getFilter,
    hasFilters,
  };
}

export type FilterState = ReturnType<typeof useFilterState>;
