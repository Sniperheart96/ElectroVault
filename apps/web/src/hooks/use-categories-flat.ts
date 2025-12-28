import { useState, useEffect } from 'react';
import { useApi } from './use-api';
import { type CategoryTreeNode } from '@/lib/api';

interface FlatCategory {
  id: string;
  name: string;
}

function flattenCategories(
  nodes: CategoryTreeNode[],
  prefix = ''
): FlatCategory[] {
  const result: FlatCategory[] = [];
  for (const node of nodes) {
    const name = prefix + (node.name.de || node.name.en || 'Unbekannt');
    result.push({ id: node.id, name });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, name + ' → '));
    }
  }
  return result;
}

export function useCategoriesFlat() {
  const api = useApi();
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const result = await api.getCategoryTree();
        setCategories(flattenCategories(result.data));
        setError(null);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  return { categories, loading, error };
}
