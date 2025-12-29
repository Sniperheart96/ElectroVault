# Backend Helper-Funktionen

Zentrale Hilfsfunktionen und Utilities für die ElectroVault API.

## Übersicht

Die Helper-Module befinden sich in `apps/api/src/lib/` und stellen wiederverwendbare Funktionen für häufige Aufgaben bereit.

| Modul | Datei | Beschreibung |
|-------|-------|--------------|
| **MinIO** | `minio.ts` | S3-kompatible Dateispeicherung und Presigned URLs |
| **URL Helpers** | `url-helpers.ts` | URL-Transformationen für API-Responses |
| **Error Classes** | `errors.ts` | Typisierte Custom Error-Klassen |
| **Slug** | `slug.ts` | URL-freundliche Identifier generieren |
| **Pagination** | `pagination.ts` | Paginierungs-Hilfsfunktionen |
| **JSON Helpers** | `json-helpers.ts` | Prisma JSON-Feld Konvertierungen |

**Hinweis:** MinIO-Funktionen werden direkt aus `apps/api/src/lib/minio.ts` importiert, alle anderen Module werden über `apps/api/src/lib/index.ts` zentral exportiert.

---

## MinIO-Integration

**Import:** `import { ... } from '../lib/minio';` (direkter Import, NICHT über lib/index.ts)

### Architektur

**Lazy Initialization Pattern** - Der MinIO Client wird erst beim ersten Zugriff initialisiert, nachdem `dotenv` die Umgebungsvariablen geladen hat.

```typescript
// Singleton mit Lazy Init
let _minioClient: Minio.Client | null = null;
let _bucketName: string | null = null;

// Proxy für Abwärtskompatibilität
export const minioClient = new Proxy({} as Minio.Client, {
  get(_target, prop) {
    return (getMinioClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Bucket-Name ist ebenfalls ein Proxy
export const BUCKET_NAME = new Proxy({ value: '' }, {
  get(_target, prop) {
    if (prop === 'toString' || prop === Symbol.toPrimitive) {
      return () => getBucketName();
    }
    return getBucketName();
  },
}) as unknown as string;
```

### Umgebungsvariablen

| Variable | Pflicht | Default | Beschreibung |
|----------|---------|---------|--------------|
| `MINIO_ACCESS_KEY` | ✅ | - | Access Key (wirft Error wenn nicht gesetzt) |
| `MINIO_SECRET_KEY` | ✅ | - | Secret Key (wirft Error wenn nicht gesetzt) |
| `MINIO_ENDPOINT` | ❌ | `localhost` | Server-Hostname |
| `MINIO_PORT` | ❌ | `9000` | Server-Port |
| `MINIO_USE_SSL` | ❌ | `false` | SSL aktivieren (`'true'` oder `'false'`) |
| `MINIO_BUCKET` | ❌ | `electrovault-files` | Bucket-Name |
| `MINIO_PUBLIC_ENDPOINT` | ❌ | - | Öffentlicher Endpoint für Presigned URLs (z.B. `192.168.30.173:9000`) |

**Lazy Initialization:** Der Client wird erst beim ersten Funktionsaufruf initialisiert, wenn die ENV-Variablen verfügbar sind.

### Funktionen

#### `ensureBucketExists()`

Prüft ob der Bucket existiert und erstellt ihn falls nötig.

```typescript
import { ensureBucketExists } from '../lib/minio';

await ensureBucketExists();
// Console: [MinIO] Client initialized: localhost:9000 (SSL: false)
// Console: [MinIO] Bucket already exists: electrovault-files
```

**Wirft:** `ApiError` mit Code `STORAGE_INIT_ERROR` bei Fehlern.

#### `uploadFile(bucketPath, buffer, metadata?)`

Lädt eine Datei in MinIO hoch.

```typescript
import { uploadFile } from '../lib/minio';

await uploadFile(
  'manufacturers/logos/12345.png',
  buffer,
  { 'Content-Type': 'image/png' }
);
```

**Parameter:**
- `bucketPath` - Ziel-Pfad im Bucket
- `buffer` - Datei-Inhalt als Buffer
- `metadata` - Optionale Metadaten (z.B. Content-Type)

