import { Suspense } from 'react';
import { Package, Factory, FolderTree, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
}: {
  title: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString('de-DE')}</div>
      </CardContent>
    </Card>
  );
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
      <StatCard title="Komponenten" value={stats.componentsCount} icon={Package} />
      <StatCard title="Hersteller" value={stats.manufacturersCount} icon={Factory} />
      <StatCard title="Kategorien" value={stats.categoriesCount} icon={FolderTree} />
      <StatCard title="Benutzer" value={0} icon={Users} />
    </>
  );
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Übersicht über die ElectroVault Datenbank</p>
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
            <CardTitle>Schnellaktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/admin/components"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5" />
                <span className="font-medium">Neue Komponente erstellen</span>
              </div>
            </a>
            <a
              href="/admin/manufacturers"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Factory className="h-5 w-5" />
                <span className="font-medium">Neuen Hersteller anlegen</span>
              </div>
            </a>
            <a
              href="/admin/categories"
              className="block rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FolderTree className="h-5 w-5" />
                <span className="font-medium">Kategorie verwalten</span>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kürzlich aktualisiert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Hier werden zuletzt bearbeitete Einträge angezeigt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
