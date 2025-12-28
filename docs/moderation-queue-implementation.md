# Moderations-Queue Implementation

**Erstellt:** 2025-12-28
**Status:** Implementiert

## Übersicht

Die Moderations-Queue ermöglicht es Moderatoren und Admins, von der Community erstellte Bauteile (Components) und Parts freizugeben oder abzulehnen.

## Status-Flow

```
DRAFT → PENDING → PUBLISHED
                ↘ ARCHIVED (REJECTED)
```

- **DRAFT**: Bauteil in Bearbeitung
- **PENDING**: Wartet auf Moderation (neu erstellt von CONTRIBUTOR)
- **PUBLISHED**: Freigegeben, öffentlich sichtbar
- **ARCHIVED**: Abgelehnt (wird als ARCHIVED markiert)

## Implementierte Komponenten

### 1. Backend

#### Datenbank (Prisma Schema)

**ModerationLog Model**

```prisma
model ModerationLog {
  id             String   @id @default(uuid()) @db.Uuid
  entityType     String   @db.VarChar(50)   // COMPONENT, PART
  entityId       String   @db.Uuid
  action         String   @db.VarChar(50)   // APPROVED, REJECTED, SUBMITTED
  previousStatus String?  @db.VarChar(50)
  newStatus      String   @db.VarChar(50)
  comment        String?  @db.Text
  moderatorId    String   @db.Uuid
  moderator      User     @relation(fields: [moderatorId], references: [id])
  createdAt      DateTime @default(now())

  @@index([entityType, entityId])
  @@index([moderatorId])
  @@index([createdAt])
}
```

**Migration:** `20251228011733_add_moderation_log`

#### Moderation Service

**Pfad:** `apps/api/src/services/moderation.service.ts`

**Funktionen:**

- `getPendingComponents(query)` - Alle PENDING Components
- `getPendingParts(query)` - Alle PENDING Parts
- `getCombinedQueue(query)` - Kombinierte Queue (Components + Parts)
- `moderateComponent(action)` - Component freigeben/ablehnen
- `moderatePart(action)` - Part freigeben/ablehnen
- `batchApprove(componentIds, moderatorId)` - Mehrere freigeben
- `batchReject(componentIds, comment, moderatorId)` - Mehrere ablehnen
- `getQueueStats()` - Statistiken (pending, approvedToday, rejectedToday)

**Transaktionen:**

Jede Moderations-Aktion erstellt:
1. Update des Entity-Status (PUBLISHED oder ARCHIVED)
2. ModerationLog-Eintrag
3. AuditLog-Eintrag

#### API Routes

**Pfad:** `apps/api/src/routes/moderation/index.ts`

**Endpoints:**

| Methode | Endpoint | Rolle | Beschreibung |
|---------|----------|-------|--------------|
| GET | `/moderation/queue` | MODERATOR, ADMIN | Kombinierte Queue |
| GET | `/moderation/queue/components` | MODERATOR, ADMIN | Nur Components |
| GET | `/moderation/queue/parts` | MODERATOR, ADMIN | Nur Parts |
| GET | `/moderation/stats` | MODERATOR, ADMIN | Statistiken |
| POST | `/moderation/component/:id/approve` | MODERATOR, ADMIN | Component freigeben |
| POST | `/moderation/component/:id/reject` | MODERATOR, ADMIN | Component ablehnen |
| POST | `/moderation/part/:id/approve` | MODERATOR, ADMIN | Part freigeben |
| POST | `/moderation/part/:id/reject` | MODERATOR, ADMIN | Part ablehnen |
| POST | `/moderation/batch/approve` | MODERATOR, ADMIN | Batch-Freigabe |
| POST | `/moderation/batch/reject` | MODERATOR, ADMIN | Batch-Ablehnung |

**Registrierung:** In `apps/api/src/app.ts` unter Prefix `/api/v1/moderation`

### 2. Frontend

#### API Client Erweiterung

**Pfad:** `apps/web/src/lib/api.ts`

**Neue Methoden:**

```typescript
getModerationQueue(params?)
getPendingComponents(params?)
getPendingParts(params?)
getModerationStats()
approveComponent(id)
rejectComponent(id, comment?)
approvePart(id)
rejectPart(id, comment?)
batchApprove(componentIds)
batchReject(componentIds, comment)
```

**Neue Types:**

- `ModerationQueueItem` - Unified Item für Queue
- `ModerationStats` - Statistiken

#### Moderations-Queue-Seite

**Pfad:** `apps/web/src/app/admin/moderation/page.tsx`

