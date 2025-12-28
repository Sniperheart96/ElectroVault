# Phase 4: Community-Features (MVP)

**Status:** ✅ Implementiert
**Fortschritt:** 100%
**Abgeschlossen:** 2025-12-28

---

## Übersicht

Phase 4 implementiert die Features für Community-Beiträge: Erstellung, Upload und Moderation.

---

## Aufgaben

- [x] Komponenten-Erstellung (Formular)
- [x] Dynamische Attribut-Formulare (basierend auf Kategorie)
- [x] Datasheet-Upload (MinIO)
- [x] Bild-Upload
- [x] Pin-Mapping Editor
- [x] Beziehungen verwalten (Alternativen, Nachfolger)
- [x] Moderations-Queue

---

## Implementierte Komponenten

### 1. Dynamische Attribut-Formulare

**Datei:** `apps/web/src/components/admin/attribute-fields.tsx`

Dynamische Formularfelder basierend auf Kategorie-Attribut-Definitionen:
- Lädt Attribute für ausgewählte Kategorie
- Unterstützt BOOLEAN, INTEGER, DECIMAL, STRING, RANGE Datentypen
- SI-Einheiten-Normalisierung für numerische Werte
- Zeigt Einheiten und Pflichtfeld-Marker an

```typescript
<AttributeFields
  categoryId={categoryId}
  scope="COMPONENT" // oder "PART" oder "BOTH"
  values={attributeValues}
  onChange={setAttributeValues}
  sectionLabel="Komponenten-Attribute"
  includeInherited={true}
/>
```

---

### 2. Datei-Upload (MinIO)

**Backend Dateien:**
- `apps/api/src/lib/minio.ts` - MinIO Client Singleton
- `apps/api/src/services/file.service.ts` - Upload/Download Service
- `apps/api/src/routes/files/index.ts` - REST API Endpoints

**Frontend Datei:**
- `apps/web/src/components/admin/file-upload.tsx` - Drag & Drop Upload Component

#### API-Endpunkte

| Method | Endpoint | Beschreibung | Auth |
|--------|----------|--------------|------|
| POST | `/api/v1/files/datasheet` | PDF hochladen (max 50MB) | CONTRIBUTOR+ |
| POST | `/api/v1/files/image` | Bild hochladen (max 10MB) | CONTRIBUTOR+ |
| POST | `/api/v1/files/pinout` | Pinout-Diagramm hochladen | CONTRIBUTOR+ |
| GET | `/api/v1/files/:id` | Metadaten abrufen | PUBLIC |
| GET | `/api/v1/files/:id/download` | Presigned URL generieren (24h) | PUBLIC |
| GET | `/api/v1/files/component/:id` | Alle Dateien eines Components | PUBLIC |
| GET | `/api/v1/files/part/:id` | Alle Dateien eines Parts | PUBLIC |
| DELETE | `/api/v1/files/:id` | Datei löschen (Soft-Delete) | Owner/MOD+ |
| GET | `/api/v1/files/stats` | Upload-Statistiken | ADMIN |

#### Prisma Schema

```prisma
model FileAttachment {
  id              String    @id @default(uuid()) @db.Uuid
  originalName    String    @db.VarChar(255)
  sanitizedName   String    @db.VarChar(255)
  mimeType        String    @db.VarChar(100)
  size            Int
  fileType        FileType  // DATASHEET, IMAGE, PINOUT, OTHER
  bucketName      String    @db.VarChar(100)
  bucketPath      String    @unique @db.VarChar(512)
  componentId     String?   @db.Uuid
  partId          String?   @db.Uuid
  uploadedById    String    @db.Uuid
  deletedAt       DateTime?
}
```

---

### 3. Pin-Mapping Editor

**Backend Dateien:**
- `apps/api/src/services/pin.service.ts` - Pin CRUD Service
- `apps/api/src/routes/pins/index.ts` - REST API Endpoints
- `packages/schemas/src/pin.ts` - Zod Schemas

**Frontend Dateien:**
- `apps/web/src/components/admin/pin-mapping-editor.tsx` - Pin Editor Component
- `apps/web/src/components/admin/part-dialog.tsx` - Integration (Collapsible Section)