**Wirft:** `ApiError` mit Code `UPLOAD_ERROR`

#### `getPresignedUrl(bucketPath, expirySeconds?)`

Generiert eine temporäre Download-URL.

```typescript
import { getPresignedUrl } from '../lib/minio';

const url = await getPresignedUrl('manufacturers/logos/12345.png', 3600);
// http://localhost:9000/electrovault-files/manufacturers/logos/12345.png?X-Amz-...
// (oder mit MINIO_PUBLIC_ENDPOINT: http://192.168.30.173:9000/...)
```

**Parameter:**
- `bucketPath` - Pfad im Bucket
- `expirySeconds` - Gültigkeitsdauer in Sekunden (default: 24h = 86400)

**Features:**
- Automatische URL-Transformation wenn `MINIO_PUBLIC_ENDPOINT` gesetzt ist
- Ersetzt internen Endpoint (`localhost:9000`) mit öffentlichem Endpoint

**Wirft:** `ApiError` mit Code `PRESIGNED_URL_ERROR`

#### `getPublicLogoUrl(bucketPath)`

Spezialfunktion für Hersteller-Logos mit 7 Tagen Gültigkeit.

```typescript
import { getPublicLogoUrl } from '../lib/minio';

const logoUrl = await getPublicLogoUrl('manufacturers/logos/12345.png');
// 7 Tage Gültigkeit (604800 Sekunden)
```

#### `deleteFile(bucketPath)`

Löscht eine Datei aus MinIO.

```typescript
import { deleteFile } from '../lib/minio';

await deleteFile('manufacturers/logos/old-logo.png');
```

**Wirft:** `ApiError` mit Code `DELETE_ERROR`

#### `fileExists(bucketPath)`

Prüft ob eine Datei existiert.

```typescript
import { fileExists } from '../lib/minio';

const exists = await fileExists('manufacturers/logos/12345.png');
// true oder false
```

**Implementation:** Nutzt `statObject()` und fängt `NotFound` Fehler ab (Type Guard `isMinioError`).

#### `getFileMetadata(bucketPath)`

Holt die Metadaten einer Datei.

```typescript
import { getFileMetadata } from '../lib/minio';

const stat = await getFileMetadata('manufacturers/logos/12345.png');
// { size: 12345, etag: '...', lastModified: Date, metaData: {...}, ... }
```

**Rückgabe:** `Minio.BucketItemStat` mit Size, ETag, LastModified, MetaData, etc.

**Wirft:** `ApiError` mit Code `METADATA_ERROR`

---

## URL Helpers

### Konstanten

```typescript
// MIME-Type Mapping
export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};
```

### Funktionen

#### `getApiBaseUrl()`

Gibt die API-Basis-URL aus der Umgebungsvariable `API_BASE_URL` zurück.

```typescript
const baseUrl = getApiBaseUrl();
// z.B. 'http://192.168.178.80:3001/api/v1'
```

**Wichtig:** Die Variable `API_BASE_URL` muss in `apps/api/.env` gesetzt sein. Bei fehlender Konfiguration wird ein Fehler geworfen.

**Wirft:** `Error` wenn `API_BASE_URL` nicht gesetzt ist

#### `getImageContentType(filename, fallback?)`

Ermittelt den Content-Type anhand der Dateiendung.

```typescript
getImageContentType('logo.png');          // 'image/png'
getImageContentType('photo.jpg');         // 'image/jpeg'
getImageContentType('unknown.xyz');       // 'image/png' (default)
getImageContentType('file', 'image/svg'); // 'image/svg' (custom)
```

**Parameter:**
- `filename` - Dateiname oder Pfad
- `fallback` - Default Content-Type (default: `'image/png'`)

#### `getManufacturerLogoProxyUrl(manufacturerId, logoUrl)`

Transformiert eine MinIO-URL in eine API-Proxy-URL für Hersteller-Logos.

```typescript
const proxyUrl = getManufacturerLogoProxyUrl(
  '12345-...',
  'https://minio:9000/electrovault-files/manufacturers/logos/12345.png?X-Amz-...'
);
// '{API_BASE_URL}/manufacturers/12345-.../logo'
```

**Verwendung:** API-Route `/manufacturers/:id/logo` holt die Datei von MinIO und liefert sie aus.

