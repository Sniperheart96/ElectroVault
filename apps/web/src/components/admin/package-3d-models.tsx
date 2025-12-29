'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { type FileAttachment } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

interface Package3DModelsProps {
  packageId: string;
}

export function Package3DModels({ packageId }: Package3DModelsProps) {
  const api = useApi();
  const { toast } = useToast();

  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load 3D models
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getFilesByPackage(packageId);
      // All files from this endpoint should be 3D models
      setFiles(result.data);
    } catch (error) {
      console.error('Failed to load 3D models:', error);
      toast({
        title: 'Fehler',
        description: '3D-Modelle konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [api, packageId, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine Datei aus.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const result = await api.upload3DModel(selectedFile, packageId, description || undefined);
      setFiles(prev => [result.data, ...prev]);
      setShowUpload(false);
      setSelectedFile(null);
      setDescription('');
      toast({
        title: 'Erfolg',
        description: '3D-Modell wurde hochgeladen.',
      });
    } catch (error) {
      console.error('Failed to upload 3D model:', error);
      toast({
        title: 'Fehler',
        description: '3D-Modell konnte nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      await api.deleteFile(fileToDelete.id);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      toast({
        title: 'Erfolg',
        description: '3D-Modell wurde gelöscht.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: '3D-Modell konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    } finally {
      setFileToDelete(null);
    }
  };

  // Get download URL and open
  const handleDownload = async (file: FileAttachment) => {
    try {
      const result = await api.getFileDownloadUrl(file.id);
      window.open(result.data.url, '_blank');
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Download-URL konnte nicht generiert werden.',
        variant: 'destructive',
      });
    }
  };


  // Get file extension
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">3D-Modelle</CardTitle>
              <CardDescription>
                STEP, STL, 3MF, OBJ oder andere 3D-Formate
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Plus className="mr-1 h-3 w-3" />
              3D-Modell
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showUpload && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-4">
              <div>
                <Label htmlFor="file-upload">3D-Datei auswählen</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".step,.stp,.stl,.3mf,.obj,.wrl,.iges,.igs"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Erlaubte Formate: STEP, STL, 3MF, OBJ, WRL, IGES (max. 50 MB)
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-muted-foreground">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="description">Beschreibung (optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="z.B. Solidworks-Modell, vereinfachtes Modell für PCB, etc."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Hochladen...
                    </>
                  ) : (
                    'Hochladen'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpload(false);
                    setSelectedFile(null);
                    setDescription('');
                  }}
                  disabled={uploading}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {files.length === 0 && !showUpload ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine 3D-Modelle hochgeladen
            </p>
          ) : files.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datei</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Box className="h-5 w-5 text-blue-500" />
                        <span className="font-medium truncate max-w-[200px]">
                          {file.originalName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {getFileExtension(file.originalName)}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] inline-block">
                        {file.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          title="Herunterladen"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFileToDelete(file)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      {/* Summary */}
      {files.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {files.length} 3D-Modell{files.length !== 1 ? 'e' : ''}
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="3D-Modell löschen?"
        description={`Möchten Sie das 3D-Modell "${fileToDelete?.originalName}" wirklich löschen?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
