import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shell First Skeletons
 *
 * Diese Komponenten werden für das Streaming-Pattern verwendet.
 * Sie zeigen sofort einen Platzhalter, während die echten Daten laden.
 */

// =============================================================================
// Header Skeletons
// =============================================================================

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 mr-6">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="hidden sm:block h-5 w-24" />
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Auth section */}
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    </header>
  );
}

export function UserMenuSkeleton() {
  return <Skeleton className="h-8 w-20 rounded" />;
}

// =============================================================================
// Sidebar Skeletons
// =============================================================================

export function CategorySidebarSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-2 border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>

      {/* Tree Items */}
      <div className="flex-1 p-1.5 space-y-1">
        <Skeleton className="h-7 w-full rounded" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-6 w-full rounded" />
            {i <= 2 && (
              <div className="ml-4 space-y-1">
                <Skeleton className="h-5 w-[90%] rounded" />
                <Skeleton className="h-5 w-[85%] rounded" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminSidebarSkeleton() {
  return (
    <aside className="flex w-64 flex-col border-r bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-8 w-8 rounded" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-full mt-3 rounded" />
      </div>
    </aside>
  );
}

// =============================================================================
// Table Skeletons
// =============================================================================

export function TableSkeleton({ rows = 10, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ComponentsTableSkeleton() {
  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        <Skeleton className="h-4 w-4" /> {/* Expand */}
        <Skeleton className="h-4 w-[200px]" /> {/* Name */}
        <Skeleton className="h-4 w-[150px]" /> {/* Kategorie */}
        <Skeleton className="h-4 w-[80px]" /> {/* Status */}
        <Skeleton className="h-4 w-[60px]" /> {/* Varianten */}
        <div className="flex-1" />
        <Skeleton className="h-4 w-[80px]" /> {/* Aktionen */}
      </div>

      {/* Rows */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-5 w-[80px] rounded-full" />
          <Skeleton className="h-4 w-[60px]" />
          <div className="flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="flex items-center justify-between p-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}

export function ManufacturersTableSkeleton() {
  return (
    <div className="rounded-md border">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
        <Skeleton className="h-10 w-10 rounded" /> {/* Logo */}
        <Skeleton className="h-4 w-[200px]" /> {/* Name */}
        <Skeleton className="h-4 w-[150px]" /> {/* Land */}
        <Skeleton className="h-4 w-[200px]" /> {/* Website */}
        <div className="flex-1" />
        <Skeleton className="h-4 w-[80px]" /> {/* Aktionen */}
      </div>

      {/* Rows */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-4 w-[200px]" />
          <div className="flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PackagesTableSkeleton() {
  return (
    <div className="rounded-lg border bg-card">
      {/* Card Header */}
      <div className="p-6 pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-6 w-32" /> {/* Title */}
            <Skeleton className="h-4 w-48" /> {/* Count */}
          </div>
          <Skeleton className="h-10 w-32 rounded" /> {/* Button */}
        </div>
        {/* Search + Filter */}
        <div className="flex gap-4 mt-4">
          <Skeleton className="h-10 flex-1 rounded" />
          <Skeleton className="h-10 w-[180px] rounded" />
        </div>
      </div>

      {/* Table */}
      <div className="p-6 pt-0">
        {/* Header */}
        <div className="flex items-center gap-4 py-3 border-b">
          <Skeleton className="h-4 w-[200px]" /> {/* Name */}
          <Skeleton className="h-4 w-[80px]" /> {/* Typ */}
          <Skeleton className="h-4 w-[80px]" /> {/* Pin-Anzahl */}
          <Skeleton className="h-4 w-[150px]" /> {/* Abmessungen */}
          <Skeleton className="h-4 w-[80px]" /> {/* Rastermaß */}
          <div className="flex-1" />
          <Skeleton className="h-4 w-[80px]" /> {/* Aktionen */}
        </div>

        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-5 w-[60px] rounded-full" />
            <Skeleton className="h-4 w-[60px]" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[60px]" />
            <div className="flex-1" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Card Skeletons
// =============================================================================

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-16 mt-2" />
      <Skeleton className="h-3 w-32 mt-1" />
    </div>
  );
}

export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ComponentCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Page Skeletons (Vollständige Seiten-Layouts)
// =============================================================================

export function ComponentsPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r">
        <CategorySidebarSkeleton />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-64 rounded" /> {/* Search */}
            <Skeleton className="h-10 w-32 rounded" /> {/* Filter */}
          </div>
          <Skeleton className="h-10 w-32 rounded" /> {/* Button */}
        </div>

        {/* Table */}
        <ComponentsTableSkeleton />
      </div>
    </div>
  );
}

export function ManufacturersPageSkeleton() {
  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40 rounded" />
      </div>

      {/* Search */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full max-w-md rounded" />
      </div>

      {/* Table */}
      <ManufacturersTableSkeleton />
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Stats */}
      <StatsGridSkeleton count={4} />

      {/* Recent Activity */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="rounded-lg border p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="container py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4 py-12">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-[500px] mx-auto" />
        <div className="flex justify-center gap-4 mt-6">
          <Skeleton className="h-12 w-40 rounded" />
          <Skeleton className="h-12 w-40 rounded" />
        </div>
      </div>

      {/* Stats */}
      <StatsGridSkeleton count={3} />

      {/* Featured */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ComponentCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Utility Skeletons
// =============================================================================

export function BreadcrumbSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-24" />
      <span className="text-muted-foreground">/</span>
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function SearchInputSkeleton() {
  return <Skeleton className="h-10 w-full max-w-md rounded" />;
}

export function ButtonSkeleton({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    default: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded`} />;
}
