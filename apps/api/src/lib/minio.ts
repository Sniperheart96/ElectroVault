/**
 * MinIO Client Setup - S3-kompatible Datei-Speicherung
 *
 * Lazy Initialization: Der Client wird erst beim ersten Aufruf initialisiert,
 * nachdem dotenv die Umgebungsvariablen geladen hat.
 */

import * as Minio from 'minio';
import { ApiError } from './errors.js';

// Lazy-initialized client
let _minioClient: Minio.Client | null = null;
let _bucketName: string | null = null;

/**
 * Holt oder initialisiert den MinIO Client (Singleton)
 * Wirft einen Fehler wenn die Credentials nicht gesetzt sind.
 */
function getMinioClient(): Minio.Client {
  if (_minioClient) {
    return _minioClient;
  }

  // Credentials MÜSSEN als Umgebungsvariablen gesetzt sein
  if (!process.env.MINIO_ACCESS_KEY) {
    throw new Error('MINIO_ACCESS_KEY environment variable is required');
  }
  if (!process.env.MINIO_SECRET_KEY) {
    throw new Error('MINIO_SECRET_KEY environment variable is required');
  }

  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = parseInt(process.env.MINIO_PORT || '9000', 10);
  const useSSL = process.env.MINIO_USE_SSL === 'true';

  _minioClient = new Minio.Client({
    endPoint: endpoint,
    port: port,
    useSSL: useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
  });

  _bucketName = process.env.MINIO_BUCKET || 'electrovault-files';

  console.log(`[MinIO] Client initialized: ${endpoint}:${port} (SSL: ${useSSL})`);

  return _minioClient;
}

/**
 * Holt den Bucket-Namen
 */
function getBucketName(): string {
  if (!_bucketName) {
    // Initialisiere Client um Bucket-Namen zu setzen
    getMinioClient();
  }
  return _bucketName!;
}

/**
 * Für Abwärtskompatibilität: Exportiert den Client (lazy)
 */
export const minioClient = new Proxy({} as Minio.Client, {
  get(_target, prop) {
    return (getMinioClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Bucket-Name für ElectroVault
 */
export const BUCKET_NAME = new Proxy({ value: '' }, {
  get(_target, prop) {
    if (prop === 'toString' || prop === Symbol.toPrimitive) {
      return () => getBucketName();
    }
    return getBucketName();
  },
}) as unknown as string;

/**
 * Prüft ob der Bucket existiert, erstellt ihn falls nicht
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    const client = getMinioClient();
    const bucket = getBucketName();
    const exists = await client.bucketExists(bucket);

    if (!exists) {
      console.log(`[MinIO] Creating bucket: ${bucket}`);
      await client.makeBucket(bucket, 'eu-west-1');
      console.log(`[MinIO] Bucket created successfully: ${bucket}`);
    } else {
      console.log(`[MinIO] Bucket already exists: ${bucket}`);
    }
  } catch (error) {
    console.error(`[MinIO] Failed to ensure bucket exists:`, error);
    throw new ApiError(
      'Failed to initialize file storage',
      'STORAGE_INIT_ERROR',
      500,
      error
    );
  }
}

/**
 * Generiert eine Presigned URL für den Download
 * @param bucketPath - Pfad im Bucket
 * @param expirySeconds - Gültigkeitsdauer in Sekunden (default: 24h)
 */
export async function getPresignedUrl(
  bucketPath: string,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> {
  try {
    return await getMinioClient().presignedGetObject(
      getBucketName(),
      bucketPath,
      expirySeconds
    );
  } catch (error) {
    console.error(`[MinIO] Failed to generate presigned URL:`, error);
    throw new ApiError(
      'Failed to generate download URL',
      'PRESIGNED_URL_ERROR',
      500,
      error
    );
  }
}

/**
 * Lädt eine Datei in MinIO hoch
 * @param bucketPath - Ziel-Pfad im Bucket
 * @param buffer - Datei-Inhalt als Buffer
 * @param metadata - Optionale Metadaten
 */
export async function uploadFile(
  bucketPath: string,
  buffer: Buffer,
  metadata?: Minio.ItemBucketMetadata
): Promise<void> {
  try {
    await getMinioClient().putObject(
      getBucketName(),
      bucketPath,
      buffer,
      buffer.length,
      metadata
    );
  } catch (error) {
    console.error(`[MinIO] Failed to upload file:`, error);
    throw new ApiError(
      'Failed to upload file to storage',
      'UPLOAD_ERROR',
      500,
      error
    );
  }
}

/**
 * Löscht eine Datei aus MinIO
 * @param bucketPath - Pfad im Bucket
 */
export async function deleteFile(bucketPath: string): Promise<void> {
  try {
    await getMinioClient().removeObject(getBucketName(), bucketPath);
  } catch (error) {
    console.error(`[MinIO] Failed to delete file:`, error);
    throw new ApiError(
      'Failed to delete file from storage',
      'DELETE_ERROR',
      500,
      error
    );
  }
}

/**
 * Type Guard für MinIO Errors
 */
function isMinioError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

/**
 * Prüft ob eine Datei existiert
 * @param bucketPath - Pfad im Bucket
 */
export async function fileExists(bucketPath: string): Promise<boolean> {
  try {
    await getMinioClient().statObject(getBucketName(), bucketPath);
    return true;
  } catch (error: unknown) {
    if (isMinioError(error) && error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
}

/**
 * Holt die Metadaten einer Datei
 * @param bucketPath - Pfad im Bucket
 */
export async function getFileMetadata(
  bucketPath: string
): Promise<Minio.BucketItemStat> {
  try {
    return await getMinioClient().statObject(getBucketName(), bucketPath);
  } catch (error) {
    console.error(`[MinIO] Failed to get file metadata:`, error);
    throw new ApiError(
      'Failed to get file metadata',
      'METADATA_ERROR',
      500,
      error
    );
  }
}