**Vorteile:**
- Versteckt MinIO-URLs vor dem Client
- Einheitliche API-basierte URLs
- Einfachere URL-Struktur für Frontend

#### `transformManufacturerLogoUrl(manufacturer)`

Transformiert ein einzelnes Hersteller-Objekt mit Proxy-URL.

```typescript
const manufacturer = {
  id: '12345',
  name: 'Texas Instruments',
  logoUrl: 'https://minio:9000/...',
};

const transformed = transformManufacturerLogoUrl(manufacturer);
// { ...manufacturer, logoUrl: '{API_BASE_URL}/manufacturers/12345/logo' }
```

#### `transformManufacturerLogoUrls(manufacturers)`

Transformiert ein Array von Herstellern.

```typescript
const manufacturers = await db.manufacturer.findMany();
const withProxyUrls = transformManufacturerLogoUrls(manufacturers);
```

---

## Error Classes

Typisierte Custom Error-Klassen für konsistente Fehlerbehandlung.

### Basis-Klasse: `ApiError`

```typescript
class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;
}
```

**Constructor:**
```typescript
new ApiError(
  'Resource not found',
  'NOT_FOUND',
  404,
  { resource: 'Component', id: '123' }
);
```

**Properties:**
- `message` - Fehlermeldung (von Error)
- `code` - Error-Code (z.B. `'NOT_FOUND'`)
- `statusCode` - HTTP-Statuscode
- `details` - Zusätzliche Details (optional)

### Spezifische Error-Klassen

#### `NotFoundError`

404 Not Found - Ressource nicht gefunden.

```typescript
throw new NotFoundError('Component', '12345');
// "Component with identifier '12345' not found"
// Code: 'NOT_FOUND', Status: 404
```

#### `ConflictError`

409 Conflict - Duplikat oder Konflikt.

```typescript
throw new ConflictError(
  'Slug already exists',
  { slug: 'ne555', existingId: '...' }
);
// Code: 'CONFLICT', Status: 409
```

#### `BadRequestError`

400 Bad Request - Ungültige Anfrage.

```typescript
throw new BadRequestError(
  'Invalid file format',
  { allowedFormats: ['png', 'jpg'] }
);
// Code: 'BAD_REQUEST', Status: 400
```

#### `ForbiddenError`

403 Forbidden - Zugriff verweigert.

```typescript
throw new ForbiddenError('Only moderators can approve submissions');
// Code: 'FORBIDDEN', Status: 403
```

#### `ValidationError`

422 Unprocessable Entity - Validierungsfehler.

```typescript
throw new ValidationError(
  'Invalid input',
  { field: 'email', message: 'Invalid email format' }
);
// Code: 'VALIDATION_ERROR', Status: 422
```

### Type Guard

```typescript
function isApiError(error: unknown): error is ApiError
```

Prüft ob ein Fehler eine `ApiError`-Instanz ist.

```typescript
try {
  // ...
} catch (error) {
  if (isApiError(error)) {
    console.log(error.code, error.statusCode, error.details);
  }
}
```

---

## Slug-Generierung

URL-freundliche Identifier aus Texten erstellen.

### `generateSlug(text)`

Generiert einen URL-freundlichen Slug.

```typescript
generateSlug('NE555 Timer');              // 'ne555-timer'
generateSlug('Elektrolyt-Kondensator');   // 'elektrolyt-kondensator'
generateSlug('Müller & Söhne GmbH');      // 'mueller-soehne-gmbh'
```

**Transformationen:**
1. Lowercase
2. Trim
3. Deutsche Umlaute ersetzen (`ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`)
4. Akzente entfernen (NFD-Normalisierung)
5. Nicht-alphanumerische Zeichen → `-`
6. Mehrfache `-` reduzieren
7. Führende/folgende `-` entfernen

### `generateUniqueSlug(baseSlug, existingSlugs)`

Generiert einen einzigartigen Slug mit Suffix falls nötig.

```typescript
generateUniqueSlug('ne555', ['ne555', 'ne555-1']);
// 'ne555-2'

generateUniqueSlug('capacitor', []);
// 'capacitor' (kein Konflikt)
```

