'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type Package } from '@/lib/api';
import { PackageDialog } from '@/components/admin/package-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

export default function PackagesPage() {
  const api = useApi();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mountingTypeFilter, setMountingTypeFilter] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
  }, [mountingTypeFilter]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        ...(mountingTypeFilter !== 'all' && { mountingType: mountingTypeFilter }),
      };
      const response = await api.getPackages(params);
      setPackages(response.data);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bauformen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (pkg: Package) => {
    try {
      await api.deletePackage(pkg.id);
      toast({
        title: 'Erfolg',
        description: 'Bauform wurde gelöscht.',
      });
      loadPackages();
      setPackageToDelete(null);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bauform konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  const handleSaved = () => {
    loadPackages();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedPackage(null);
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMountingTypeBadge = (type: Package['mountingType']) => {
    const variants = {
      THT: 'default',
      SMD: 'secondary',
      RADIAL: 'outline',
      AXIAL: 'outline',
      CHASSIS: 'outline',
      OTHER: 'outline',
    } as const;

    const labels = {
      THT: 'THT',
      SMD: 'SMD',
      RADIAL: 'Radial',
      AXIAL: 'Axial',
      CHASSIS: 'Chassis',
      OTHER: 'Sonstiges',
    };

    return <Badge variant={variants[type] || 'outline'}>{labels[type] || type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bauformen</h1>
          <p className="text-muted-foreground">Verwalten Sie alle Gehäusetypen in der Datenbank</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Bauform
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name oder Slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={mountingTypeFilter} onValueChange={setMountingTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Gehäusetyp filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="SMD">SMD</SelectItem>
                <SelectItem value="THT">THT</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="OTHER">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Pin-Anzahl</TableHead>
                  <TableHead>Abmessungen (L×B×H mm)</TableHead>
                  <TableHead>Rastermaß</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Keine Bauformen gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>{getMountingTypeBadge(pkg.mountingType)}</TableCell>
                      <TableCell>{pkg.pinCount || '-'}</TableCell>
                      <TableCell>
                        {pkg.lengthMm || pkg.widthMm || pkg.heightMm
                          ? `${pkg.lengthMm || '-'} × ${pkg.widthMm || '-'} × ${pkg.heightMm || '-'}`
                          : '-'}
                      </TableCell>
                      <TableCell>{pkg.pitchMm ? `${pkg.pitchMm} mm` : '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pkg)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPackageToDelete(pkg)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PackageDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSaved={handleSaved}
      />

      <PackageDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        package={selectedPackage}
        onSaved={handleSaved}
      />

      <DeleteConfirmDialog
        open={!!packageToDelete}
        onOpenChange={(open) => !open && setPackageToDelete(null)}
        title="Bauform löschen?"
        description={`Möchten Sie die Bauform "${packageToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={() => packageToDelete && handleDelete(packageToDelete)}
      />
    </div>
  );
}
