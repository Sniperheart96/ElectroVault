import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Search, Cpu, Factory, FolderTree, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api, type Category } from '@/lib/api';

export default async function HomePage() {
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');

  // Fetch data for statistics
  let stats = { categories: 0, manufacturers: 0, components: 0 };

  try {
    const [categoriesRes, manufacturersRes, componentsRes] = await Promise.all([
      api.getCategories({ limit: 1 }),
      api.getManufacturers({ limit: 1 }),
      api.getComponents({ limit: 1 }),
    ]);

    stats = {
      categories: categoriesRes.pagination?.total || 0,
      manufacturers: manufacturersRes.pagination?.total || 0,
      components: componentsRes.pagination?.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }

  // Fetch featured categories (root level)
  let featuredCategories: Category[] = [];
  try {
    const categoriesRes = await api.getCategories({ level: 0, limit: 6 });
    featuredCategories = categoriesRes.data || [];
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/50 to-background py-20 md:py-32">
          <div className="container text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t('title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <form action="/search" method="GET" className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder={t('searchPlaceholder')}
                  className="pl-12 pr-4 py-6 text-lg"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  {tNav('search')}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Cpu className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">{stats.components}</div>
                <div className="text-muted-foreground">{t('stats.components')}</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <Factory className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">{stats.manufacturers}</div>
                <div className="text-muted-foreground">{t('stats.manufacturers')}</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <FolderTree className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">{stats.categories}</div>
                <div className="text-muted-foreground">{t('stats.categories')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-16">
          <div className="container">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">{t('featuredCategories')}</h2>
              <Button variant="ghost" asChild>
                <Link href="/categories">
                  Alle anzeigen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      <Link href={`/categories/${category.slug}`} className="hover:underline">
                        {category.name.de || category.name.en || 'Unbekannt'}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/categories/${category.slug}`}>
                        Durchsuchen
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
