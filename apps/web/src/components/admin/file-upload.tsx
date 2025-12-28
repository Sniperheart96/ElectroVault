'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  /** Erlaubte Dateitypen */
  accept: 'datasheet' | 'image';
  /** Callback nach erfolgreichem Upload */
  onUploadComplete: (file: UploadedFile) => void;
  /** Callback bei Fehler */
  onError?: (error: string) => void;
  /** Maximale Dateigröße in MB */
  maxSizeMB?: number;
  /** Ob mehrere Dateien erlaubt sind */
  multiple?: boolean;
  /** Ob der Upload deaktiviert ist */
  disabled?: boolean;
  /** Bestehende Dateien */
  existingFiles?: UploadedFile[];
  /** Callback zum Löschen einer Datei */
  onRemove?: (fileId: string) => void;
  /** Klasse für den Container */
  className?: string;
}

export interface UploadedFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

const ACCEPT_MAP = {
  datasheet: {
    mimeTypes: ['application/pdf'],
    extensions: '.pdf',
    label: 'PDF-Dateien',
    maxSize: 50,
    icon: FileText,
  },
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    extensions: '.jpg,.jpeg,.png,.webp',
    label: 'Bilder (JPG, PNG, WebP)',
    maxSize: 10,
    icon: ImageIcon,
  },
};

export function FileUpload({
  accept,
  onUploadComplete,
  onError,
  maxSizeMB,
  multiple = false,
  disabled = false,
  existingFiles = [],
  onRemove,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = ACCEPT_MAP[accept];
  const maxSize = maxSizeMB || config.maxSize;
  const Icon = config.icon;

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check type
      if (!config.mimeTypes.includes(file.type)) {
        return `Ungültiger Dateityp. Erlaubt: ${config.label}`;
      }

      // Check size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSize) {
        return `Datei zu groß. Maximum: ${maxSize}MB`;
      }

      return null;
    },
    [config, maxSize]
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return;
      }

      // Add to upload list
      const uploadEntry: UploadProgress = {
        fileName: file.name,
        progress: 0,
        status: 'uploading',
      };
      setUploads((prev) => [...prev, uploadEntry]);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const endpoint = accept === 'datasheet' ? '/api/v1/files/datasheet' : '/api/v1/files/image';
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        // TODO: Add actual upload progress tracking with XMLHttpRequest or fetch with streams
        // For now, we simulate progress
        const progressInterval = setInterval(() => {
          setUploads((prev) =>
            prev.map((u) =>
              u.fileName === file.name && u.status === 'uploading'
                ? { ...u, progress: Math.min(u.progress + 20, 90) }
                : u
            )
          );
        }, 200);

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'POST',
          body: formData,
          // Note: Don't set Content-Type header - browser will set it with boundary
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: 'Upload fehlgeschlagen' } }));
          throw new Error(errorData.error?.message || 'Upload fehlgeschlagen');
        }

        const result = await response.json();

        // Update upload status
        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name ? { ...u, progress: 100, status: 'complete' as const } : u
          )
        );

        // Notify parent
        onUploadComplete(result.data);

        // Remove from list after a delay
        setTimeout(() => {
          setUploads((prev) => prev.filter((u) => u.fileName !== file.name));
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
        setUploads((prev) =>
          prev.map((u) =>
            u.fileName === file.name
              ? { ...u, status: 'error' as const, error: errorMessage }
              : u
          )
        );
        setError(errorMessage);
        onError?.(errorMessage);
      }
    },
    [accept, validateFile, onUploadComplete, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (!multiple && files.length > 1) {
        setError('Nur eine Datei erlaubt');
        return;
      }

      files.forEach(uploadFile);
    },
    [disabled, multiple, uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach(uploadFile);

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [uploadFile]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={config.extensions}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Icon className="h-10 w-10 text-muted-foreground" />
          <div className="text-sm">
            <span className="font-medium text-primary">Datei auswählen</span>
            <span className="text-muted-foreground"> oder hierher ziehen</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {config.label} (max. {maxSize}MB)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.fileName}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border',
                upload.status === 'error' && 'border-destructive bg-destructive/5',
                upload.status === 'complete' && 'border-green-500 bg-green-50 dark:bg-green-950'
              )}
            >
              {upload.status === 'uploading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : upload.status === 'complete' ? (
                <Icon className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.fileName}</p>
                {upload.status === 'uploading' && (
                  <Progress value={upload.progress} className="h-1 mt-1" />
                )}
                {upload.error && (
                  <p className="text-xs text-destructive mt-1">{upload.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Hochgeladene Dateien</p>
          {existingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.originalName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              {onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(file.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