#### API-Endpunkte

| Method | Endpoint | Beschreibung | Auth |
|--------|----------|--------------|------|
| GET | `/parts/:partId/pins` | Alle Pins eines Parts | PUBLIC |
| GET | `/pins/:id` | Einzelner Pin | PUBLIC |
| POST | `/parts/:partId/pins` | Neuen Pin erstellen | CONTRIBUTOR+ |
| POST | `/parts/:partId/pins/bulk` | Mehrere Pins erstellen | CONTRIBUTOR+ |
| PATCH | `/pins/:id` | Pin aktualisieren | CONTRIBUTOR+ |
| DELETE | `/pins/:id` | Pin löschen | CONTRIBUTOR+ |
| POST | `/parts/:partId/pins/reorder` | Reihenfolge ändern | CONTRIBUTOR+ |
| DELETE | `/parts/:partId/pins` | Alle Pins löschen | MODERATOR+ |

#### UI Features

- Tabellenansicht aller Pins mit Inline-Editing
- Pin-Typen mit visuellen Farb-Badges (Power=rot, Ground=schwarz, etc.)
- Reihenfolge ändern mit Pfeil-Buttons
- Bulk-Import über CSV-Format: `1,VCC,POWER;2,GND,GROUND;3,IN,INPUT`
- Löschen-Bestätigung mit AlertDialog

---

### 4. Beziehungs-Editor

**Backend Dateien:**
- `apps/api/src/services/component.service.ts` - Relations Methods
- `apps/api/src/routes/components/index.ts` - Relations Endpoints

**Frontend Dateien:**
- `apps/web/src/components/admin/relations-editor.tsx` - Relations Editor Component
- `apps/web/src/components/admin/component-dialog.tsx` - Integration (Tab)

#### Beziehungstypen

| Typ | Deutsch | Beschreibung |
|-----|---------|--------------|
| EQUIVALENT | Gleichwertig | Funktional gleichwertig und austauschbar |
| SIMILAR | Ähnlich | Ähnliche Funktion, nicht identisch |
| UPGRADE | Upgrade | Verbesserte/neuere Version |
| DOWNGRADE | Downgrade | Ältere/einfachere Version |
| REPLACEMENT | Ersatz | Offizieller Ersatz vom Hersteller |
| COMPLEMENT | Ergänzung | Ergänzendes Bauteil (z.B. Treiber) |
| REQUIRES | Benötigt | Benötigt dieses Bauteil für Betrieb |
| CONFLICTS | Inkompatibel | Nicht kompatibel |

#### UI Features

- Liste aller Beziehungen als Cards mit Icons und Badges
- Component-Suche mit Live-Filter
- Bidirectional-Toggle für Beziehungen in beide Richtungen
- Optionales Beschreibungsfeld (LocalizedString: de/en)
- Dialog für Create/Edit mit Typ-Dropdown
- Delete-Bestätigung

---

### 5. Moderations-Queue

**Backend Dateien:**
- `apps/api/src/services/moderation.service.ts` - Moderation Service
- `apps/api/src/routes/moderation/index.ts` - REST API Endpoints

**Frontend Dateien:**
- `apps/web/src/app/admin/moderation/page.tsx` - Moderation Queue Page
- `apps/web/src/components/admin/moderation-actions.tsx` - Action Buttons

**Dokumentation:**
- `docs/moderation-queue-implementation.md` - Detaillierte Implementierungsdokumentation

#### API-Endpunkte

| Method | Endpoint | Beschreibung | Auth |
|--------|----------|--------------|------|
| GET | `/moderation/queue` | Kombinierte Queue | MODERATOR+ |
| GET | `/moderation/queue/components` | Nur Components | MODERATOR+ |
| GET | `/moderation/queue/parts` | Nur Parts | MODERATOR+ |
| GET | `/moderation/stats` | Statistiken | MODERATOR+ |
| POST | `/moderation/component/:id/approve` | Freigeben | MODERATOR+ |
| POST | `/moderation/component/:id/reject` | Ablehnen | MODERATOR+ |
| POST | `/moderation/part/:id/approve` | Freigeben | MODERATOR+ |
| POST | `/moderation/part/:id/reject` | Ablehnen | MODERATOR+ |
| POST | `/moderation/batch/approve` | Batch-Freigabe | MODERATOR+ |
| POST | `/moderation/batch/reject` | Batch-Ablehnung | MODERATOR+ |

