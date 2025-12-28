'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, X, Package, Factory, FolderTree, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  api,
  type Component,
  type Part,
  type Manufacturer,
  type Category,
  type CategoryTreeNode,
} from '@/lib/api';

type SearchType = 'components' | 'parts' | 'manufacturers';
type ComponentStatus = 'ACTIVE' | 'NRND' | 'EOL' | 'OBSOLETE';

interface SearchFilters {
  query: string;
  type: SearchType;
  categoryId: string;
  manufacturerId: string;
  status: ComponentStatus | '';
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'NRND':
      return 'warning';
    case 'EOL':
    case 'OBSOLETE':
      return 'destructive';
    case 'ACQUIRED':
      return 'secondary';
    case 'DEFUNCT':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string, type: SearchType): string {
  if (type === 'manufacturers') {
    const labels: Record<string, string> = {
      ACTIVE: 'Aktiv',
      ACQUIRED: 'Übernommen',
      DEFUNCT: 'Aufgelöst',
    };
    return labels[status] || status;
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    NRND: 'Nicht für Neuentwicklungen',
    EOL: 'Auslaufend',
    OBSOLETE: 'Obsolet',
  };
  return labels[status] || status;
}

function SearchResultSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function flattenCategories(nodes: CategoryTreeNode[], prefix = ''): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  for (const node of nodes) {
    const name = prefix + (node.name.de || node.name.en || 'Unbekannt');
    result.push({ id: node.id, name });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, name + ' → '));
    }
  }
  return result;
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    type: (searchParams.get('type') as SearchType) || 'components',
    categoryId: searchParams.get('category') || '',
    manufacturerId: searchParams.get('manufacturer') || '',
    status: (searchParams.get('status') as ComponentStatus) || '',
  });

  const [components, setComponents] = useState<Component[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [manufacturerOptions, setManufacturerOptions] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [categoryTree, manufacturersData] = await Promise.all([
          api.getCategoryTree(),
          api.getManufacturers({ limit: 100 }),
        ]);
        setCategories(flattenCategories(categoryTree.data));
        setManufacturerOptions(manufacturersData.data);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Update URL when filters change
  const updateUrl = useCallback((newFilters: SearchFilters) => {
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.type !== 'components') params.set('type', newFilters.type);
    if (newFilters.categoryId) params.set('category', newFilters.categoryId);
    if (newFilters.manufacturerId) params.set('manufacturer', newFilters.manufacturerId);
    if (newFilters.status) params.set('status', newFilters.status);
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }, [router]);

  // Perform search
  const performSearch = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      switch (filters.type) {
        case 'components': {
          const result = await api.getComponents({
            limit: 50,
            categoryId: filters.categoryId || undefined,
            status: filters.status || undefined,
          });
          // Client-side filter by query if provided
          let filtered = result.data;
          if (filters.query) {
            const q = filters.query.toLowerCase();
            filtered = filtered.filter(
              (c) =>
                c.name.de?.toLowerCase().includes(q) ||
                c.name.en?.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q) ||
                c.shortDescription?.de?.toLowerCase().includes(q) ||
                c.shortDescription?.en?.toLowerCase().includes(q)
            );
          }
          setComponents(filtered);
          setTotalResults(filtered.length);
          break;
        }
        case 'parts': {
          const result = await api.getParts({
            limit: 50,
            manufacturerId: filters.manufacturerId || undefined,
            status: filters.status || undefined,
          });
          let filtered = result.data;
          if (filters.query) {
            const q = filters.query.toLowerCase();
            filtered = filtered.filter(
              (p) =>
                p.mpn.toLowerCase().includes(q) ||
                p.orderingCode?.toLowerCase().includes(q) ||
                p.manufacturer?.name.toLowerCase().includes(q)
            );
          }
          setParts(filtered);
          setTotalResults(filtered.length);
          break;
        }
        case 'manufacturers': {
          const result = await api.getManufacturers({ limit: 100 });
          let filtered = result.data;
          if (filters.query) {
            const q = filters.query.toLowerCase();
            filtered = filtered.filter(
              (m) =>
                m.name.toLowerCase().includes(q) ||
                m.slug.toLowerCase().includes(q) ||
                m.cageCode?.toLowerCase().includes(q) ||
                m.aliases?.some((a) => a.toLowerCase().includes(q))
            );
          }
          setManufacturers(filtered);
          setTotalResults(filtered.length);
          break;
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Auto-search on mount if URL has params
  useEffect(() => {
    if (searchParams.get('q') || searchParams.get('category') || searchParams.get('manufacturer')) {
      performSearch();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl(filters);
    performSearch();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    // Reset type-specific filters when changing type
    if (key === 'type') {
      newFilters.categoryId = '';
      newFilters.manufacturerId = '';
      newFilters.status = '';
    }
    setFilters(newFilters);
  };

  const clearFilters = () => {
    const newFilters: SearchFilters = {
      query: filters.query,
      type: filters.type,
      categoryId: '',
      manufacturerId: '',
      status: '',
    };
    setFilters(newFilters);
    updateUrl(newFilters);
  };

  const hasActiveFilters = filters.categoryId || filters.manufacturerId || filters.status;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Suche</h1>
          <p className="text-muted-foreground">
            Durchsuchen Sie unsere Datenbank nach Bauteilen, Hersteller-Varianten und Herstellern
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4 mb-8">
          {/* Search Type Tabs */}
          <div className="flex gap-2 border-b pb-4">
            <Button
              type="button"
              variant={filters.type === 'components' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('type', 'components')}
              className="gap-2"
            >
              <Package className="h-4 w-4" />
              Bauteile
            </Button>
            <Button
              type="button"
              variant={filters.type === 'parts' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('type', 'parts')}
              className="gap-2"
            >
              <Factory className="h-4 w-4" />
              Hersteller-Varianten
            </Button>
            <Button
              type="button"
              variant={filters.type === 'manufacturers' ? 'default' : 'outline'}
              onClick={() => handleFilterChange('type', 'manufacturers')}
              className="gap-2"
            >
              <Factory className="h-4 w-4" />
              Hersteller
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  filters.type === 'components'
                    ? 'Bauteilname, Slug oder Beschreibung...'
                    : filters.type === 'parts'
                      ? 'MPN oder Beschreibung...'
                      : 'Herstellername, CAGE Code...'
                }
                value={filters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suchen'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {[filters.categoryId, filters.manufacturerId, filters.status].filter(Boolean).length}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Category Filter (only for components) */}
                  {filters.type === 'components' && (
                    <div className="space-y-2">
                      <Label>Kategorie</Label>
                      <Select
                        value={filters.categoryId || 'all'}
                        onValueChange={(value) => handleFilterChange('categoryId', value === 'all' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Kategorien" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Kategorien</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Manufacturer Filter (only for parts) */}
                  {filters.type === 'parts' && (
                    <div className="space-y-2">
                      <Label>Hersteller</Label>
                      <Select
                        value={filters.manufacturerId || 'all'}
                        onValueChange={(value) => handleFilterChange('manufacturerId', value === 'all' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Alle Hersteller" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Hersteller</SelectItem>
                          {manufacturerOptions.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Status</SelectItem>
                        {filters.type === 'manufacturers' ? (
                          <>
                            <SelectItem value="ACTIVE">Aktiv</SelectItem>
                            <SelectItem value="ACQUIRED">Übernommen</SelectItem>
                            <SelectItem value="DEFUNCT">Aufgelöst</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="ACTIVE">Aktiv</SelectItem>
                            <SelectItem value="NRND">Nicht für Neuentwicklungen</SelectItem>
                            <SelectItem value="EOL">Auslaufend</SelectItem>
                            <SelectItem value="OBSOLETE">Obsolet</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Filter zurücksetzen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </form>

        {/* Results */}
        {loading ? (
          <SearchResultSkeleton />
        ) : hasSearched ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} gefunden
              </p>
            </div>

            {totalResults === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Keine Ergebnisse</h3>
                  <p className="text-muted-foreground">
                    Versuchen Sie andere Suchbegriffe oder passen Sie die Filter an.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {/* Components Results */}
                {filters.type === 'components' &&
                  components.map((component) => (
                    <Card key={component.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-semibold truncate">
                                {component.name.de || component.name.en}
                              </h3>
                              <Badge variant={getStatusBadgeVariant(component.status)}>
                                {getStatusLabel(component.status, 'components')}
                              </Badge>
                            </div>
                            {component.shortDescription && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {component.shortDescription.de || component.shortDescription.en}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/components/${component.slug}`}>Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {/* Parts Results */}
                {filters.type === 'parts' &&
                  parts.map((part) => (
                    <Card key={part.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Factory className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-semibold">{part.mpn}</h3>
                              <Badge variant={getStatusBadgeVariant(part.lifecycleStatus)}>
                                {getStatusLabel(part.lifecycleStatus, 'parts')}
                              </Badge>
                            </div>
                            {part.manufacturer && (
                              <p className="text-sm text-muted-foreground">
                                Hersteller: {part.manufacturer.name}
                              </p>
                            )}
                            {part.orderingCode && (
                              <p className="text-sm text-muted-foreground">
                                Bestellnummer: {part.orderingCode}
                              </p>
                            )}
                            {part.package && (
                              <p className="text-sm text-muted-foreground">
                                Bauform: {part.package.name}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/parts/${encodeURIComponent(part.mpn)}`}>Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                {/* Manufacturers Results */}
                {filters.type === 'manufacturers' &&
                  manufacturers.map((manufacturer) => (
                    <Card key={manufacturer.id} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Factory className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <h3 className="font-semibold">{manufacturer.name}</h3>
                              <Badge variant={getStatusBadgeVariant(manufacturer.status)}>
                                {getStatusLabel(manufacturer.status, 'manufacturers')}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              {manufacturer.countryCode && <span>{manufacturer.countryCode}</span>}
                              {manufacturer.cageCode && <span>CAGE: {manufacturer.cageCode}</span>}
                              {manufacturer.website && (
                                <a
                                  href={manufacturer.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                            {manufacturer.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {manufacturer.description.de || manufacturer.description.en}
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/manufacturers/${manufacturer.slug}`}>Details</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Starten Sie Ihre Suche</h3>
              <p className="text-muted-foreground">
                Geben Sie einen Suchbegriff ein oder nutzen Sie die Filter, um Bauteile zu finden.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchResultSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
