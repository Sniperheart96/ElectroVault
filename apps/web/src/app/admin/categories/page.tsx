import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CategoriesTree } from './categories-tree';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getCategoryTree() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return { data: [] };
  }

  try {
    const res = await fetch(`${API_URL}/categories/tree`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      console.error('Failed to fetch categories:', res.status);
      return { data: [] };
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: [] };
  }
}

function countCategories(nodes: any[]): number {
  return nodes.reduce((count, node) => {
    return count + 1 + countCategories(node.children || []);
  }, 0);
}

export default async function CategoriesPage() {
  const categoriesResult = await getCategoryTree();
  const totalCategories = countCategories(categoriesResult.data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategorien</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Kategorie-Hierarchie ({totalCategories} Kategorien)
          </p>
        </div>
      </div>

      <CategoriesTree initialData={categoriesResult.data} />
    </div>
  );
}
