/**
 * URL-Helpers - Gemeinsame URL-Transformationen für API-Responses
 */

/**
 * Basis-URL der API aus Environment oder Default
 */
export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

/**
 * MIME-Type Mapping für Bild-Dateien
 */
export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

/**
 * Ermittelt den Content-Type anhand der Dateiendung
 * @param filename Dateiname oder Pfad
 * @param fallback Standard-Content-Type wenn nicht erkannt
 */
export function getImageContentType(filename: string, fallback = 'image/png'): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext && IMAGE_CONTENT_TYPES[ext] ? IMAGE_CONTENT_TYPES[ext] : fallback;
}

/**
 * Transformiert eine MinIO-URL in eine API-Proxy-URL für Hersteller-Logos
 * @param manufacturerId UUID des Herstellers
 * @param logoUrl Originale MinIO-URL (oder null)
 */
export function getManufacturerLogoProxyUrl(manufacturerId: string, logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  return `${API_BASE_URL}/manufacturers/${manufacturerId}/logo`;
}

/**
 * Transformiert Hersteller-Daten mit Proxy-URLs für Logos
 */
export function transformManufacturerLogoUrl<T extends { id: string; logoUrl: string | null }>(
  manufacturer: T
): T {
  return {
    ...manufacturer,
    logoUrl: getManufacturerLogoProxyUrl(manufacturer.id, manufacturer.logoUrl),
  };
}

/**
 * Transformiert ein Array von Herstellern mit Proxy-URLs
 */
export function transformManufacturerLogoUrls<T extends { id: string; logoUrl: string | null }>(
  manufacturers: T[]
): T[] {
  return manufacturers.map(transformManufacturerLogoUrl);
}
