'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Package,
  Layers,
  Clock,
  CheckCircle2,
  FileEdit,
  AlertCircle,
  Pencil,
  Plus,
  History,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useApi } from '@/hooks/use-api';
import { type UserStats, type Component, type AuditLogEntry, type LocalizedString } from '@/lib/api';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type UILocale } from '@electrovault/schemas';

/**
 * Dashboard Content - Client Component fuer interaktive Dashboard-Elemente
 */
export function DashboardContent() {
  const t = useTranslations('admin.myDashboard');
  const tCommon = useTranslations('common');
  const tAudit = useTranslations('admin.audit');
  const api = useApi();
  const router = useRouter();
  const locale = useLocale() as UILocale;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [drafts, setDrafts] = useState<Component[]>([]);
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Dashboard-Daten laden
        const result = await api.getMyDashboard({
          draftsLimit: 5,
          activityLimit: 10,
        });

        setStats(result.data.stats);
        setDrafts(result.data.drafts);
        setActivity(result.data.activity);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError(t('error'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title={t('stats.componentsTotal')}
          value={stats?.components.total || 0}
          icon={<Package className="h-4 w-4" />}
          description={t('stats.componentsTotalDesc')}
        />
        <StatsCard
          title={t('stats.variants')}
          value={stats?.parts || 0}
          icon={<Layers className="h-4 w-4" />}
          description={t('stats.variantsDesc')}
        />
        <StatsCard
          title={t('stats.drafts')}
          value={stats?.components.draft || 0}
          icon={<FileEdit className="h-4 w-4" />}
          description={t('stats.draftsDesc')}
          variant="warning"
        />
        <StatsCard
          title={t('stats.pending')}
          value={stats?.components.pending || 0}
          icon={<Clock className="h-4 w-4" />}
          description={t('stats.pendingDesc')}
        />
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.published')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{stats?.components.published || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{stats?.components.pending || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('stats.archived')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              <span className="text-2xl font-bold">{stats?.components.archived || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drafts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileEdit className="h-5 w-5" />
                {t('draftsSection.title')}
              </CardTitle>
              <CardDescription>
                {t('draftsSection.description')}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => router.push('/admin/components')}>
              <Plus className="h-4 w-4 mr-1" />
              {t('draftsSection.newComponent')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {drafts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('draftsSection.empty')}
            </p>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <DraftItem key={draft.id} component={draft} locale={locale} t={t} tCommon={tCommon} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            {t('activitySection.title')}
          </CardTitle>
          <CardDescription>
            {t('activitySection.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('activitySection.empty')}
            </p>
          ) : (
            <div className="space-y-4">
              {activity.map((entry) => (
                <ActivityItem key={entry.id} entry={entry} t={t} tAudit={tAudit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  variant?: 'default' | 'warning';
}

function StatsCard({ title, value, icon, description, variant = 'default' }: StatsCardProps) {
  return (
    <Card className={variant === 'warning' && value > 0 ? 'border-yellow-500/50' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function DraftItem({
  component,
  locale,
  t,
  tCommon
}: {
  component: Component;
  locale: UILocale;
  t: ReturnType<typeof useTranslations<'admin.myDashboard'>>;
  tCommon: ReturnType<typeof useTranslations<'common'>>;
}) {
  const router = useRouter();
  const name = getLocalizedValue(component.name, locale);
  const categoryName = component.category ? getLocalizedValue(component.category.name, locale) : '';

  return (
    <div className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
      <div>
        <h4 className="font-medium">{name || t('draftsSection.noName')}</h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {categoryName && <span>{categoryName}</span>}
          <Badge variant="secondary">{t('draftsSection.draftBadge')}</Badge>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/admin/components?edit=${component.id}`)}
      >
        <Pencil className="h-4 w-4 mr-1" />
        {tCommon('edit')}
      </Button>
    </div>
  );
}

function ActivityItem({
  entry,
  t,
  tAudit
}: {
  entry: AuditLogEntry;
  t: ReturnType<typeof useTranslations<'admin.myDashboard'>>;
  tAudit: ReturnType<typeof useTranslations<'admin.audit'>>;
}) {
  const locale = useLocale();

  const getActionLabel = (action: string): string => {
    const actionMap: Record<string, string> = {
      CREATE: tAudit('created'),
      UPDATE: tAudit('updated'),
      DELETE: tAudit('deleted'),
      RESTORE: tAudit('restored'),
      APPROVE: tAudit('approved'),
      REJECT: tAudit('rejected'),
    };
    return actionMap[action] || action;
  };

  const getEntityLabel = (entityType: string): string => {
    const entityMap: Record<string, string> = {
      COMPONENT: t('entities.COMPONENT'),
      PART: t('entities.PART'),
      MANUFACTURER: t('entities.MANUFACTURER'),
      CATEGORY: t('entities.CATEGORY'),
      PACKAGE: t('entities.PACKAGE'),
    };
    return entityMap[entityType] || entityType;
  };

  const action = getActionLabel(entry.action);
  const entity = getEntityLabel(entry.entityType);
  const date = new Date(entry.createdAt);

  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
        {entry.action === 'CREATE' && <Plus className="h-4 w-4" />}
        {entry.action === 'UPDATE' && <Pencil className="h-4 w-4" />}
        {entry.action === 'DELETE' && <AlertCircle className="h-4 w-4" />}
        {entry.action === 'APPROVE' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        {entry.action === 'REJECT' && <AlertCircle className="h-4 w-4 text-red-500" />}
      </div>
      <div className="flex-1">
        <p className="text-sm">
          {entity} <span className="font-medium">{action}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString(locale)} um {date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Utility function removed - using getLocalizedValue from localized-text.tsx