**Verwendung:**
```typescript
const baseSlug = generateSlug(name);
const existingSlugs = await db.component.findMany({
  where: { slug: { startsWith: baseSlug } },
  select: { slug: true }
}).then(r => r.map(x => x.slug));

const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);
```

### `getSlugSourceText(localizedString)`

Extrahiert den primären Text aus einem `LocalizedString` für die Slug-Generierung.

```typescript
getSlugSourceText({ de: 'Kondensator', en: 'Capacitor' });
// 'Capacitor' (Englisch hat Priorität)

getSlugSourceText({ de: 'Widerstand' });
// 'Widerstand' (nur Deutsch vorhanden)

getSlugSourceText({ fr: 'Résistance', es: 'Resistencia' });
// 'Résistance' (erster verfügbarer Wert)
```

**Priorität:** `en` > `de` > erster verfügbarer Wert

**Verwendung:**
```typescript
const name = { de: 'NE555 Timer', en: '555 Timer IC' };
const slug = generateSlug(getSlugSourceText(name));
// '555-timer-ic'
```

---

## Pagination

Hilfsfunktionen für Paginierung mit Prisma.

### `getPrismaOffsets(pagination)`

Konvertiert Page/Limit in Prisma `skip`/`take`.

```typescript
import type { PaginationInput } from '@electrovault/schemas';

const pagination: PaginationInput = { page: 2, limit: 20 };
const offsets = getPrismaOffsets(pagination);
// { skip: 20, take: 20 }

// Verwendung
const results = await db.component.findMany({
  ...offsets,
  where: { ... }
});
```

**Formel:** `skip = (page - 1) * limit`

### `createPaginationMeta(page, limit, total)`

Erstellt Pagination-Metadaten für die Response.

```typescript
const meta = createPaginationMeta(2, 20, 85);
// {
//   page: 2,
//   limit: 20,
//   total: 85,
//   totalPages: 5
// }
```

**Formel:** `totalPages = Math.ceil(total / limit)`

### `createPaginatedResponse(data, page, limit, total)`

Erstellt eine vollständige paginierte Response.

```typescript
const components = await db.component.findMany({ ... });
const total = await db.component.count({ ... });

const response = createPaginatedResponse(components, 1, 20, total);
// {
//   data: [...],
//   pagination: {
//     page: 1,
//     limit: 20,
//     total: 85,
//     totalPages: 5
//   }
// }
```

**Verwendung in Routes:**
```typescript
app.get('/api/v1/components', async (request, reply) => {
  const { page, limit } = request.query;
  const offsets = getPrismaOffsets({ page, limit });

  const [data, total] = await Promise.all([
    db.component.findMany({ ...offsets }),
    db.component.count()
  ]);

  return createPaginatedResponse(data, page, limit, total);
});
```

---

## JSON Helpers

Konvertierung von `LocalizedString` für Prisma JSON-Felder.

### Problem: Prisma JSON-Felder

Prisma behandelt JSON-Felder besonders:

| JavaScript-Wert | Prisma-Wert | Bedeutung |
|-----------------|-------------|-----------|
| `null` | `Prisma.JsonNull` | Speichert `NULL` in Datenbank |
| `undefined` | `undefined` | Feld wird nicht verändert (bei Updates) |
| `{}` | `{}` | Speichert leeres JSON-Objekt |
| `{ de: '...' }` | `{ de: '...' }` | Speichert JSON-Daten |

### `toJsonValue(value)`

Konvertiert einen `LocalizedString`-Wert für Prisma.

```typescript
import { toJsonValue } from './json-helpers';

// null -> Prisma.JsonNull (speichert NULL)
toJsonValue(null);
// => Prisma.JsonNull

// undefined -> undefined (nicht ändern bei Update)
toJsonValue(undefined);
// => undefined

// Leeres Objekt -> {} (speichert {})
toJsonValue({});
// => {}

// Daten -> Daten (speichert JSON)
toJsonValue({ de: 'Kondensator', en: 'Capacitor' });
// => { de: 'Kondensator', en: 'Capacitor' }
```

**Type Signature:**
```typescript
function toJsonValue(
  value: LocalizedString | LocalizedStringLoose | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined
```

