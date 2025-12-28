# File Upload API Documentation

## Übersicht

Die File-Upload-Infrastruktur ermöglicht das Hochladen, Verwalten und Abrufen von Dateien für ElectroVault. Dateien werden in MinIO (S3-kompatibel) gespeichert und Metadaten in PostgreSQL.

## Unterstützte Dateitypen

| FileType | Erlaubte Formate | Max. Größe | Beschreibung |
|----------|------------------|------------|--------------|
| DATASHEET | PDF | 50 MB | Datenblätter von Herstellern |
| IMAGE | JPG, PNG, WebP | 10 MB | Produktfotos, Diagramme |
| PINOUT | JPG, PNG, WebP, PDF | 10 MB | Pin-Belegungsdiagramme |
| OTHER | Alle | 50 MB | Sonstige Dateien |

## API Endpunkte

### Upload

#### POST `/api/v1/files/datasheet`
Upload eines Datasheets (PDF).

**Authentifizierung:** Erforderlich (CONTRIBUTOR+)

**Content-Type:** `multipart/form-data`

**Felder:**
- `file` (required): PDF-Datei
- `partId` (optional): UUID des ManufacturerPart
- `componentId` (optional): UUID des CoreComponent
- `version` (optional): Version des Datasheets (z.B. "Rev. 3")
- `language` (optional): Sprache (z.B. "de", "en")
- `description` (optional): Beschreibung

**Beispiel (curl):**
```bash
curl -X POST http://localhost:3001/api/v1/files/datasheet \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@datasheet.pdf" \
  -F "partId=123e4567-e89b-12d3-a456-426614174000" \
  -F "version=Rev. 3" \
  -F "language=en"
```

**Response (201):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "datasheet.pdf",
    "sanitizedName": "datasheet.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    "fileType": "DATASHEET",
    "bucketName": "electrovault-files",
    "bucketPath": "datasheet/2025/12/550e8400-e29b-41d4-a716-446655440000_datasheet.pdf",
    "version": "Rev. 3",
    "language": "en",
    "partId": "123e4567-e89b-12d3-a456-426614174000",
    "componentId": null,
    "uploadedById": "user-uuid",
    "createdAt": "2025-12-28T12:00:00.000Z",
    "updatedAt": "2025-12-28T12:00:00.000Z"
  }
}
```

#### POST `/api/v1/files/image`
Upload eines Bildes.

**Felder:**
- `file` (required): JPG/PNG/WebP-Datei
- `partId` (optional): UUID
- `componentId` (optional): UUID
- `description` (optional): Beschreibung

#### POST `/api/v1/files/pinout`
Upload eines Pinout-Diagramms.

**Felder:**
- `file` (required): JPG/PNG/WebP/PDF-Datei
- `partId` (optional): UUID
- `componentId` (optional): UUID
- `description` (optional): Beschreibung

### Retrieval

#### GET `/api/v1/files/:id`
Holt die Metadaten einer Datei.

**Authentifizierung:** Nicht erforderlich

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "datasheet.pdf",
    "mimeType": "application/pdf",
    "size": 1048576,
    ...
  }
}
```

#### GET `/api/v1/files/:id/download`
Generiert eine Presigned URL für den Download.

**Authentifizierung:** Nicht erforderlich

**Response (200):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://minio.example.com/electrovault-files/datasheet/...?X-Amz-...",
    "expiresIn": 86400
  }
}
```

Die URL ist 24 Stunden gültig.

#### GET `/api/v1/files/component/:componentId`
Holt alle Files eines Components.

#### GET `/api/v1/files/part/:partId`
Holt alle Files eines Parts.

### Deletion

#### DELETE `/api/v1/files/:id`
Löscht eine Datei (Soft-Delete).

**Authentifizierung:** Erforderlich (CONTRIBUTOR+)

**Berechtigung:**
- Uploader des Files
- Moderator
- Admin

**Response (204):** No Content

### Statistics

#### GET `/api/v1/files/stats`
Holt Statistiken über File-Uploads (Admin-only).

**Authentifizierung:** Erforderlich (ADMIN)

**Response (200):**
```json
{
  "data": {
    "totalFiles": 1234,
    "totalSize": 123456789,
    "byFileType": {
      "DATASHEET": 800,
      "IMAGE": 350,
      "PINOUT": 70,
      "OTHER": 14
    }
  }
}
```

## Validierung

### Dateiname-Sanitisierung
Dateinamen werden automatisch bereinigt:
- Nur alphanumerische Zeichen, Bindestriche und Unterstriche
- Max. 100 Zeichen (ohne Erweiterung)
- Erweiterung bleibt erhalten

Beispiel:
- Input: `NE555 (Rev. 3) [Official].pdf`
- Output: `NE555-Rev-3-Official.pdf`

### Bucket-Pfad
Dateien werden strukturiert gespeichert:
```
{fileType}/{year}/{month}/{uuid}_{sanitized-filename}
```

Beispiel:
```
datasheet/2025/12/550e8400-e29b-41d4-a716-446655440000_NE555-Rev-3.pdf
```

### Fehlerbehandlung

| Status Code | Error Code | Beschreibung |
|-------------|------------|--------------|
| 400 | BAD_REQUEST | Keine Datei hochgeladen |
| 400 | VALIDATION_ERROR | Dateigröße oder Format ungültig |
| 401 | UNAUTHORIZED | Nicht authentifiziert |
| 403 | FORBIDDEN | Keine Berechtigung zum Löschen |
| 404 | NOT_FOUND | Datei nicht gefunden |
| 500 | UPLOAD_ERROR | Upload zu MinIO fehlgeschlagen |
| 500 | PRESIGNED_URL_ERROR | URL-Generierung fehlgeschlagen |

## MinIO-Konfiguration

Umgebungsvariablen (in `.env`):

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=electrovault-files
```

## Sicherheit

1. **Authentifizierung:** Alle Upload/Delete-Operationen erfordern einen gültigen JWT
2. **Autorisierung:** Rollenbasierte Zugriffssteuerung (RBAC)
3. **Dateivalidierung:** Größe, MIME-Type, Erweiterung werden geprüft
4. **Presigned URLs:** Downloads erfolgen über zeitlich begrenzte URLs
5. **Soft-Delete:** Dateien werden nicht sofort physisch gelöscht

## Best Practices

1. **Datasheets immer mit Version hochladen** - Erleichtert Tracking
2. **Language-Tag setzen** - Für mehrsprachige Datasheets
3. **Bilder komprimieren** - Vor dem Upload optimieren
4. **Beschreibung hinzufügen** - Für bessere Auffindbarkeit
5. **Part/Component-Verknüpfung** - Mindestens eine angeben

## TODO / Erweiterungen

- [ ] Thumbnail-Generierung für Bilder
- [ ] OCR für PDF-Datasheets (Volltext-Suche)
- [ ] Virenscanner-Integration
- [ ] Bildkomprimierung (Server-seitig)
- [ ] Batch-Upload
- [ ] Physisches Löschen per Cronjob (Soft-Deleted Files nach 30 Tagen)
