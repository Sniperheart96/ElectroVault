import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useApi } from './use-api';
import { type CategoryTreeNode } from '@/lib/api';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type UILocale } from '@electrovault/schemas';

interface FlatCategory {
  id: string;
  name: string;
}

function flattenCategories(
  nodes: CategoryTreeNode[],
  locale: UILocale,
  prefix = ''
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    const name = prefix + (getLocalizedValue(node.name, locale) || 'Unbekannt');
    result.push({ id: node.id, name });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, locale, name + ' → '));
    }
  }
  return result;
}

export function useCategoriesFlat() {
  const api = useApi();
  const locale = useLocale() as UILocale;
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const result = await api.getCategoryTree();
        setCategories(flattenCategories(result.data, locale));
        setError(null);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, [locale]);

  return { categories, loading, error };
}