**Features:**

- **Stats-Karten:**
  - Pending Count
  - Approved Today
  - Rejected Today

- **Tabs:**
  - Alle Items
  - Nur Components
  - Nur Parts

- **Tabelle:**
  - Checkbox für Batch-Selection
  - Typ-Badge (Component/Part)
  - Name (lokalisiert)
  - Kategorie/Hersteller
  - Erstellungsdatum
  - Aktionen (Approve/Reject)

- **Batch-Aktionen:**
  - Mehrere Items auswählen
  - Batch Approve/Reject

#### Moderation Actions Komponente

**Pfad:** `apps/web/src/components/admin/moderation-actions.tsx`

**Features:**

- **Single Item:**
  - Approve Button mit Bestätigung
  - Reject Button mit Kommentar-Dialog (Pflicht)

- **Batch:**
  - Batch Approve mit Anzahl-Anzeige
  - Bestätigungs-Dialog

#### Admin-Navigation

**Pfad:** `apps/web/src/components/admin/admin-sidebar.tsx`

**Änderungen:**

- Neuer Menüpunkt "Moderation" mit CheckCircle-Icon
- Nur für MODERATOR und ADMIN sichtbar (`moderatorOnly: true`)
- Zwischen Dashboard und Kategorien positioniert

## Berechtigungen

| Rolle | Zugriff |
|-------|---------|
| VIEWER | Nein |
| CONTRIBUTOR | Nein |
| MODERATOR | Ja (alle Funktionen) |
| ADMIN | Ja (alle Funktionen) |

## Workflow

1. **CONTRIBUTOR erstellt Component:**
   - Status wird auf PENDING gesetzt
   - Component erscheint in Moderations-Queue

2. **MODERATOR prüft:**
   - Öffnet `/admin/moderation`
   - Sieht alle PENDING Items sortiert nach Datum (älteste zuerst)

3. **MODERATOR entscheidet:**
   - **Approve:** Status → PUBLISHED, Item verschwindet aus Queue
   - **Reject:** Kommentar erforderlich, Status → ARCHIVED

4. **Logging:**
   - Jede Aktion wird im ModerationLog erfasst
   - AuditLog für Nachvollziehbarkeit
   - Statistiken werden aktualisiert

## Nächste Schritte

- [ ] **Benachrichtigungen:** CONTRIBUTOR informieren bei Approve/Reject
- [ ] **Email-Versand:** Rejection-Kommentar per Email
- [ ] **History:** Moderations-Historie für Admins
- [ ] **Bulk Edit:** REJECTED Items erneut zur Moderation einreichen
- [ ] **Filters:** Filter nach Kategorie, Ersteller, Datum

## Testing

### Manueller Test-Flow

1. Als CONTRIBUTOR:
   ```bash
   # Component erstellen mit Status PENDING
   POST /api/v1/components
   {
     "name": { "de": "Test-Bauteil" },
     "categoryId": "...",
     "status": "PENDING"
   }
   ```

2. Als MODERATOR:
   ```bash
   # Queue abrufen
   GET /api/v1/moderation/queue

   # Freigeben
   POST /api/v1/moderation/component/{id}/approve

   # Ablehnen
   POST /api/v1/moderation/component/{id}/reject
   {
     "comment": "Unvollständige Daten"
   }
   ```

3. Frontend:
   - Login als MODERATOR
   - Navigate zu `/admin/moderation`
   - Prüfe Stats-Karten
   - Approve/Reject Items
   - Test Batch-Actions

## Migration

```bash
# Migration ausführen
pnpm db:migrate

# Prisma Client generieren
pnpm db:generate
```

## Verwandte Dateien

**Backend:**
- `packages/database/prisma/schema.prisma`
- `apps/api/src/services/moderation.service.ts`
- `apps/api/src/routes/moderation/index.ts`
- `apps/api/src/app.ts`

**Frontend:**
- `apps/web/src/lib/api.ts`
- `apps/web/src/app/admin/moderation/page.tsx`
- `apps/web/src/components/admin/moderation-actions.tsx`
- `apps/web/src/components/admin/admin-sidebar.tsx`

## Bekannte Einschränkungen

1. **Keine Bulk Part-Moderation:** Aktuell nur für Components
2. **Keine Detail-Vorschau:** Items müssen manuell geöffnet werden
3. **Keine Undo-Funktion:** Entscheidungen sind final
4. **Keine automatische Benachrichtigung:** CONTRIBUTOR erhält keine Info

---

**Implementiert:** Claude Code (Frontend Agent)
**Review:** Pending
