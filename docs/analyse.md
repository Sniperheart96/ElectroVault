# ElectroVault - Umfassende Code-Analyse

**Erstellt:** 2025-12-28
**Aktualisiert:** 2025-12-28 (Vollständige Agentenanalyse)
**Zweck:** Umfassende Codebase-Analyse mit spezialisierten Agenten

---

## Executive Summary

Diese Analyse wurde von 5 spezialisierten Agenten durchgeführt:
- **Frontend Agent**: React/Next.js Code-Qualität
- **API/Backend Agent**: Fastify Services, Sicherheit
- **Database Agent**: Prisma Schema, Migrationen, Performance
- **Auth Agent**: Keycloak Integration, Session-Management
- **Schema Agent**: Zod-Validierung, Type-Safety

### Gesamtbewertung

| Bereich | Bewertung | Status |
|---------|-----------|--------|
| Frontend | 7.5/10 | Solide Basis mit Optimierungspotenzial |
| API/Backend | 7/10 | Gute Architektur, kritische Race Conditions |
| Datenbank | 7/10 | Schema nicht production-ready (Migrationen fehlen) |
| Auth | 6/10 | Kritische Sicherheitslücken vor Production beheben |
| Schemas | 8/10 | Gut strukturiert, einige Duplikate |

---

## Teil 1: Status der bisherigen Korrekturen

### Bereits behobene Probleme (aus vorheriger Analyse)

| Punkt | Problem | Status |
|-------|---------|--------|
| 1.1 | ComponentStatus Enum | ✅ Korrigiert in database-schema.md |
| 1.2 | ConceptRelationType im Frontend | ✅ relations-editor.tsx komplett überarbeitet |
| 2.1 | Nicht-existente API-Endpoints | ✅ api.ts korrigiert |
| 2.2 | Pagination meta→pagination | ✅ phase-2-component-api.md korrigiert |
| 3.x | Fehlende Features dokumentiert | ✅ tech-stack.md aktualisiert |
| 4.x | Package-Struktur | ✅ tech-stack.md aktualisiert |
| 5.x | UI-Komponenten Zählung | ✅ Dokumentation angepasst |

---

## Teil 2: Kritische Blocker (Sofort beheben)

### 2.1 Datenbank - Schema nicht deploybar

| # | Problem | Datei | Severity |
|---|---------|-------|----------|
| 1 | **FileAttachment Migration fehlt** | schema.prisma | 🔴 KRITISCH |
| 2 | **displayValue → prefix Migration fehlt** | schema.prisma | 🔴 KRITISCH |
| 3 | **FileType Enum zu limitiert** | schema.prisma | 🔴 KRITISCH |
| 4 | **Fehlende Composite Indizes** | schema.prisma | 🔴 KRITISCH |

**Details:**
- `FileAttachment` Modell existiert im Schema, aber keine Migration
- `displayValue` wurde durch `prefix` ersetzt, aber keine Migration
- `FileType` fehlt: ECAD_MODEL, SCHEMATIC, APPLICATION_NOTE, MANUAL
- Queries ohne passende Indizes führen zu Full-Table-Scans

**Empfohlene Migration:**
```sql
-- 1. FileType Enum erweitern
ALTER TYPE "FileType" ADD VALUE 'ECAD_MODEL';
ALTER TYPE "FileType" ADD VALUE 'SCHEMATIC';
ALTER TYPE "FileType" ADD VALUE 'APPLICATION_NOTE';
ALTER TYPE "FileType" ADD VALUE 'MANUAL';

-- 2. Composite Indizes
CREATE INDEX "CoreComponent_active_category_status_idx"
  ON "CoreComponent"("categoryId", "status")
  WHERE "deletedAt" IS NULL;
```

### 2.2 Auth - Sicherheitslücken

