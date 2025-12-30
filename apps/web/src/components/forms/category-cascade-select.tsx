'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocale } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { type CategoryTreeNode } from '@/lib/api';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type UILocale } from '@electrovault/schemas';

interface CategoryCascadeSelectProps {
  /** The full category tree from API */
  categoryTree: CategoryTreeNode[];
  /** Currently selected final category ID */
  value: string;
  /** Called when final category changes */
  onChange: (categoryId: string) => void;
  /** Whether categories are still loading */
  loading?: boolean;
  /** Error message to display */
  error?: string;
}

// Generate label for a given level (supports unlimited depth)
function getLevelLabel(level: number): string {
  const labels = [
    'Hauptkategorie',
    'Unterkategorie',
    'Typ',
    'Subtyp',
  ];

  if (level < labels.length) {
    return labels[level];
  }

  // For deeper levels, use numbered format
  return `Ebene ${level + 1}`;
}

/**
 * Cascading category selector that enforces selection of leaf categories.
 * Shows multiple dropdowns for each level, only allowing selection of
 * the deepest category in each branch.
 * Supports unlimited nesting depth.
 */
export function CategoryCascadeSelect({
  categoryTree,
  value,
  onChange,
  loading = false,
  error,
}: CategoryCascadeSelectProps) {
  const locale = useLocale() as UILocale;
  // Track selections at each level
  const [selections, setSelections] = useState<string[]>([]);
  // Track the last synced value to detect external changes
  const [lastSyncedValue, setLastSyncedValue] = useState<string>('');

  // Build a lookup map for quick access to any category by ID
  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryTreeNode>();

    const traverse = (nodes: CategoryTreeNode[]) => {
      for (const node of nodes) {
        map.set(node.id, node);
        if (node.children?.length) {
          traverse(node.children);
        }
      }
    };

    traverse(categoryTree);
    return map;
  }, [categoryTree]);

  // Find path from root to a given category ID
  const findPathToCategory = useCallback((categoryId: string): string[] => {
    const path: string[] = [];
    let current = categoryMap.get(categoryId);

    while (current) {
      path.unshift(current.id);
      current = current.parentId ? categoryMap.get(current.parentId) : undefined;
    }

    return path;
  }, [categoryMap]);

  // Sync selections from value prop when it changes externally
  useEffect(() => {
    // Skip if categoryTree isn't loaded yet
    if (categoryTree.length === 0 || categoryMap.size === 0) {
      return;
    }

    // Skip if the value hasn't changed (to avoid overwriting user selections)
    if (value === lastSyncedValue) {
      return;
    }

    if (value) {
      const path = findPathToCategory(value);
      if (path.length > 0) {
        setSelections(path);
        setLastSyncedValue(value);
      }
    } else if (lastSyncedValue !== '') {
      // Only clear if we previously had a value (avoid clearing on initial empty state)
      setSelections([]);
      setLastSyncedValue('');
    }
  }, [value, categoryTree, categoryMap, findPathToCategory, lastSyncedValue]);

  // Get categories available at a specific level based on current selections
  const getCategoriesAtLevel = useCallback((level: number): CategoryTreeNode[] => {
    if (level === 0) {
      return categoryTree;
    }

    const parentId = selections[level - 1];
    if (!parentId) return [];

    const parent = categoryMap.get(parentId);
    return parent?.children || [];
  }, [categoryTree, selections, categoryMap]);

  // Handle selection change at a specific level
  const handleLevelChange = useCallback((level: number, categoryId: string) => {
    // Ignore empty categoryId - this can happen when Radix Select resets
    if (!categoryId) {
      return;
    }

    // Create new selections array, keeping selections up to this level
    const newSelections = selections.slice(0, level);
    newSelections[level] = categoryId;

    setSelections(newSelections);

    // Check if the selected category has children
    const selectedCategory = categoryMap.get(categoryId);
    const hasChildren = selectedCategory?.children && selectedCategory.children.length > 0;

    // Only call onChange if this is a leaf category (no children)
    if (!hasChildren) {
      onChange(categoryId);
    } else {
      // Clear the form value since we need a deeper selection
      onChange('');
    }
  }, [selections, categoryMap, onChange]);

  // Calculate which levels to show
  const levelsToShow = useMemo(() => {
    const levels: number[] = [0]; // Always show level 0

    for (let i = 0; i < selections.length; i++) {
      const categoryId = selections[i];
      if (!categoryId) break;

      const category = categoryMap.get(categoryId);
      if (category?.children && category.children.length > 0) {
        levels.push(i + 1);
      }
    }

    return levels;
  }, [selections, categoryMap]);

  // Check if current selection is complete (leaf node selected)
  const isComplete = useMemo(() => {
    if (selections.length === 0) return false;

    const lastSelection = selections[selections.length - 1];
    if (!lastSelection) return false;

    const category = categoryMap.get(lastSelection);
    return !category?.children || category.children.length === 0;
  }, [selections, categoryMap]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const getLocalizedName = (name: { de?: string; en?: string }): string => {
    return getLocalizedValue(name, locale) || 'Unbekannt';
  };

  return (
    <div className="space-y-3">
      {levelsToShow.map((level) => {
        const categories = getCategoriesAtLevel(level);
        const selectedId = selections[level] || '';
        const label = getLevelLabel(level);
        const isRequired = level === 0 || !!selections[level - 1];

        return (
          <div key={level} className="space-y-1.5">
            <Label className="text-sm font-medium">
              {label} {isRequired && '*'}
            </Label>
            <Select
              value={selectedId}
              onValueChange={(val) => handleLevelChange(level, val)}
            >
              <SelectTrigger className={error && level === levelsToShow[levelsToShow.length - 1] && !isComplete ? 'border-destructive' : ''}>
                <SelectValue placeholder={`${label} auswählen`} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getLocalizedName(cat.name)}
                    {cat.children && cat.children.length > 0 && (
                      <span className="ml-1 text-muted-foreground text-xs">
                        ({cat.children.length})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}

      {error && !isComplete && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!isComplete && selections.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Bitte wählen Sie die tiefste Kategorie-Ebene aus.
        </p>
      )}
    </div>
  );
}
