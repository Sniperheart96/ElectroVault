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
import { type Manufacturer } from '@/lib/api';
import { ManufacturerDialog } from '@/components/admin/manufacturer-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';

interface ManufacturersTableProps {
  initialData: Manufacturer[];
  initialPagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export function ManufacturersTable({
  initialData,
  initialPagination,
}: ManufacturersTableProps) {
  const api = useApi();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [manufacturerToDelete, setManufacturerToDelete] = useState<Manufacturer | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialPagination?.total || 0);
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    loadManufacturers();
  }, [currentPage]);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const response = await api.getManufacturers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });
      setManufacturers(response.data);

      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
        setTotalCount(response.pagination.total);
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Hersteller konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (manufacturer: Manufacturer) => {
    try {
      await api.deleteManufacturer(manufacturer.id);
      toast({
        title: 'Erfolg',
        description: 'Hersteller wurde gelöscht.',
      });
      loadManufacturers();
      setManufacturerToDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Hersteller konnte nicht gelöscht werden.';
      toast({
        title: 'Fehler',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSaved = () => {
    loadManufacturers();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedManufacturer(null);
  };

  const filteredManufacturers = manufacturers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.cageCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Manufacturer['status']) => {
    const variants = {
      ACTIVE: 'default',
      ACQUIRED: 'secondary',
      DEFUNCT: 'destructive',
    } as const;

    const labels = {
      ACTIVE: 'Aktiv',
      ACQUIRED: 'Übernommen',
      DEFUNCT: 'Inaktiv',
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <>
      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Neuer Hersteller
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen nach Name, Slug oder CAGE Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>CAGE Code</TableHead>
                <TableHead>Land</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Website</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Laden...
                  </TableCell>
                </TableRow>
              ) : filteredManufacturers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Keine Hersteller gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredManufacturers.map((manufacturer) => (
                  <TableRow key={manufacturer.id}>
                    <TableCell className="font-medium">{manufacturer.name}</TableCell>
                    <TableCell>{manufacturer.cageCode || '-'}</TableCell>
                    <TableCell>{manufacturer.countryCode || '-'}</TableCell>
                    <TableCell>{getStatusBadge(manufacturer.status)}</TableCell>
                    <TableCell>
                      {manufacturer.website ? (
                        <a
                          href={manufacturer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(manufacturer)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setManufacturerToDelete(manufacturer)}
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

          {!loading && totalPages > 1 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              total={totalCount}
              limit={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>

      <ManufacturerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSaved={handleSaved}
      />

      <ManufacturerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        manufacturer={selectedManufacturer}
        onSaved={handleSaved}
      />

      <DeleteConfirmDialog
        open={!!manufacturerToDelete}
        onOpenChange={(open) => !open && setManufacturerToDelete(null)}
        title="Hersteller löschen?"
        description={`Möchten Sie den Hersteller "${manufacturerToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={() => manufacturerToDelete && handleDelete(manufacturerToDelete)}
      />
    </>
  );
}
