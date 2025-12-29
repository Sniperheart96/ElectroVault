/**
 * File Service - Datei-Upload und Verwaltung
 */

import { prisma, FileType, UserRole } from '@electrovault/database';
import * as crypto from 'crypto';
import * as path from 'path';
import {
  uploadFile,
  deleteFile,
  getPresignedUrl,
  getPublicLogoUrl,
  BUCKET_NAME,
} from '../lib/minio';
import {
  ApiError,
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../lib/errors';

// ============================================
// VALIDIERUNGS-KONFIGURATION
// ============================================

const FILE_LIMITS = {
  DATASHEET: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: ['application/pdf'],
    allowedExtensions: ['.pdf'],
  },
  IMAGE: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  PINOUT: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
  },
  LOGO: {
    maxSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
  },
  MODEL_3D: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: [
      'application/octet-stream', // .step, .stp, .stl
      'model/step',
      'model/stl',
      'model/x.step-xml+zip',
      'application/sla', // STL
      'model/vrml', // .wrl
      'application/iges', // .igs, .iges
    ],
    allowedExtensions: ['.step', '.stp', '.stl', '.wrl', '.iges', '.igs', '.3mf', '.obj'],
  },
  OTHER: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: [], // Alle erlaubt
    allowedExtensions: [], // Alle erlaubt
  },
};

// ============================================
// INTERFACES
// ============================================

export interface FileMetadata {
  id: string;
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
  bucketName: string;
  bucketPath: string;
  description?: string | null;
  languages: string[];  // Array für Mehrfachauswahl (z.B. ["de", "en"])
  componentId?: string | null;
  partId?: string | null;
  packageId?: string | null;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadOptions {
  fileType: FileType;
  userId: string;
  componentId?: string;
  partId?: string;
  packageId?: string;
  description?: string;
  languages?: string[];  // Array für Mehrfachauswahl
}

/**
 * Konfigurations-Typ für Datei-Limits
 * Zentral definiert, um Duplikation zu vermeiden
 */
type LimitsConfig = {
  maxSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
};

// ============================================
// HELPER FUNKTIONEN
// ============================================

/**
 * Sanitiert einen Dateinamen
 * - Entfernt unsichere Zeichen
 * - Behält die Erweiterung bei
 */
function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext);

  // Nur alphanumerische Zeichen, Bindestriche und Unterstriche
  const sanitized = base
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100); // Max 100 Zeichen

  return `${sanitized}${ext}`;
}

/**
 * Generiert einen eindeutigen Bucket-Pfad
 * Format: {fileType}/{year}/{month}/{uuid}_{sanitized-filename}
 */
function generateBucketPath(
  fileType: FileType,
  sanitizedFilename: string
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = crypto.randomUUID();

  return `${fileType.toLowerCase()}/${year}/${month}/${uuid}_${sanitizedFilename}`;
}

/**
 * Validiert eine Datei gegen die FileType-spezifischen Limits
 * @param fileTypeOrLabel - FileType enum oder ein beschreibendes Label (z.B. 'images', 'logos')
 */
function validateFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  fileTypeOrLabel: FileType | keyof typeof FILE_LIMITS,
  label?: string
): void {
  const limits: LimitsConfig = FILE_LIMITS[fileTypeOrLabel as keyof typeof FILE_LIMITS];
  const displayLabel = label || fileTypeOrLabel;

  // Dateigröße prüfen
  if (buffer.length > limits.maxSize) {
    throw new BadRequestError(
      `File size exceeds limit of ${limits.maxSize / 1024 / 1024}MB for ${displayLabel}`,
      {
        maxSize: limits.maxSize,
        actualSize: buffer.length,
      }
    );
  }

  // MIME-Type prüfen (wenn spezifiziert)
  if (
    limits.allowedMimeTypes.length > 0 &&
    !limits.allowedMimeTypes.includes(mimeType.toLowerCase())
  ) {
    throw new BadRequestError(
      `MIME type '${mimeType}' is not allowed for ${displayLabel}`,
      {
        allowedMimeTypes: limits.allowedMimeTypes,
        actualMimeType: mimeType,
      }
    );
  }

  // Dateiendung prüfen (wenn spezifiziert)
  const ext = path.extname(filename).toLowerCase();
  if (
    limits.allowedExtensions.length > 0 &&
    !limits.allowedExtensions.includes(ext)
  ) {
    throw new BadRequestError(
      `File extension '${ext}' is not allowed for ${displayLabel}`,
      {
        allowedExtensions: limits.allowedExtensions,
        actualExtension: ext,
      }
    );
  }
}

// ============================================
// FILE SERVICE
// ============================================

