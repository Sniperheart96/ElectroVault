import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, FolderTree } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type CategoryTreeNode } from '@/lib/api';

function CategoryTreeItem({ category, level = 0 }: { category: CategoryTreeNode; level?: number }) {
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className={`${level > 0 ? 'ml-6 border-l pl-4' : ''}`}>
      <Link
        href={`/categories/${category.slug}`}
        className="flex items-center gap-2 py-2 hover:text-primary transition-colors group"
      >
        <FolderTree className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
        <span className="font-medium">
          {category.name.de || category.name.en || 'Unbekannt'}
        </span>
        {hasChildren && (
          <span className="text-xs text-muted-foreground">
            ({category.children.length})
          </span>
        )}
        <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {hasChildren && (
        <div className="space-y-1">
          {category.children.map((child) => (
            <CategoryTreeItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function CategoriesPage() {
  const t = await getTranslations('categories');

  let categoryTree: CategoryTreeNode[] = [];

  try {
    const result = await api.getCategoryTree();
    categoryTree = result.data || [];
  } catch (error) {
    console.error('Failed to fetch category tree:', error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('browseAll')}</p>
        </div>

        {categoryTree.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categoryTree.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-primary" />
                    <Link
                      href={`/categories/${category.slug}`}
                      className="hover:underline"
                    >
                      {category.name.de || category.name.en || 'Unbekannt'}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {category.children && category.children.length > 0 ? (
                    <div className="space-y-1">
                      {category.children.map((child) => (
                        <CategoryTreeItem key={child.id} category={child} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Keine Unterkategorien
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Keine Kategorien gefunden.
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