#### Status-Flow

```
DRAFT → PENDING → PUBLISHED
                ↘ ARCHIVED (Rejected)
```

#### UI Features

- Stats-Karten (Pending, Approved Today, Rejected Today)
- Tab-Navigation (Alle/Components/Parts)
- Checkbox für Batch-Selection
- Approve Button mit Bestätigung
- Reject Button mit Pflicht-Kommentar
- Tabelle mit Typ-Badge, Name, Kategorie, Erstellungsdatum

---

## Neue Admin-Sidebar Einträge

| Eintrag | Route | Icon | Rolle |
|---------|-------|------|-------|
| Moderation | /admin/moderation | CheckCircle | MODERATOR+ |

---

## Prisma Schema Erweiterungen

### FileType Enum

```prisma
enum FileType {
  DATASHEET
  IMAGE
  PINOUT
  OTHER
}
```

### ModerationLog Model

```prisma
model ModerationLog {
  id             String   @id @default(uuid()) @db.Uuid
  entityType     String   @db.VarChar(50)  // COMPONENT, PART
  entityId       String   @db.Uuid
  action         String   @db.VarChar(50)  // APPROVED, REJECTED
  previousStatus String?  @db.VarChar(50)
  newStatus      String   @db.VarChar(50)
  comment        String?  @db.Text
  moderatorId    String   @db.Uuid
  createdAt      DateTime @default(now())
}
```

---

## Dependencies

### Backend

```json
{
  "@fastify/multipart": "^8.x",
  "minio": "^8.x"
}
```

### Frontend

Nutzt bestehende shadcn/ui Komponenten:
- Table, Form, Input, Select, Button, Badge
- Dialog, AlertDialog, Tabs, Collapsible
- Card, Checkbox, Textarea, Skeleton, Alert

---

## Migration

```bash
# Migration ausführen
pnpm db:migrate

# Prisma Client generieren
pnpm db:generate

# MinIO Bucket erstellen (automatisch beim Server-Start)
# Bucket: electrovault-files
```

---

## Workflow: Component erstellen (CONTRIBUTOR)

1. **Dashboard** → "Bauteil hinzufügen"
2. **Kategorie auswählen** → Lädt dynamische Attribute
3. **Stammdaten ausfüllen** → Name (de/en), Beschreibung
4. **Attribute ausfüllen** → Kategoriespezifisch
5. **Speichern** → Status: PENDING
6. **Optional: Dateien hochladen** → Datasheet, Bilder
7. **Optional: Hersteller-Varianten anlegen** → Im Tab
8. **Optional: Beziehungen definieren** → Im Tab

## Workflow: Moderation (MODERATOR)

1. **Dashboard** → "/admin/moderation"
2. **Stats prüfen** → Pending-Counter
3. **Queue durchgehen** → Nach Datum sortiert
4. **Prüfen** → Details im Component-Dialog
5. **Entscheiden**:
   - **Approve** → Status: PUBLISHED
   - **Reject** → Kommentar erforderlich, Status: ARCHIVED
6. **Batch-Aktionen** → Mehrere auswählen, Approve/Reject

---

## Bekannte Einschränkungen

1. **Keine Virus-Scans** - ClamAV-Integration ausstehend
2. **Keine Vorschau-Generierung** - PDF/Bild-Thumbnails nicht implementiert
3. **Keine Benachrichtigungen** - CONTRIBUTOR erhält keine Info bei Moderation
4. **Keine Detail-Vorschau in Queue** - Items müssen separat geöffnet werden

---

## Nächste Schritte

- [ ] Email-Benachrichtigung bei Approval/Rejection
- [ ] PDF-Thumbnail-Generierung
- [ ] Visueller Pin-Layout-Editor (Package-Grafik)
- [ ] Moderations-Historie für Admins
- [ ] Änderungsvorschläge (Edit Suggestions)

---

*Nächste Phase: [phase-5-devices.md](phase-5-devices.md)*
