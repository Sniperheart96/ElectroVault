'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Image as ImageIcon, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileUpload, type UploadedFile } from '@/components/forms/file-upload';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { type FileAttachment } from '@/lib/api';

interface PartFilesManagerProps {
  partId: string;
}

export function PartFilesManager({ partId }: PartFilesManagerProps) {
  const api = useApi();
  const { toast } = useToast();

  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);
  const [showUploadDatasheet, setShowUploadDatasheet] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);

  // Load files
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.getFilesByPart(partId);
      setFiles(result.data);
    } catch (error) {
      console.error('Failed to load files:', error);
      toast({
        title: 'Fehler',
        description: 'Dateien konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [api, partId, toast]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Handle file upload
  const handleFileUploaded = (file: UploadedFile) => {
    // Add to list
    setFiles(prev => [file as unknown as FileAttachment, ...prev]);
    setShowUploadDatasheet(false);
    setShowUploadImage(false);
    toast({
      title: 'Erfolg',
      description: 'Datei wurde hochgeladen.',
    });
  };

  // Handle file delete
  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      await api.deleteFile(fileToDelete.id);
      setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
      toast({
        title: 'Erfolg',
        description: 'Datei wurde gelöscht.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Datei konnte nicht gelöscht werden.',
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

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file type badge
  const getFileTypeBadge = (fileType: FileAttachment['fileType']) => {
    const config = {
      DATASHEET: { label: 'Datenblatt', variant: 'default' as const },
      IMAGE: { label: 'Bild', variant: 'secondary' as const },
      PINOUT: { label: 'Pinout', variant: 'outline' as const },
      OTHER: { label: 'Sonstiges', variant: 'outline' as const },
    };
    const { label, variant } = config[fileType] || config.OTHER;
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Get file icon
  const getFileIcon = (file: FileAttachment) => {
    if (file.mimeType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (file.mimeType === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  // Separate files by type
  const datasheets = files.filter(f => f.fileType === 'DATASHEET');
  const images = files.filter(f => f.fileType === 'IMAGE' || f.fileType === 'PINOUT');
  const otherFiles = files.filter(f => f.fileType === 'OTHER');

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
      {/* Datasheets Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Datenblätter</CardTitle>
              <CardDescription>PDF-Datenblätter für diese Hersteller-Variante</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowUploadDatasheet(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Datenblatt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showUploadDatasheet && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <FileUpload
                type="datasheet"
                partId={partId}
                onUpload={handleFileUploaded}
                label="Datenblatt hochladen"
                description="PDF-Datei des Hersteller-Datenblatts"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowUploadDatasheet(false)}
              >
                Abbrechen
              </Button>
            </div>
          )}

          {datasheets.length === 0 && !showUploadDatasheet ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine Datenblätter hochgeladen
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datei</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Sprache</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasheets.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="font-medium truncate max-w-[200px]">
                          {file.originalName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{file.version || '-'}</TableCell>
                    <TableCell>{file.language?.toUpperCase() || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFileToDelete(file)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Images Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Bilder</CardTitle>
              <CardDescription>Produktbilder und Pinout-Diagramme</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowUploadImage(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Bild
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showUploadImage && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <FileUpload
                type="image"
                partId={partId}
                onUpload={handleFileUploaded}
                label="Bild hochladen"
                description="JPEG, PNG oder WebP"
              />
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setShowUploadImage(false)}
              >
                Abbrechen
              </Button>
            </div>
          )}

          {images.length === 0 && !showUploadImage ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine Bilder hochgeladen
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map(file => (
                <div
                  key={file.id}
                  className="relative group border rounded-lg overflow-hidden bg-muted/30"
                >
                  <div className="aspect-square flex items-center justify-center p-4">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setFileToDelete(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-2 border-t">
                    <p className="text-xs truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Files Section */}
      {otherFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sonstige Dateien</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datei</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherFiles.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="truncate max-w-[200px]">{file.originalName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getFileTypeBadge(file.fileType)}</TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFileToDelete(file)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        {files.length === 0 ? (
          'Keine Dateien vorhanden'
        ) : (
          `${files.length} Datei${files.length !== 1 ? 'en' : ''} • ${datasheets.length} Datenblatt${datasheets.length !== 1 ? '-er' : ''} • ${images.length} Bild${images.length !== 1 ? 'er' : ''}`
        )}
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
        title="Datei löschen?"
        description={`Möchten Sie die Datei "${fileToDelete?.originalName}" wirklich löschen?`}
        onConfirm={handleDelete}
      />
    </div>
  );
}
