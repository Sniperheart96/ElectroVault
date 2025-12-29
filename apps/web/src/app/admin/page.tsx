import { Suspense } from 'react';
import Link from 'next/link';
import { Package, Factory, FolderTree, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getAuthenticatedApiClient } from '@/lib/api';

async function getDashboardStats() {
  try {
    const api = await getAuthenticatedApiClient();

    const [components, manufacturers, categories] = await Promise.all([
      api.getComponents({ limit: 1 }),
      api.getManufacturers({ limit: 1 }),
      api.getCategories({ limit: 1 }),
    ]);

    return {
      componentsCount: components.pagination?.total || 0,
      manufacturersCount: manufacturers.pagination?.total || 0,
      categoriesCount: categories.pagination?.total || 0,
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return {
      componentsCount: 0,
      manufacturersCount: 0,
      categoriesCount: 0,
    };
  }
}

function StatCard({
  title,
  value,
  icon: Icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  href?: string;
}) {
  const content = (
    <Card className={href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString('de-DE')}</div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20" />
      </CardContent>
    </Card>
  );
}

async function DashboardStats() {
  const stats = await getDashboardStats();

  return (
    <>
      <StatCard title="Bauteile" value={stats.componentsCount} icon={Package} href="/components" />
      <StatCard title="Hersteller" value={stats.manufacturersCount} icon={Factory} href="/manufacturers" />
      <StatCard title="Kategorien" value={stats.categoriesCount} icon={FolderTree} href="/components" />
      <StatCard title="Benutzer" value={0} icon={Users} href="/admin/users" />
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Moderation und Benutzerverwaltung</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Suspense
          fallback={
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          }
        >
          <DashboardStats />
        </Suspense>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Moderation
            </CardTitle>
            <CardDescription>
              Prüfen und genehmigen Sie eingereichte Inhalte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Ausstehende Bauteile</p>
                  <p className="text-sm text-muted-foreground">Warten auf Freigabe</p>
                </div>
              </div>
              <Button asChild>
                <Link href="/admin/moderation">Zur Queue</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Gemeldete Inhalte</p>
                  <p className="text-sm text-muted-foreground">Benutzer-Meldungen prüfen</p>
                </div>
              </div>
              <Button variant="outline" disabled>
                Keine Meldungen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Benutzerverwaltung
            </CardTitle>
            <CardDescription>
              Benutzer und Rollen verwalten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Die Benutzerverwaltung erfolgt über Keycloak. Hier können Sie Benutzeraktivitäten einsehen.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/users">Benutzer anzeigen</Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`${process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080'}/admin/electrovault/console`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Keycloak Admin
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hinweis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Die Verwaltung von Bauteilen, Herstellern, Kategorien und Bauformen erfolgt jetzt direkt in den jeweiligen öffentlichen Ansichten.
            Eingeloggte Benutzer mit den entsprechenden Rechten (Contributor, Moderator, Admin) sehen dort automatisch die Bearbeitungsfunktionen.
          </p>
          <div className="flex gap-2 mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/components">Bauteile verwalten</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/manufacturers">Hersteller verwalten</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/packages">Bauformen verwalten</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
