'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Download,
  Database,
  ArrowRightLeft,
  Play,
  AlertCircle,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/use-api';

interface ImportStats {
  sources: number;
  mappings: number;
  jobs: number;
  unmapped: number;
}

export default function ImportPage() {
  const t = useTranslations('admin.import');
  const api = useApi();
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load sources count
        const sourcesRes = await api.get('/import/sources', { limit: 1 });
        const mappingsRes = await api.get('/import/mappings', { limit: 1 });

        setStats({
          sources: sourcesRes.pagination?.total ?? 0,
          mappings: mappingsRes.pagination?.total ?? 0,
          jobs: 0, // TODO: Jobs noch nicht implementiert
          unmapped: 0, // TODO: Unmapped noch nicht implementiert
        });
      } catch (error) {
        console.error('Failed to load import stats:', error);
        setStats({ sources: 0, mappings: 0, jobs: 0, unmapped: 0 });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [api]);

  const cards = [
    {
      title: t('sources.title'),
      description: t('sources.description'),
      icon: Database,
      href: '/admin/import/sources',
      stat: stats?.sources ?? 0,
      statLabel: t('stats.sources'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: t('mappings.title'),
      description: t('mappings.description'),
      icon: ArrowRightLeft,
      href: '/admin/import/mappings',
      stat: stats?.mappings ?? 0,
      statLabel: t('stats.mappings'),
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: t('jobs.title'),
      description: t('jobs.description'),
      icon: Play,
      href: '/admin/import/jobs',
      stat: stats?.jobs ?? 0,
      statLabel: t('stats.jobs'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      disabled: true, // TODO: Jobs noch nicht implementiert
    },
    {
      title: 'Unmapped Attributes',
      description: 'Nicht gemappte Attribute aus Importen',
      icon: AlertCircle,
      href: '/admin/import/unmapped',
      stat: stats?.unmapped ?? 0,
      statLabel: t('stats.unmapped'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      disabled: true, // TODO: Unmapped noch nicht implementiert
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Download className="h-8 w-8" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('description')}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/import/sources">
            <Plus className="h-4 w-4 mr-2" />
            {t('sources.addNew')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.href}
              className={`${card.disabled ? 'opacity-50' : 'hover:shadow-md transition-shadow'}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold">{card.stat}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {card.statLabel}
                </p>
                {!card.disabled && (
                  <Button variant="link" className="p-0 h-auto mt-2" asChild>
                    <Link href={card.href}>
                      Verwalten <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                )}
                {card.disabled && (
                  <Badge variant="secondary" className="mt-2">
                    Coming Soon
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              {t('sources.title')}
            </CardTitle>
            <CardDescription>
              {t('sources.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Konfigurieren Sie Distributor-APIs (Mouser, DigiKey, Farnell) oder Datei-Importe (CSV, XML).
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/import/sources">
                  Quellen verwalten
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mappings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-green-600" />
              {t('mappings.title')}
            </CardTitle>
            <CardDescription>
              {t('mappings.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Definieren Sie Regeln, wie Attribute aus externen Quellen auf ElectroVault-Attribute übersetzt werden.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/import/mappings">
                  Mappings verwalten
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Import-Workflow
              </h3>
              <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
                <li><strong>Quelle konfigurieren:</strong> API-Zugangsdaten oder Datei-Typ festlegen</li>
                <li><strong>Mappings erstellen:</strong> Attribut-Übersetzungen definieren</li>
                <li><strong>Import starten:</strong> Daten automatisch verarbeiten</li>
                <li><strong>Konflikte lösen:</strong> Duplikate und fehlende Pflichtfelder prüfen</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