| # | Problem | Datei | Zeile | Severity |
|---|---------|-------|-------|----------|
| 1 | **Schwacher NEXTAUTH_SECRET** | .env.local | 6 | 🔴 KRITISCH |
| 2 | **Fehlendes KEYCLOAK_CLIENT_SECRET** | .env.local | 12 | 🔴 KRITISCH |
| 3 | **Cookie `secure: false`** | auth.ts | 214 | 🔴 KRITISCH |
| 4 | **Refresh-Token an Client** | auth.ts | 158 | 🔴 KRITISCH |

**Sofortige Maßnahmen:**
```bash
# 1. Neuen Secret generieren
openssl rand -base64 32

# 2. Keycloak Client auf "confidential" setzen
# 3. secure: true für Production Cookies
# 4. refreshToken aus Session-Callback entfernen
```

### 2.3 API - Race Conditions

| # | Problem | Datei | Zeile |
|---|---------|-------|-------|
| 1 | Race Condition bei Slug-Generierung | component.service.ts | 241-248 |
| 2 | Race Condition bei isPrimary Flag | part.service.ts | 522-527, 562-567 |

**Lösung:** Prisma Unique Constraint + Transaction Locking

---

## Teil 3: Frontend-Analyse

**Dateien analysiert:** 77 | **Imports:** 472 | **Kritische Issues:** 3

### 3.1 Kritische Probleme

| # | Problem | Datei | Zeile |
|---|---------|-------|-------|
| 1 | `as any` Type-Casting | relations-editor.tsx | 156 |
| 2 | Memory Leak in useApi | use-api.ts | 18-30 |
| 3 | Race Conditions ohne AbortController | admin/components/page.tsx | 62-80 |

**relations-editor.tsx:156** - Type-Safety verletzt:
```typescript
// ❌ Aktuell
resolver: zodResolver(CreateRelationSchema) as any,

// ✅ Besser: Korrekten Typ verwenden
resolver: zodResolver(CreateRelationSchema),
```

**use-api.ts** - Token wird nicht bei Unmount zurückgesetzt:
```typescript
// ❌ Aktuell: Token bei jedem Render gesetzt
if (session?.accessToken) {
  api.setToken(session.accessToken);
}

// ✅ Besser: useEffect mit Cleanup
useEffect(() => {
  if (session?.accessToken) {
    api.setToken(session.accessToken);
  }
  return () => api.setToken(null);
}, [session?.accessToken]);
```

### 3.2 Hohe Priorität

| # | Problem | Datei |
|---|---------|-------|
| 1 | Fehlende Debouncing für Search | admin/components/page.tsx:176 |
| 2 | Code-Duplikation (flattenCategories) | 2 Dateien |
| 3 | Fehlende Memoization für große Listen | component-dialog.tsx:666-730 |
| 4 | Inkonsistente Loading States | Mehrere Admin-Pages |

### 3.3 Fehlende Features

- **TanStack Query** für Caching (aktuell: Direct API calls)
- **Virtualisierung** für große Listen (react-window/react-virtual)
- **Lazy Loading** für Dialog-Tabs
- **URLSearchParams** für Admin-Filter (Deep-Links)

---

## Teil 4: Backend-Analyse

**Kritische Bugs:** 4 | **Wichtige Issues:** 4 | **Code-Qualität:** 11

### 4.1 Kritische Bugs

| # | Bug | Datei | Auswirkung |
|---|-----|-------|------------|
| 1 | Race Condition Slug | component.service.ts | Duplikate möglich |
| 2 | Race Condition isPrimary | part.service.ts | Mehrere Primary möglich |
| 3 | Unsichere MinIO Defaults | minio.ts:11-12 | Credentials im Code |
| 4 | N+1 Query Category Tree | category.service.ts:191-199 | Performance-Killer |

**MinIO - Unsichere Defaults:**
```typescript
// ❌ Aktuell
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';

// ✅ Besser: Fehler bei fehlenden ENV-Variablen
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY;
if (!MINIO_ACCESS_KEY) {
  throw new Error('MINIO_ACCESS_KEY environment variable is required');
}
```

