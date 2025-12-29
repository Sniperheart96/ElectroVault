import { getTranslations } from 'next-intl/server';
import { Cpu, Factory, Users } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { api } from '@/lib/api';

export default async function HomePage() {
  const t = await getTranslations('home');

  // Fetch statistics from dedicated endpoint
  let stats = { components: 0, manufacturers: 0, users: 0 };

  try {
    const statsRes = await api.getStats();
    stats = statsRes.data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
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
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
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
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold">{stats.users}</div>
                <div className="text-muted-foreground">{t('stats.users')}</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
