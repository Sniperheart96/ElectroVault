import { Suspense } from 'react';
import { Cpu, Factory, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

/**
 * StatsSection - Server Component für Streaming
 *
 * Lädt die Statistiken und wird per Suspense gestreamt.
 */
async function StatsSection() {
  const t = useTranslations('Home');
  let stats = { components: 0, manufacturers: 0, users: 0 };

  try {
    const statsRes = await api.getStats();
    stats = statsRes.data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
  }

  return (
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
  );
}

/**
 * StatsSkeleton - Loading-Platzhalter für Stats
 */
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
      {[1, 2, 3].map((i) => (
        <div key={i} className="text-center">
          <div className="flex justify-center mb-4">
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="h-9 w-16 mx-auto" />
          <Skeleton className="h-5 w-24 mx-auto mt-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * HomePage - Nur Content (Header/Footer kommen vom Layout)
 */
export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-20 md:py-32">
        <div className="container text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b">
        <div className="container">
          <Suspense fallback={<StatsSkeleton />}>
            <StatsSection />
          </Suspense>
        </div>
      </section>
    </>
  );
}
