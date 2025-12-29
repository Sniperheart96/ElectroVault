'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Image as ImageIcon, Trash2, ExternalLink, Plus, Loader2, Upload, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileUpload, type UploadedFile, type ImageUploadResult } from '@/components/forms/file-upload';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useApi } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { type FileAttachment } from '@/lib/api';
import { formatFileSize } from '@/lib/utils';

// Verfügbare Sprachen für die Auswahl
const AVAILABLE_LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'Englisch' },
  { code: 'fr', label: 'Französisch' },
  { code: 'es', label: 'Spanisch' },
  { code: 'it', label: 'Italienisch' },
  { code: 'zh', label: 'Chinesisch' },
  { code: 'ja', label: 'Japanisch' },
];

interface PartFilesManagerProps {
  partId: string;
  /** Aktuelles Bild-URL des Parts (falls vorhanden) */
  currentImageUrl?: string | null;
  /** Callback wenn Bild geändert wird */
  onImageChange?: (imageUrl: string | null) => void;
}

export function PartFilesManager({ partId, currentImageUrl, onImageChange }: PartFilesManagerProps) {
  const api = useApi();
  const { toast } = useToast();

  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileToDelete, setFileToDelete] = useState<FileAttachment | null>(null);

  // Upload-States
  const [showUploadDatasheet, setShowUploadDatasheet] = useState(false);
  const [showUploadOther, setShowUploadOther] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);

  // Sprach-Auswahl für Datenblätter (Pflicht)
  const [selectedDatasheetLanguages, setSelectedDatasheetLanguages] = useState<string[]>([]);
  // Sprach-Auswahl für sonstige Dateien (optional)
  const [selectedOtherLanguages, setSelectedOtherLanguages] = useState<string[]>([]);

  // Bild-State
  const [partImageUrl, setPartImageUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // Handle file upload (Datasheet, Other)
  const handleFileUploaded = (file: UploadedFile | ImageUploadResult) => {
    // FileAttachment result
    if ('id' in file) {
      setFiles(prev => [file as unknown as FileAttachment, ...prev]);
    }
    setShowUploadDatasheet(false);
    setShowUploadOther(false);
    setSelectedDatasheetLanguages([]);
    setSelectedOtherLanguages([]);
    toast({
      title: 'Erfolg',
      description: 'Datei wurde hochgeladen.',
    });
  };

  // Handle image upload (Part-Image)
  const handleImageUploaded = (result: UploadedFile | ImageUploadResult) => {
    if ('imageUrl' in result) {
      setPartImageUrl(result.imageUrl);
      onImageChange?.(result.imageUrl);
      setShowUploadImage(false);
      setIsUploadingImage(false);
      toast({
        title: 'Erfolg',
        description: 'Bild wurde hochgeladen.',
      });
    }
  };

  // Handle image remove
  const handleImageRemove = () => {
    setPartImageUrl(null);
    onImageChange?.(null);
    toast({
      title: 'Erfolg',
      description: 'Bild wurde entfernt.',
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


  // Get language labels
  const getLanguageLabels = (languages: string[] | undefined) => {
    if (!languages || languages.length === 0) return '-';
    return languages
      .map(code => AVAILABLE_LANGUAGES.find(l => l.code === code)?.label || code.toUpperCase())
      .join(', ');
  };

  // Toggle language selection
  const toggleDatasheetLanguage = (code: string) => {
    setSelectedDatasheetLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const toggleOtherLanguage = (code: string) => {
    setSelectedOtherLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  // Separate files by type
  const datasheets = files.filter(f => f.fileType === 'DATASHEET');
  const otherFiles = files.filter(f => f.fileType === 'OTHER' || f.fileType === 'PINOUT');

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
      {/* Bild-Sektion (nur ein Bild pro Part) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Produktbild</CardTitle>
              <CardDescription>Ein Vorschaubild für diese Hersteller-Variante</CardDescription>
            </div>
            {!partImageUrl && !showUploadImage && (
              <Button size="sm" onClick={() => setShowUploadImage(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Bild
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showUploadImage && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30">
              <FileUpload
                type="part-image"
                partId={partId}
                onUpload={handleImageUploaded}
                label="Produktbild hochladen"
                description="JPEG, PNG oder WebP (max. 10 MB)"
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

          {partImageUrl ? (
            <div className="relative group border rounded-lg overflow-hidden bg-muted/30 w-fit">
              <div className="aspect-square w-48 flex items-center justify-center p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={partImageUrl}
                  alt="Produktbild"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback bei Ladefehler
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(partImageUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleImageRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : !showUploadImage && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch kein Bild hochgeladen
            </p>
          )}
        </CardContent>
      </Card>

      {/* Datenblätter-Sektion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Datenblätter</CardTitle>
              <CardDescription>PDF-Datenblätter für diese Hersteller-Variante</CardDescription>
            </div>
            {!showUploadDatasheet && (
              <Button size="sm" onClick={() => setShowUploadDatasheet(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Datenblatt
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showUploadDatasheet && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* Sprach-Auswahl (Pflicht) */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Sprachen des Datenblatts <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_LANGUAGES.map(lang => (
                    <div key={lang.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`datasheet-lang-${lang.code}`}
                        checked={selectedDatasheetLanguages.includes(lang.code)}
                        onCheckedChange={() => toggleDatasheetLanguage(lang.code)}
                      />
                      <Label
                        htmlFor={`datasheet-lang-${lang.code}`}
                        className="text-sm cursor-pointer"
                      >
                        {lang.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedDatasheetLanguages.length === 0 && (
                  <p className="text-xs text-destructive mt-1">
                    Mindestens eine Sprache muss ausgewählt werden
                  </p>
                )}
              </div>

              {/* Upload-Komponente (nur aktiv wenn Sprachen gewählt) */}
              <FileUpload
                type="datasheet"
                partId={partId}
                languages={selectedDatasheetLanguages}
                onUpload={handleFileUploaded}
                label="Datenblatt hochladen"
                description="PDF-Datei des Hersteller-Datenblatts"
                disabled={selectedDatasheetLanguages.length === 0}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowUploadDatasheet(false);
                  setSelectedDatasheetLanguages([]);
                }}
              >
                Abbrechen
              </Button>
            </div>
          )}

          {datasheets.length === 0 && !showUploadDatasheet ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine Datenblätter hochgeladen
            </p>
          ) : datasheets.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datei</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Sprachen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasheets.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-500" />
                        <span className="font-medium truncate max-w-[200px]">
                          {file.originalName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{getLanguageLabels(file.languages)}</TableCell>
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

      {/* Sonstige Dateien-Sektion */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Sonstige Dateien</CardTitle>
              <CardDescription>Zusatzdokumente, Applikationshinweise, etc.</CardDescription>
            </div>
            {!showUploadOther && (
              <Button size="sm" onClick={() => setShowUploadOther(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Dokument
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showUploadOther && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* Sprach-Auswahl (Optional) */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Sprachen (optional)
                </Label>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_LANGUAGES.map(lang => (
                    <div key={lang.code} className="flex items-center space-x-2">
                      <Checkbox
                        id={`other-lang-${lang.code}`}
                        checked={selectedOtherLanguages.includes(lang.code)}
                        onCheckedChange={() => toggleOtherLanguage(lang.code)}
                      />
                      <Label
                        htmlFor={`other-lang-${lang.code}`}
                        className="text-sm cursor-pointer"
                      >
                        {lang.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload-Komponente */}
              <FileUpload
                type="other"
                partId={partId}
                languages={selectedOtherLanguages.length > 0 ? selectedOtherLanguages : undefined}
                onUpload={handleFileUploaded}
                label="Dokument hochladen"
                description="Beliebige Dateien (PDF, TXT, ZIP, etc.)"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowUploadOther(false);
                  setSelectedOtherLanguages([]);
                }}
              >
                Abbrechen
              </Button>
            </div>
          )}

          {otherFiles.length === 0 && !showUploadOther ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Noch keine Dokumente hochgeladen
            </p>
          ) : otherFiles.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datei</TableHead>
                  <TableHead>Größe</TableHead>
                  <TableHead>Sprachen</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {otherFiles.map(file => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{file.originalName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{getLanguageLabels(file.languages)}</TableCell>
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

      {/* Zusammenfassung */}
      <div className="text-sm text-muted-foreground">
        {files.length === 0 && !partImageUrl ? (
          'Keine Dateien vorhanden'
        ) : (
          <>
            {partImageUrl && '1 Bild'}
            {partImageUrl && files.length > 0 && ' • '}
            {files.length > 0 && `${files.length} Datei${files.length !== 1 ? 'en' : ''}`}
            {datasheets.length > 0 && ` • ${datasheets.length} Datenblatt${datasheets.length !== 1 ? '-er' : ''}`}
          </>
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