### 4.2 Wichtige Issues

| # | Problem | Dateien |
|---|---------|---------|
| 1 | Fehlende Audit-Logs | component.service.ts, manufacturer.service.ts |
| 2 | Type Casting ohne Validierung | Mehrere Services (`as unknown as`) |
| 3 | Information Disclosure bei 500 | app.ts:214-221 |
| 4 | Batch-Operations N+1 | moderation.service.ts:387-405 |

### 4.3 Security Warnings

| # | Problem | Datei | Fix |
|---|---------|-------|-----|
| 1 | Globales Rate-Limit zu hoch | app.ts:94-98 | Route-spezifisch machen |
| 2 | Stack Traces in Production | app.ts:214-221 | Generische Messages |
| 3 | Detaillierte Validation Errors | app.ts:182-190 | Nur relevante Felder |
| 4 | CORS erlaubt Requests ohne Origin | app.ts:66-70 | Dokumentieren |

---

## Teil 5: Datenbank-Analyse

**Schema:** 807 Zeilen | **Migrationen:** 2 | **Status:** Nicht production-ready

### 5.1 Schema-Qualität

| Kategorie | Bewertung |
|-----------|-----------|
| Schema-Qualität | 7/10 |
| Performance-Optimierung | 5/10 |
| Datenintegrität | 8/10 |
| Normalisierung | 9/10 |

### 5.2 Fehlende Migrationen

1. **FileAttachment** - Tabelle fehlt komplett
2. **displayValue → prefix** - Spaltenumbenennung fehlt
3. **allowedPrefixes** - Neue Spalte fehlt

### 5.3 Performance-Probleme

| Problem | Auswirkung | Lösung |
|---------|------------|--------|
| Keine Composite Indizes | Full-Table-Scans | Composite Index hinzufügen |
| Keine Volltextsuche (tsvector) | Langsame JSON-Searches | PostgreSQL tsvector |
| Nur einfache deletedAt-Indizes | Große Index-Größe | Partial Index |
| N+1 bei Category Tree | Exponentielles Query-Wachstum | CTE-basierte Lösung |

### 5.4 Fehlende Constraints

```sql
-- Business-Logik Constraints
ALTER TABLE "ManufacturerMaster"
  ADD CONSTRAINT "valid_years"
  CHECK ("defunctYear" IS NULL OR "defunctYear" >= "foundedYear");

ALTER TABLE "PackageMaster"
  ADD CONSTRAINT "valid_pin_range"
  CHECK ("pinCountMax" IS NULL OR "pinCountMax" >= "pinCountMin");
```

---

## Teil 6: Auth-Analyse

**Status:** 4 kritische Sicherheitslücken | Nicht production-ready

### 6.1 Risikobewertung

| Kategorie | Schweregrad | Status |
|-----------|-------------|--------|
| Token-Sicherheit | 🔴 KRITISCH | Fehlende Secrets |
| Session-Management | 🟡 MITTEL | 30 Tage zu lang |
| CSRF-Schutz | 🟢 GUT | Implementiert |
| Rollen-System | 🟡 MITTEL | Inkonsistenzen |
| API-Authentifizierung | 🟢 GUT | JWKS korrekt |
| Cookie-Konfiguration | 🔴 KRITISCH | secure: false |

### 6.2 Gut implementiert

- **PKCE & State-Parameter** für OAuth-Flow
- **JWKS-basierte JWT-Validierung** (keine Secrets im Backend)
- **Rollen-Hierarchie** korrekt definiert
- **User-Sync** zwischen Keycloak und PostgreSQL
- **httpOnly Cookies** gegen XSS
- **Rate-Limiting** implementiert

### 6.3 Production-Checkliste

- [ ] NEXTAUTH_SECRET mit mindestens 32 Zeichen
- [ ] KEYCLOAK_CLIENT_SECRET gesetzt
- [ ] `secure: true` für alle Cookies
- [ ] Refresh-Token nicht an Client senden
- [ ] Session maxAge auf 7 Tage reduzieren
- [ ] HTTPS erzwingen

