'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, File, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export type FileUploadType = 'datasheet' | 'image' | 'pinout' | 'logo' | 'model3d' | 'other';

export interface UploadedFile {
  id: string;
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  size: number;
  fileType: string;
  bucketPath: string;
  description?: string | null;
  downloadUrl?: string;
}

export interface FileUploadProps {
  /** Type of file being uploaded - determines validation and endpoint */
  type: FileUploadType;
  /** Current uploaded file (for display) */
  value?: UploadedFile | null;
  /** Callback when file is uploaded */
  onUpload: (file: UploadedFile) => void;
  /** Callback when file is removed */
  onRemove?: () => void;
  /** ID of the part to associate with */
  partId?: string;
  /** ID of the component to associate with */
  componentId?: string;
  /** ID of the manufacturer to associate with (for logo) */
  manufacturerId?: string;
  /** ID of the package to associate with (for 3D model) */
  packageId?: string;
  /** Custom label */
  label?: string;
  /** Description text */
  description?: string;
  /** Whether upload is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** API base URL */
  apiBaseUrl?: string;
  /** Auth token */
  token?: string | null;
}

// File type configurations
const FILE_CONFIGS: Record<FileUploadType, {
  accept: string;
  maxSize: number;
  maxSizeLabel: string;
  icon: typeof FileText;
  label: string;
  endpoint: string;
}> = {
  datasheet: {
    accept: 'application/pdf',
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: '50 MB',
    icon: FileText,
    label: 'Datenblatt (PDF)',
    endpoint: '/files/datasheet',
  },
  image: {
    accept: 'image/jpeg,image/png,image/webp',
    maxSize: 10 * 1024 * 1024,
    maxSizeLabel: '10 MB',
    icon: ImageIcon,
    label: 'Bild',
    endpoint: '/files/image',
  },
  pinout: {
    accept: 'image/jpeg,image/png,image/webp,application/pdf',
    maxSize: 10 * 1024 * 1024,
    maxSizeLabel: '10 MB',
    icon: ImageIcon,
    label: 'Pinout-Diagramm',
    endpoint: '/files/pinout',
  },
  logo: {
    accept: 'image/jpeg,image/png,image/webp,image/svg+xml',
    maxSize: 5 * 1024 * 1024,
    maxSizeLabel: '5 MB',
    icon: ImageIcon,
    label: 'Logo',
    endpoint: '/files/logo',
  },
  model3d: {
    accept: '.step,.stp,.stl,.wrl,.iges,.igs',
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: '50 MB',
    icon: File,
    label: '3D-Modell',
    endpoint: '/files/model3d',
  },
  other: {
    accept: '*/*',
    maxSize: 50 * 1024 * 1024,
    maxSizeLabel: '50 MB',
    icon: File,
    label: 'Datei',
    endpoint: '/files/other',
  },
};

// ============================================
// COMPONENT
// ============================================

export function FileUpload({
  type,
  value,
  onUpload,
  onRemove,
  partId,
  componentId,
  manufacturerId,
  packageId,
  label,
  description,
  disabled = false,
  className,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  token,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = FILE_CONFIGS[type];

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle file upload
  const handleUpload = useCallback(async (file: File) => {
    setError(null);

    // Validate file size
    if (file.size > config.maxSize) {
      setError(`Datei ist zu groß. Maximum: ${config.maxSizeLabel}`);
      return;
    }

    // Validate file type (basic check)
    const acceptedTypes = config.accept.split(',');
    const isValidType = acceptedTypes.some(acceptType => {
      if (acceptType === '*/*') return true;
      if (acceptType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(acceptType);
      }
      return file.type === acceptType || file.type.startsWith(acceptType.replace('*', ''));
    });

    if (!isValidType && config.accept !== '*/*') {
      setError('Dateityp nicht erlaubt');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (partId) formData.append('partId', partId);
      if (componentId) formData.append('componentId', componentId);
      if (manufacturerId) formData.append('manufacturerId', manufacturerId);
      if (packageId) formData.append('packageId', packageId);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${apiBaseUrl}${config.endpoint}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Upload fehlgeschlagen');
      }

      const result = await response.json();
      setUploadProgress(100);

      // Delay to show 100% before hiding
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        onUpload(result.data);
      }, 500);
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen');
    }
  }, [config, partId, componentId, manufacturerId, packageId, apiBaseUrl, token, onUpload]);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files[0]);
    }
  }, [disabled, isUploading, handleUpload]);

  // File input change handler
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files[0]);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [handleUpload]);

  // Click to select file
  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      inputRef.current?.click();
    }
  }, [disabled, isUploading]);

  const Icon = config.icon;

  // If we have a value, show the uploaded file
  if (value) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
          <div className="flex-shrink-0">
            {value.mimeType.startsWith('image/') ? (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            ) : value.mimeType === 'application/pdf' ? (
              <FileText className="h-8 w-8 text-red-500" />
            ) : (
              <File className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{value.originalName}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.size)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {value.downloadUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => window.open(value.downloadUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Upload area
  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && !disabled && 'hover:border-primary/50 hover:bg-muted/30',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={config.accept}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>
            <Progress value={uploadProgress} className="w-full max-w-[200px]" />
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-muted">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {label || config.label} hochladen
              </p>
              <p className="text-xs text-muted-foreground">
                Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Max. {config.maxSizeLabel}
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