class FileService {
  /**
   * Lädt eine Datei hoch
   */
  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options: UploadOptions
  ): Promise<FileMetadata> {
    const { fileType, userId, componentId, partId, packageId, description, languages } =
      options;

    // Validierung
    validateFile(buffer, filename, mimeType, fileType);

    // Prüfe dass nur eine Verknüpfung gesetzt ist (optional)
    const attachments = [componentId, partId, packageId].filter(Boolean);
    if (attachments.length > 1) {
      throw new BadRequestError(
        'File can only be attached to one entity (component, part, or package)'
      );
    }

    // Dateinamen sanitieren
    const sanitizedName = sanitizeFilename(filename);

    // Bucket-Pfad generieren
    const bucketPath = generateBucketPath(fileType, sanitizedName);

    // Upload zu MinIO
    await uploadFile(bucketPath, buffer, {
      'Content-Type': mimeType,
      'X-Uploaded-By': userId,
    });

    // Metadaten in Datenbank speichern
    // WICHTIG: BUCKET_NAME ist ein Proxy-Objekt, daher muss es explizit in einen String konvertiert werden
    const fileAttachment = await prisma.fileAttachment.create({
      data: {
        originalName: filename,
        sanitizedName,
        mimeType,
        size: buffer.length,
        fileType,
        bucketName: BUCKET_NAME.toString(),
        bucketPath,
        uploadedById: userId,
        componentId: componentId || undefined,
        partId: partId || undefined,
        packageId: packageId || undefined,
        description: description || undefined,
        languages: languages || [],
      },
    });

    return fileAttachment;
  }

  /**
   * Lädt ein Datasheet hoch (Shortcut)
   * Sprachen sind Pflichtfeld (Mehrfachauswahl)
   */
  async uploadDatasheet(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options: {
      partId?: string;
      componentId?: string;
      languages: string[];  // Pflichtfeld - mindestens eine Sprache
      description?: string;
    }
  ): Promise<FileMetadata> {
    if (!options.languages || options.languages.length === 0) {
      throw new BadRequestError('At least one language must be specified for datasheets');
    }
    return this.uploadFile(buffer, filename, mimeType, {
      fileType: FileType.DATASHEET,
      userId,
      ...options,
    });
  }

  /**
   * Lädt ein Bild hoch (Shortcut)
   */
  async uploadImage(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options?: {
      partId?: string;
      componentId?: string;
      description?: string;
    }
  ): Promise<FileMetadata> {
    return this.uploadFile(buffer, filename, mimeType, {
      fileType: FileType.IMAGE,
      userId,
      ...options,
    });
  }

  /**
   * Lädt ein Pinout hoch (Shortcut)
   */
  async uploadPinout(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options?: {
      partId?: string;
      componentId?: string;
      description?: string;
    }
  ): Promise<FileMetadata> {
    return this.uploadFile(buffer, filename, mimeType, {
      fileType: FileType.PINOUT,
      userId,
      ...options,
    });
  }

  /**
   * Lädt ein 3D-Modell hoch (Shortcut)
   * Für Package-Gehäuse: .step, .stl, .3mf, etc.
   */
  async upload3DModel(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options: {
      packageId: string;
      description?: string;
    }
  ): Promise<FileMetadata> {
    return this.uploadFile(buffer, filename, mimeType, {
      fileType: FileType.MODEL_3D,
      userId,
      ...options,
    });
  }

  /**
   * Lädt eine sonstige Datei hoch (Shortcut)
   * Für Applikationshinweise, Zusatzdokumente, etc.
   * Sprachen sind optional (Mehrfachauswahl)
   */
  async uploadOther(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    userId: string,
    options?: {
      partId?: string;
      componentId?: string;
      description?: string;
      languages?: string[];  // Optional - Mehrfachauswahl
    }
  ): Promise<FileMetadata> {
    return this.uploadFile(buffer, filename, mimeType, {
      fileType: FileType.OTHER,
      userId,
      ...options,
    });
  }

  /**
   * Holt ein File-Attachment anhand der ID
   */
  async getFileById(id: string): Promise<FileMetadata | null> {
    const file = await prisma.fileAttachment.findUnique({
      where: { id, deletedAt: null },
    });

    return file;
  }

  /**
   * Generiert eine Presigned URL für den Download
   */
  async getDownloadUrl(
    id: string,
    expirySeconds: number = 24 * 60 * 60
  ): Promise<string> {
    const file = await this.getFileById(id);

    if (!file) {
      throw new NotFoundError('FileAttachment', id);
    }

    return getPresignedUrl(file.bucketPath, expirySeconds);
  }

  /**
   * Löscht eine Datei (Soft-Delete)
   * Nur der Uploader, Moderator oder Admin dürfen löschen
   */
  async deleteFile(id: string, userId: string, userRole: UserRole): Promise<void> {
    const file = await this.getFileById(id);

    if (!file) {
      throw new NotFoundError('FileAttachment', id);
    }

    // Berechtigungsprüfung
    const isOwner = file.uploadedById === userId;
    const isModerator = ['MODERATOR', 'ADMIN'].includes(userRole);

    if (!isOwner && !isModerator) {
      throw new ForbiddenError('You do not have permission to delete this file');
    }

    // Soft-Delete in Datenbank
    await prisma.fileAttachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Optional: Physisches Löschen aus MinIO
    // (Könnte in einem Cronjob erfolgen, um versehentliche Löschungen rückgängig zu machen)
    // await deleteFile(file.bucketPath);
  }

  /**
   * Holt alle Files eines Components
   */
  async getFilesByComponent(componentId: string): Promise<FileMetadata[]> {
    return prisma.fileAttachment.findMany({
      where: {
        componentId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Holt alle Files eines Parts
   */
  async getFilesByPart(partId: string): Promise<FileMetadata[]> {
    return prisma.fileAttachment.findMany({
      where: {
        partId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Holt alle Files eines Packages
   */
  async getFilesByPackage(packageId: string): Promise<FileMetadata[]> {
    return prisma.fileAttachment.findMany({
      where: {
        packageId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Holt alle Files eines Users
   */
  async getFilesByUser(userId: string): Promise<FileMetadata[]> {
    return prisma.fileAttachment.findMany({
      where: {
        uploadedById: userId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Holt Statistiken über File-Uploads
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    byFileType: Record<FileType, number>;
  }> {
    const files = await prisma.fileAttachment.findMany({
      where: { deletedAt: null },
      select: { size: true, fileType: true },
    });

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const byFileType: Record<FileType, number> = {
      DATASHEET: 0,
      IMAGE: 0,
      PINOUT: 0,
      MODEL_3D: 0,
      OTHER: 0,
    };

    files.forEach((file) => {
      byFileType[file.fileType]++;
    });

    return { totalFiles, totalSize, byFileType };
  }

  /**
   * Lädt ein Part-Bild hoch
   * KEINE FileAttachment wird erstellt - nur Upload und URL-Rückgabe
   * Es gibt nur ein Bild pro Part (wird bei neuem Upload überschrieben)
   */
  async uploadPartImage(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    partId: string
  ): Promise<{ imageUrl: string }> {
    // Validierung mit IMAGE-Limits
    validateFile(buffer, filename, mimeType, 'IMAGE', 'images');

    // Dateinamen sanitieren
    const sanitizedName = sanitizeFilename(filename);

    // Bucket-Pfad: images/parts/{partId}_{uuid}_{filename}
    const uuid = crypto.randomUUID();
    const bucketPath = `images/parts/${partId}_${uuid}_${sanitizedName}`;

    // Upload zu MinIO
    await uploadFile(bucketPath, buffer, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=604800', // 7 Tage
    });

    // Öffentliche URL generieren (7 Tage Gültigkeit)
    const imageUrl = await getPublicLogoUrl(bucketPath);

    return { imageUrl };
  }

  /**
   * Lädt ein Hersteller-Logo hoch
   * KEINE FileAttachment wird erstellt - nur Upload und URL-Rückgabe
   */
  async uploadManufacturerLogo(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    manufacturerId: string
  ): Promise<{ logoUrl: string }> {
    // Validierung mit LOGO-Limits
    validateFile(buffer, filename, mimeType, 'LOGO', 'logos');

    // Dateinamen sanitieren
    const sanitizedName = sanitizeFilename(filename);

    // Bucket-Pfad: logos/manufacturers/{manufacturerId}_{uuid}_{filename}
    const uuid = crypto.randomUUID();
    const bucketPath = `logos/manufacturers/${manufacturerId}_${uuid}_${sanitizedName}`;

    // Upload zu MinIO
    await uploadFile(bucketPath, buffer, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=604800', // 7 Tage
    });

    // Öffentliche URL generieren (7 Tage Gültigkeit)
    const logoUrl = await getPublicLogoUrl(bucketPath);

    return { logoUrl };
  }

  /**
   * Lädt ein Kategorie-Icon hoch
   * KEINE FileAttachment wird erstellt - nur Upload und URL-Rückgabe
   */
  async uploadCategoryIcon(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    categoryId: string
  ): Promise<{ iconUrl: string }> {
    // Validierung mit LOGO-Limits (gleiche wie bei Logos)
    validateFile(buffer, filename, mimeType, 'LOGO', 'icons');

    // Dateinamen sanitieren
    const sanitizedName = sanitizeFilename(filename);

    // Bucket-Pfad: images/categories/{categoryId}_{uuid}_{filename}
    const uuid = crypto.randomUUID();
    const bucketPath = `images/categories/${categoryId}_${uuid}_${sanitizedName}`;

    // Upload zu MinIO
    await uploadFile(bucketPath, buffer, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=604800', // 7 Tage
    });

    // Öffentliche URL generieren (7 Tage Gültigkeit)
    const iconUrl = await getPublicLogoUrl(bucketPath);

    return { iconUrl };
  }
}

export const fileService = new FileService();