---

## Teil 7: Schema-Analyse (Zod)

**Module:** 10 | **Kritische Issues:** 6

### 7.1 Fehlende Schemas

| Schema | Verwendung |
|--------|------------|
| User/Profile | Frontend User-Management |
| Moderation | API Moderation-Queue |
| File Upload | API File-Service |
| Search/Autocomplete | Schnellsuche |

### 7.2 Kritische Type-Safety Probleme

| # | Problem | Datei |
|---|---------|-------|
| 1 | `AttributeDataType` fehlt `RANGE` | common.ts:108 |
| 2 | `AttributeDefinitionSchema` doppelt | component.ts, attribute.ts |
| 3 | `PinMappingSchema` doppelt | part.ts, pin.ts |
| 4 | `ImageType` nicht exportiert | common.ts |
| 5 | `EcadFormat` nicht exportiert | common.ts |

**AttributeDataType Fix:**
```typescript
// ❌ Aktuell
export const AttributeDataTypeSchema = z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN']);

// ✅ Korrigiert
export const AttributeDataTypeSchema = z.enum(['DECIMAL', 'INTEGER', 'STRING', 'BOOLEAN', 'RANGE']);
```

### 7.3 Empfehlungen

1. **Doppelte Definitionen entfernen** - Nur eine Quelle der Wahrheit
2. **Enums in common.ts zentralisieren** - ImageType, EcadFormat
3. **Refinements hinzufügen** - Cross-Field-Validierung (z.B. Min <= Max)
4. **Error-Messages ergänzen** - Bessere UX bei Validierungsfehlern

---

## Teil 8: Priorisierte Handlungsempfehlungen

### P0 - Kritisch (Vor Production-Deploy)

| # | Aufgabe | Bereich | Aufwand |
|---|---------|---------|---------|
| 1 | FileAttachment Migration erstellen | DB | 2h |
| 2 | displayValue → prefix Migration | DB | 1h |
| 3 | NEXTAUTH_SECRET generieren | Auth | 5min |
| 4 | KEYCLOAK_CLIENT_SECRET setzen | Auth | 15min |
| 5 | Cookie `secure: true` für Production | Auth | 30min |
| 6 | Refresh-Token aus Session entfernen | Auth | 10min |
| 7 | Race Conditions mit Transactions fixen | API | 2h |
| 8 | MinIO unsichere Defaults entfernen | API | 15min |

### P1 - Hoch (Nächster Sprint)

| # | Aufgabe | Bereich | Aufwand |
|---|---------|---------|---------|
| 1 | `as any` in relations-editor.tsx fixen | Frontend | 30min |
| 2 | Memory Leak in useApi beheben | Frontend | 1h |
| 3 | Composite Indizes hinzufügen | DB | 1h |
| 4 | N+1 Query bei Category Tree fixen | API | 4h |
| 5 | Fehlende Audit-Logs hinzufügen | API | 2h |
| 6 | AttributeDataType `RANGE` hinzufügen | Schema | 15min |
| 7 | Doppelte Schema-Definitionen entfernen | Schema | 1h |

### P2 - Mittel (Backlog)

| # | Aufgabe | Bereich |
|---|---------|---------|
| 1 | Debouncing für Search-Inputs | Frontend |
| 2 | TanStack Query Migration | Frontend |
| 3 | tsvector für Volltextsuche | DB |
| 4 | Route-spezifisches Rate-Limiting | API |
| 5 | User/Moderation/File Schemas | Schema |
| 6 | CHECK Constraints für Business-Logik | DB |

### P3 - Niedrig (Optional)

| # | Aufgabe | Bereich |
|---|---------|---------|
| 1 | Virtualisierung für große Listen | Frontend |
| 2 | Legacy-Felder entfernen (siUnit, siMultiplier) | DB |
| 3 | `.brand()` für UUIDs/Slugs | Schema |
| 4 | Prisma Extensions (Soft-Delete, Audit) | DB |

