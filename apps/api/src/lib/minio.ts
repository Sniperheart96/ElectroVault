/**
 * MinIO Client Setup - S3-kompatible Datei-Speicherung
 */

import * as Minio from 'minio';
import { ApiError } from './errors';

// Umgebungsvariablen mit Fallbacks
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'electrovault-files';

/**
 * MinIO Client Instance (Singleton)
 */
export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

/**
 * Bucket-Name für ElectroVault
 */
export const BUCKET_NAME = MINIO_BUCKET;

/**
 * Prüft ob der Bucket existiert, erstellt ihn falls nicht
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);

    if (!exists) {
      console.log(`[MinIO] Creating bucket: ${BUCKET_NAME}`);
      await minioClient.makeBucket(BUCKET_NAME, 'eu-west-1');
      console.log(`[MinIO] Bucket created successfully: ${BUCKET_NAME}`);
    } else {
      console.log(`[MinIO] Bucket already exists: ${BUCKET_NAME}`);
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
    return await minioClient.presignedGetObject(
      BUCKET_NAME,
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
    await minioClient.putObject(
      BUCKET_NAME,
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
    await minioClient.removeObject(BUCKET_NAME, bucketPath);
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
 * Prüft ob eine Datei existiert
 * @param bucketPath - Pfad im Bucket
 */
export async function fileExists(bucketPath: string): Promise<boolean> {
  try {
    await minioClient.statObject(BUCKET_NAME, bucketPath);
    return true;
  } catch (error: any) {
    if (error.code === 'NotFound') {
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
    return await minioClient.statObject(BUCKET_NAME, bucketPath);
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