**Verwendung bei Create:**
```typescript
await db.component.create({
  data: {
    name: toJsonValue(input.name),
    description: toJsonValue(input.description ?? null),
  }
});
```

### `toJsonValueIfSet(value, isSet)`

Konvertiert einen Wert nur wenn er explizit gesetzt wurde.

```typescript
// Nicht gesetzt -> undefined (Feld bleibt unverändert)
toJsonValueIfSet({ de: 'Neu' }, false);
// => undefined

// Gesetzt -> konvertiert
toJsonValueIfSet({ de: 'Neu' }, true);
// => { de: 'Neu' }

toJsonValueIfSet(null, true);
// => Prisma.JsonNull
```

**Verwendung bei Updates:**
```typescript
await db.component.update({
  where: { id },
  data: {
    // Nur name wird aktualisiert (description bleibt wie sie ist)
    name: toJsonValueIfSet(input.name, true),
    description: toJsonValueIfSet(input.description, false),
  }
});
```

**Pattern mit Zod:**
```typescript
const UpdateSchema = z.object({
  name: LocalizedStringSchema.optional(),
  description: LocalizedStringSchema.optional(),
});

// In Service
const update = UpdateSchema.parse(input);

await db.component.update({
  data: {
    name: toJsonValueIfSet(update.name, 'name' in update),
    description: toJsonValueIfSet(update.description, 'description' in update),
  }
});
```

---

## Best Practices

### Error Handling

**Immer typisierte Fehler werfen:**
```typescript
// ❌ FALSCH
throw new Error('Not found');

// ✅ RICHTIG
throw new NotFoundError('Component', id);
```

**Fehler in Service-Layer abfangen:**
```typescript
try {
  const component = await db.component.findUniqueOrThrow({ where: { id } });
  return component;
} catch (error) {
  if (error.code === 'P2025') {
    throw new NotFoundError('Component', id);
  }
  throw error;
}
```

### MinIO URLs

**Immer Proxy-URLs verwenden:**
```typescript
import { transformManufacturerLogoUrl } from '../lib/url-helpers';

// ❌ FALSCH - Direkte MinIO-URL im Response
const manufacturer = await db.manufacturer.findUnique({ ... });
return { ...manufacturer }; // logoUrl ist MinIO-URL

// ✅ RICHTIG - Proxy-URL verwenden
const manufacturer = await db.manufacturer.findUnique({ ... });
return transformManufacturerLogoUrl(manufacturer);
```

### Slug-Generierung

**Immer Eindeutigkeit prüfen:**
```typescript
import { generateSlug, generateUniqueSlug, getSlugSourceText } from '../lib/slug';

// ❌ FALSCH - Kann Duplikate erzeugen
const slug = generateSlug(name);

// ✅ RICHTIG - Eindeutigkeit sicherstellen
const baseSlug = generateSlug(getSlugSourceText(name));
const existingSlugs = await fetchExistingSlugs(baseSlug);
const slug = generateUniqueSlug(baseSlug, existingSlugs);
```

### JSON-Felder

**Immer toJsonValue nutzen:**
```typescript
import { toJsonValue } from '../lib/json-helpers';

// ❌ FALSCH - null wird nicht korrekt behandelt
await db.component.create({
  data: {
    name: input.name,
    description: input.description ?? null, // Fehler!
  }
});

// ✅ RICHTIG - Konvertierung mit toJsonValue
await db.component.create({
  data: {
    name: toJsonValue(input.name),
    description: toJsonValue(input.description ?? null),
  }
});
```

### Pagination

**Immer total mitzählen:**
```typescript
import { getPrismaOffsets, createPaginatedResponse } from '../lib/pagination';

const offsets = getPrismaOffsets({ page, limit });

// ✅ RICHTIG - Parallel für Performance
const [data, total] = await Promise.all([
  db.component.findMany({ ...offsets }),
  db.component.count()
]);

return createPaginatedResponse(data, page, limit, total);
```

---

## Verwandte Dokumentation

- [Internationalisierung](./i18n.md) - LocalizedString Details
- [Tech-Stack](./tech-stack.md) - Verwendete Technologien
- [API-Endpoints](../reference/api-endpoints.md) - REST-API Übersicht
- [Development Setup](../guides/development-setup.md) - Server und Umgebungsvariablen