---

## Teil 9: Erstellte Dokumentation

Durch diese Analyse wurden folgende neue Dokumentationen erstellt:

| Datei | Inhalt |
|-------|--------|
| [docs/database-analysis.md](database-analysis.md) | Detaillierte DB-Schema-Analyse mit Migrations-Plan |
| [docs/security/auth-security-analysis.md](security/auth-security-analysis.md) | Vollständige Auth-Sicherheitsanalyse |

---

## Teil 10: Positiv - Was gut umgesetzt wurde

### Architektur
- **2-Ebenen-Bauteil-Architektur** (CoreComponent → ManufacturerPart) - Exakt wie dokumentiert
- **Klare Service/Route-Trennung** im Backend
- **Monorepo mit shared Packages** - Gute Code-Wiederverwendung
- **Zod-First Ansatz** - Schema einmal definieren, überall nutzen

### Code-Qualität
- **TypeScript Strict Mode** - Kaum `any` Types
- **Soft-Delete** - Konsistent implementiert
- **LocalizedString** - Funktioniert wie beschrieben
- **Kategorie-Hierarchie** - 4 Ebenen korrekt implementiert

### Features
- **Audit-Logging** - Vorhanden und funktional
- **Moderation-Queue** - Vollständig implementiert
- **Pin-Mapping** - Komplett mit UI
- **Admin-UI** - Alle dokumentierten Features vorhanden

### Security
- **PKCE für OAuth** - Best Practice
- **JWKS Token-Validierung** - Keine Secrets im Backend
- **httpOnly Cookies** - XSS-Schutz
- **Rate-Limiting** - Implementiert
- **CSRF-Schutz** - Durch next-auth

---

## Durchgeführte Änderungen (2025-12-28)

### Analyse-Dateien erstellt

| Datei | Erstellt von |
|-------|--------------|
| `docs/database-analysis.md` | Database Agent |
| `docs/security/auth-security-analysis.md` | Auth Agent |
| `docs/analyse.md` (diese Datei) | Konsolidiert |

### Bisherige Code-Änderungen (aus vorheriger Session)

| Datei | Änderung |
|-------|----------|
| `apps/web/src/lib/api.ts` | Relation API-Methoden korrigiert |
| `apps/web/src/components/admin/relations-editor.tsx` | Überarbeitet für ConceptRelationType |
| `docs/architecture/database-schema.md` | ComponentStatus korrigiert |
| `docs/architecture/tech-stack.md` | Package-Strukturen aktualisiert |
| `docs/phases/phase-2-component-api.md` | Pagination Format korrigiert |
| `docs/phases/phase-4-community.md` | ConceptRelationType Tabelle hinzugefügt |

---

## Anhang: Statistiken

### Frontend
- **Dateien:** 77
- **Kritische Probleme:** 3
- **Warnings:** 14
- **Code-Duplikationen:** 3
- **ESLint-Disables:** 3

### Backend
- **Kritische Bugs:** 4
- **Wichtige Issues:** 4
- **Code-Qualität Issues:** 11
- **Security Warnings:** 7
- **Performance Issues:** 3

### Datenbank
- **Schema-Zeilen:** 807
- **Migrationen:** 2
- **Fehlende Migrationen:** 2 (kritisch)
- **Fehlende Indizes:** 4 (kritisch)

### Auth
- **Kritische Lücken:** 4
- **Mittlere Issues:** 5
- **Gut implementiert:** 6 Features

### Schemas
- **Module:** 10
- **Fehlende Schemas:** 4
- **Doppelte Definitionen:** 2
- **Enum-Inkonsistenzen:** 1

---

*Analyse abgeschlossen: 2025-12-28*
*Nächste empfohlene Aktion: P0-Aufgaben vor Production-Deploy beheben*
