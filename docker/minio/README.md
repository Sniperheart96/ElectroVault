# MinIO Konfiguration für ElectroVault

## Bucket: electrovault-files

### Verwendung

MinIO wird als S3-kompatible Object Storage-Lösung für folgende Dateitypen verwendet:

- **Datenblätter** (PDF, DOC)
- **Bauteil-Bilder** (JPG, PNG, WEBP)
- **ECAD-Dateien** (KiCad, Eagle, Altium, STEP)
- **Schaltpläne** (PDF, SVG)
- **3D-Modelle** (STEP, STL)

## Setup

### Auf ITME-SERVER (Nativ)

MinIO läuft bereits als Windows-Dienst:

```powershell
# Status prüfen
Get-Service minio

# Bucket erstellen (PowerShell mit MinIO Client)
mc alias set local http://ITME-SERVER:9000 minioadmin <password>
mc mb local/electrovault-files
mc anonymous set download local/electrovault-files
```

### Mit Docker (Lokal)

```bash
# MinIO mit Docker starten
docker-compose --profile local-dev up -d minio minio-init

# Bucket wird automatisch erstellt durch minio-init Container
```

### Manuell über Web-Console

1. MinIO Console öffnen: http://ITME-SERVER:9001
2. Login: `minioadmin` / `<password>`
3. Buckets → Create Bucket
4. Name: `electrovault-files`
5. Versioning: Enabled (empfohlen)
6. Object Locking: Optional

## Bucket-Struktur

```
electrovault-files/
├── datasheets/
│   ├── <manufacturer-id>/
│   │   └── <part-id>/
│   │       └── <filename>.pdf
├── images/
│   ├── parts/
│   │   └── <part-id>/
│   │       ├── original/
│   │       │   └── <filename>.jpg
│   │       └── thumbnails/
│   │           └── <filename>_thumb.jpg
│   └── packages/
│       └── <package-id>/
│           └── <filename>.png
├── ecad/
│   ├── footprints/
│   │   └── <package-id>/
│   │       └── <footprint-name>.<format>
│   ├── symbols/
│   │   └── <part-id>/
│   │       └── <symbol-name>.<format>
│   └── 3d/
│       └── <part-id>/
│           └── <model-name>.step
└── schematics/
    └── <device-id>/
        ├── pages/
        │   └── page-<n>.pdf
        └── assembly/
            └── <assembly-id>/
                └── <schematic>.svg
```

## Umgebungsvariablen

In `.env.local`:

```bash
# MinIO S3-kompatible API
MINIO_ENDPOINT=ITME-SERVER
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<dein-secret-key>
MINIO_BUCKET=electrovault-files

# Public URL für Datei-Links
MINIO_PUBLIC_URL=http://ITME-SERVER:9000
```

## Bucket-Policy (Public Read)

Für öffentlichen Lesezugriff auf Dateien:

```bash
mc policy set download local/electrovault-files
```

Oder über Web-Console:
1. Bucket auswählen
2. Manage → Access Policy
3. Policy: `download` (public read)

## Lifecycle-Rules (Optional)

Automatische Bereinigung von alten Versionen:

```bash
# Alte Versionen nach 90 Tagen löschen
mc ilm add local/electrovault-files \
  --noncurrent-expire-days 90
```

## Integration mit Prisma

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: 'us-east-1', // MinIO ignoriert Region, aber SDK erwartet sie
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Wichtig für MinIO!
});

// Datei hochladen
async function uploadFile(file: Buffer, key: string) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
      Body: file,
    })
  );

  return `${process.env.MINIO_PUBLIC_URL}/${process.env.MINIO_BUCKET}/${key}`;
}
```

## Datei-URLs

Öffentliche Dateien (mit `download` policy):

```
http://ITME-SERVER:9000/electrovault-files/datasheets/<path>
```

Private Dateien (Presigned URLs):

```typescript
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const url = await getSignedUrl(
  s3Client,
  new GetObjectCommand({
    Bucket: 'electrovault-files',
    Key: 'datasheets/private/file.pdf',
  }),
  { expiresIn: 3600 } // 1 Stunde
);
```

## Backup-Strategie

```bash
# Mirror zu Backup-Location
mc mirror local/electrovault-files /backup/electrovault-files

# Oder zu externem S3
mc mirror local/electrovault-files s3/backup-bucket/electrovault
```

## Troubleshooting

### "Connection refused"

Prüfe ob MinIO läuft:

```bash
# Windows (PowerShell)
Get-Service minio

# Docker
docker ps | grep minio
```

### "Access Denied"

Prüfe Access Key und Secret Key in `.env.local`

### Bucket nicht gefunden

```bash
# Alle Buckets anzeigen
mc ls local/

# Bucket erstellen
mc mb local/electrovault-files
```

## Next Steps

1. MinIO Access Keys in `.env.local` eintragen
2. S3 Client in Backend integrieren
3. File Upload API-Endpoint erstellen
4. File Upload UI-Komponente erstellen
5. Backup-Strategie implementieren
