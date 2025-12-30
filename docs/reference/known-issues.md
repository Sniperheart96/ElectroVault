# Bekannte Probleme und Workarounds

> **Hinweis:** Diese Datei dokumentiert aktive Probleme, Limitierungen und Workarounds für ElectroVault. Behobene Probleme werden GELÖSCHT, nicht als "erledigt" markiert.
>
> **Letzte Aktualisierung:** 2025-12-29

---

## Aktive Probleme

### Severity-Legende

| Symbol | Severity | Beschreibung |
|--------|----------|--------------|
| 🔴 | Kritisch | Blockiert Produktion oder verursacht Datenverlust |
| 🟡 | Mittel | Beeinträchtigt Funktionalität, Workaround verfügbar |
| 🟢 | Niedrig | Kosmetisch oder Minor, keine Auswirkung auf Kernfunktionalität |

---

### AUTH-001: E2E-Tests ohne echte Keycloak-Integration

| Eigenschaft | Wert |
|-------------|------|
| **ID** | AUTH-001 |
| **Severity** | 🟡 Mittel |
| **Bereich** | Testing (E2E) |
| **Betroffene Dateien** | `e2e/helpers/auth.ts` |

**Beschreibung:**
Die E2E-Tests verwenden aktuell einen Mock-Login statt echte Keycloak-Authentifizierung. Die Funktion `mockLogin()` ist als Platzhalter implementiert.

**Code-Stelle:**
```typescript
// e2e/helpers/auth.ts:88
async function mockLogin(page: Page, email: string, password: string): Promise<void> {
  // TODO: Implementierung mit direktem Token-Setup
```

**Auswirkung:**
- E2E-Tests können nicht den kompletten Auth-Flow testen
- Keycloak-spezifische Fehler werden nicht erkannt

**Workaround:**
- Unit-Tests und Integration-Tests decken Auth-Logik ab
- Manuelle Tests für Login-Flow durchführen

**Geplante Lösung:**
- Phase 1: Keycloak-Test-Container mit direktem Token-Setup
- Phase 2: Vollständiger E2E-Flow mit Keycloak-Login-Seite

---

### STORAGE-001: Keine Virus-Scans für Datei-Uploads

| Eigenschaft | Wert |
|-------------|------|
| **ID** | STORAGE-001 |
| **Severity** | 🔴 Kritisch (Production) |
| **Bereich** | File Upload (MinIO) |
| **Betroffene Dateien** | `apps/api/src/services/file.service.ts` |

**Beschreibung:**
Hochgeladene Dateien (PDFs, Bilder) werden nicht auf Viren oder Malware gescannt. Dies ist ein Sicherheitsrisiko für Production-Umgebungen.

**Auswirkung:**
- Möglicher Upload schädlicher Dateien
- Sicherheitsrisiko für Nutzer beim Download

**Workaround (Development):**
- Nur vertrauenswürdige Nutzer haben Upload-Rechte (CONTRIBUTOR+)
- Moderations-Queue prüft alle Uploads manuell

**Geplante Lösung:**
- ClamAV-Integration für automatischen Scan vor MinIO-Upload
- Quarantäne-Bucket für verdächtige Dateien
- Automatische Benachrichtigung bei Virenfund

**Blockiert durch:**
- ClamAV Docker-Container muss eingerichtet werden
- Performance-Tests für Scan-Dauer erforderlich

---

### STORAGE-002: Keine Vorschau-Generierung für Dateien

| Eigenschaft | Wert |
|-------------|------|
| **ID** | STORAGE-002 |
| **Severity** | 🟢 Niedrig |
| **Bereich** | File Upload (MinIO) |
| **Betroffene Dateien** | `apps/api/src/services/file.service.ts` |

**Beschreibung:**
Es werden keine Thumbnails oder Vorschaubilder für hochgeladene PDFs und Bilder generiert. Nutzer müssen Dateien komplett herunterladen, um Inhalt zu sehen.

**Auswirkung:**
- Schlechtere User Experience (keine Vorschau in Liste)
- Höherer Bandbreiten-Verbrauch (Download statt Thumbnail)

**Workaround:**
- Presigned URLs (24h gültig) erlauben direkten Download ohne Re-Auth
- Dateinamen und Metadaten geben Hinweise auf Inhalt

**Geplante Lösung:**
- ImageMagick/Sharp für Bild-Thumbnails
- pdf.js oder Poppler für PDF-Vorschaubilder (erste Seite)
- Separate MinIO-Bucket-Struktur: `originals/` und `thumbnails/`

---

### MODERATION-001: Keine Benachrichtigungen für Contributors

| Eigenschaft | Wert |
|-------------|------|
| **ID** | MODERATION-001 |
| **Severity** | 🟡 Mittel |
| **Bereich** | Moderation System |
| **Betroffene Dateien** | `apps/api/src/services/moderation.service.ts` |

**Beschreibung:**
Contributors erhalten keine E-Mail-Benachrichtigung, wenn ihr Beitrag freigegeben oder abgelehnt wurde. Sie müssen manuell in der UI nachsehen.

**Auswirkung:**
- Contributors wissen nicht, wann ihre Beiträge live gehen
- Bei Ablehnung keine Information, was verbessert werden muss

**Workaround:**
- Moderatoren können im Ablehnungs-Kommentar auf manuelle Benachrichtigung hinweisen
- Contributors checken Dashboard regelmäßig

**Geplante Lösung:**
- Email-Service mit Nodemailer oder SendGrid
- Template für Approval/Rejection mit Kommentar
- In-App-Notifications zusätzlich zu E-Mail

---

### MODERATION-002: Keine Detail-Vorschau in Moderations-Queue

| Eigenschaft | Wert |
|-------------|------|
| **ID** | MODERATION-002 |
| **Severity** | 🟢 Niedrig |
| **Bereich** | Moderation System |
| **Betroffene Dateien** | `apps/web/src/app/admin/moderation/page.tsx` |

**Beschreibung:**
Die Moderations-Queue zeigt nur Basis-Informationen (Name, Kategorie, Datum). Für Details muss der Moderator das Item in einem separaten Dialog öffnen.

**Auswirkung:**
- Langsamerer Moderations-Workflow
- Viele Klicks nötig für Prüfung

**Workaround:**
- Tabelle zeigt wichtigste Infos (Typ, Name, Kategorie, Ersteller)
- Dialog öffnet sich schnell (Client-side Routing)

**Geplante Lösung:**
- Expandable Table Rows mit Inline-Details
- Vorschau für Bilder/Datasheets in Hover-Card
- Bulk-Actions für schnellere Moderation

---

### I18N-001: Fehlende Übersetzung zeigt generischen Fehler

| Eigenschaft | Wert |
|-------------|------|
| **ID** | I18N-001 |
| **Severity** | 🟢 Niedrig |
| **Bereich** | Internationalisierung |
| **Betroffene Dateien** | `packages/shared/src/utils/localization.ts:36-37` |

**Beschreibung:**
Wenn ein `LocalizedString`-Objekt komplett leer ist (keine einzige Sprache hat einen Wert), wird `[MISSING TRANSLATION]` zurückgegeben. Dies ist ein sichtbarer Fehler, aber verhindert Absturz.

**Code-Stelle:**
```typescript
// packages/shared/src/utils/localization.ts:36
console.error('No localized value found for any language', { data, locale });
return '[MISSING TRANSLATION]';
```

**Auswirkung:**
- UI zeigt `[MISSING TRANSLATION]` statt sinnvollem Text
- Logging füllt sich bei vielen fehlenden Übersetzungen

**Workaround:**
- Datenbank-Constraints erzwingen mindestens eine Sprache
- Seed-Daten sind immer vollständig übersetzt
- Formular-Validierung erzwingt mindestens Englisch oder Deutsch

**Geplante Lösung:**
- Prisma-Middleware zur Validierung vor DB-Insert
- Custom Zod-Validator für `LocalizedString` mit `.refine()`
- Admin-UI zeigt Warnung bei fehlenden Übersetzungen

---

### MINIO-001: Presigned URLs funktionieren nicht mit localhost

| Eigenschaft | Wert |
|-------------|------|
| **ID** | MINIO-001 |
| **Severity** | 🟡 Mittel |
| **Bereich** | File Storage (MinIO) |
| **Betroffene Dateien** | `apps/api/src/lib/minio.ts:129-134` |

**Beschreibung:**
MinIO generiert Presigned URLs mit `localhost:9000`, aber externe Clients (z.B. Frontend auf anderem Host) können nicht auf localhost zugreifen.

**Code-Stelle:**
```typescript
// apps/api/src/lib/minio.ts:129-134
const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
if (publicEndpoint) {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  return url.replace(`${endpoint}:${port}`, publicEndpoint);
}
```

**Auswirkung:**
- Frontend kann Presigned URLs nicht nutzen, wenn nicht auf gleichem Host
- Download-Links funktionieren nicht in Production ohne `MINIO_PUBLIC_ENDPOINT`

**Workaround:**
- Environment-Variable `MINIO_PUBLIC_ENDPOINT` setzen (z.B. `files.electrovault.de:9000`)
- URL-Replacement erfolgt automatisch

**Geplante Lösung:**
- Reverse Proxy (Nginx/Caddy) vor MinIO mit öffentlicher Domain
- `/api/v1/files/:id/proxy` Endpoint zum Proxying statt direkter Presigned URLs

---

### GIT-001: Development Branch fehlt

| Eigenschaft | Wert |
|-------------|------|
| **ID** | GIT-001 |
| **Severity** | 🟢 Niedrig |
| **Bereich** | Git Workflow |
| **Betroffene Dateien** | - |

**Beschreibung:**
Das Projekt hat aktuell nur einen `main` Branch. Es fehlt ein `develop` Branch für Integration vor Production-Merge.

**Auswirkung:**
- Alle Commits gehen direkt auf `main`
- Kein Staging für Features vor Release
- Schwieriger für Contributors (direkter Push auf main)

**Workaround:**
- Feature-Branches direkt auf `main` mergen
- Gründliche Code-Reviews vor Merge
- GitHub Actions CI/CD blockt fehlerhafte Merges

**Geplante Lösung:**
- `develop` Branch erstellen und als Default setzen
- Branch Protection Rules für `main` aktivieren
- Git Flow Workflow dokumentieren

---

## Bekannte Limitierungen

Diese Einschränkungen sind bewusst gewählt oder technisch bedingt:

### L-001: Keine Echtzeit-Kollaboration

**Bereich:** Frontend (UI)

**Beschreibung:**
Mehrere Nutzer können gleichzeitig dasselbe Bauteil bearbeiten, aber sehen keine Live-Updates der anderen. Es gilt "Last Write Wins".

**Grund:**
WebSocket-Integration für Echtzeit-Updates ist für Phase 4 MVP nicht geplant. Erhöht Komplexität erheblich.

**Workaround:**
- Optimistic Locking mit `updatedAt` Timestamp
- Konflikt-Warnung beim Speichern ("Version veraltet")
- Moderation-Queue verhindert gleichzeitige Änderungen an PENDING Items

---

### L-002: Keine automatische Slug-Deduplizierung

**Bereich:** API (Component/Manufacturer Service)

**Beschreibung:**
Wenn zwei Bauteile denselben Namen haben (z.B. "555 Timer"), wird der Slug NICHT automatisch mit Suffix versehen (z.B. `555-timer-2`).

**Grund:**
Slugs sollen menschenlesbar und stabil bleiben. Automatische Suffixe verwirren Nutzer und verschlechtern SEO.

**Workaround:**
- Unique Constraint auf `slug` wirft Fehler bei Duplikat
- Frontend fordert Nutzer auf, eindeutigeren Namen zu wählen
- Moderatoren können Slugs manuell anpassen

**Beispiel:**
```
❌ Automatisch: "555-timer", "555-timer-2", "555-timer-3"
✅ Manuell: "555-timer", "555-timer-cmos", "555-timer-bipolar"
```

---

### L-003: MinIO-Dateien werden nicht physisch gelöscht

**Bereich:** File Storage (MinIO)

**Beschreibung:**
Gelöschte Dateien (`deletedAt IS NOT NULL`) bleiben physisch in MinIO gespeichert. Soft-Delete gilt auch für Storage.

**Grund:**
- Versehentliches Löschen kann rückgängig gemacht werden
- Audit-Trail bleibt vollständig
- Storage ist günstig, Datenverlust ist teuer

**Workaround:**
- Cron-Job löscht Dateien nach 90 Tagen Soft-Delete (geplant)
- Manuelle Bereinigung über Admin-Panel (geplant)

**Storage-Overhead:**
- Durchschnittlich 5-10% des Gesamtvolumens
- Akzeptabel für Development, Production braucht Cleanup-Job

---

### L-004: Keine Batch-Imports via CSV/Excel

**Bereich:** Admin-Panel (Frontend)

**Beschreibung:**
Bauteile und Hersteller müssen einzeln über Formulare angelegt werden. Es gibt keinen Import für CSV/Excel-Dateien.

**Grund:**
- Komplexe Validierung (LocalizedString, Attribute, Beziehungen)
- Error-Handling bei Batch-Imports ist komplex
- MVP fokussiert auf manuelle Erfassung

**Workaround:**
- API-Endpoints können programmatisch genutzt werden
- Scripts für Bulk-Import können direkt Prisma nutzen
- Seed-Script zeigt Beispiel für programmatischen Import

**Geplante Lösung:**
- Phase 5: CSV-Import mit Validierungs-Preview
- Template-Download für korrektes Format
- Dry-Run Mode für Fehlerprüfung

---

### L-005: Keine Full-Text-Search über alle Felder

**Bereich:** API (Search)

**Beschreibung:**
Die Suche funktioniert nur über Name, Beschreibung und MPN. Attribute, Kategorien und Relations sind nicht durchsuchbar.

**Grund:**
- PostgreSQL `ts_vector` für LocalizedString ist komplex
- Performance-Optimierung für MVP nicht prioritär
- Einfache ILIKE-Suche reicht für Phase 4

**Workaround:**
- Filter-Funktionen für Kategorie, Hersteller, Lifecycle-Status
- Erweiterte Suche über Kombination von Filtern

**Geplante Lösung:**
- PostgreSQL `tsvector` + `tsquery` für Full-Text
- Elasticsearch-Integration für komplexe Queries
- Weighted Search (Name > Beschreibung > MPN)

---

## Workarounds und Best Practices

### Umgang mit fehlenden Übersetzungen

**Problem:** Daten aus externer Quelle (z.B. API-Import) haben nur eine Sprache.

**Best Practice:**
```typescript
// ✅ RICHTIG - Mindestens eine Sprache pflegen
const name: LocalizedString = {
  en: "555 Timer",
  de: "555 Timer" // Falls keine deutsche Übersetzung: Englisch kopieren
};

// ❌ FALSCH - Leeres Objekt
const name: LocalizedString = {};
```

**Validierung:**
```typescript
import { hasTranslation } from '@electrovault/shared/utils/localization';

if (!hasTranslation(data.name)) {
  throw new BadRequestError('Name muss mindestens eine Übersetzung enthalten');
}
```

---

### MinIO Public Endpoint konfigurieren

**Problem:** Presigned URLs funktionieren nicht von externem Client.

**Lösung:**
```bash
# apps/api/.env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=electrovault-files

# Wichtig für externe Zugriffe:
MINIO_PUBLIC_ENDPOINT=192.168.1.100:9000
# Oder mit Domain:
MINIO_PUBLIC_ENDPOINT=files.electrovault.de
```

**Ergebnis:**
URLs werden automatisch von `localhost:9000` zu Public Endpoint umgeschrieben.

---

### Port-Konflikte beim Dev-Server vermeiden

**Problem:** `pnpm dev` schlägt fehl mit "Port already in use".

**Best Practice:**
```powershell
# IMMER vor dem Start prüfen:
netstat -ano | findstr ":3000 :3001"

# Falls Port belegt, Prozess beenden:
Stop-Process -Id <PID> -Force

# Dann Dev-Server starten:
pnpm dev
```

**Automatisierungs-Script:**
```powershell
# scripts/kill-dev-ports.ps1
Get-Process | Where-Object {$_.ProcessName -eq "node"} |
  Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -in 3000,3001} |
  Stop-Process -Force
```

---

### Slug-Duplikate vermeiden

**Problem:** Zwei Bauteile haben denselben Namen.

**Best Practice:**
```typescript
// ❌ Duplikat-Gefahr
name: { de: "Timer", en: "Timer" }
// → Slug: "timer" (Konflikt!)

// ✅ Eindeutig durch Kontext
name: {
  de: "555 Timer IC",
  en: "555 Timer IC"
}
// → Slug: "555-timer-ic"

// ✅ Eindeutig durch Kategorie im Namen
name: {
  de: "Timer (Analog)",
  en: "Timer (Analog)"
}
// → Slug: "timer-analog"
```

**Fehlerbehandlung:**
```typescript
try {
  await api.createComponent(data);
} catch (error) {
  if (error.code === 'CONFLICT' && error.message.includes('slug')) {
    toast.error('Ein Bauteil mit diesem Namen existiert bereits. Bitte wähle einen eindeutigeren Namen.');
  }
}
```

---

## Fehlerbehebung (Troubleshooting)

### MinIO-Verbindung schlägt fehl

**Symptom:**
```
[MinIO] Failed to ensure bucket exists: Error: connect ECONNREFUSED
```

**Ursachen und Lösungen:**

1. **MinIO Container läuft nicht**
   ```powershell
   docker ps | findstr minio
   # Wenn leer:
   cd docker/minio
   docker-compose up -d
   ```

2. **Falsche Credentials**
   ```bash
   # apps/api/.env prüfen
   MINIO_ACCESS_KEY=minioadmin  # Muss mit Docker-Config übereinstimmen
   MINIO_SECRET_KEY=minioadmin
   ```

3. **Port-Konflikt**
   ```powershell
   netstat -ano | findstr ":9000"
   # Falls belegt von anderem Dienst, MinIO-Port in docker-compose.yml ändern
   ```

---

### Keycloak-Login funktioniert nicht

**Symptom:**
Frontend zeigt "Authentication failed" nach Keycloak-Redirect.

**Ursachen und Lösungen:**

1. **Keycloak nicht erreichbar**
   ```powershell
   docker ps | findstr keycloak
   # Container muss laufen
   ```

2. **Falsche Redirect-URI**
   - Keycloak Admin Console öffnen: http://localhost:8080
   - Client "electrovault-web" öffnen
   - Valid Redirect URIs prüfen: `http://localhost:3000/*`

3. **Environment-Variablen fehlen**
   ```bash
   # apps/web/.env.local
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<generiertes-secret>
   KEYCLOAK_CLIENT_ID=electrovault-web
   KEYCLOAK_CLIENT_SECRET=<aus-keycloak>
   KEYCLOAK_ISSUER=http://localhost:8080/realms/electrovault
   ```

---

### Prisma Client generiert nicht

**Symptom:**
```
Error: @prisma/client did not initialize yet
```

**Lösung:**
```bash
# Im Root-Verzeichnis:
pnpm db:generate

# Falls Schema geändert wurde:
pnpm db:migrate

# Falls weiterhin Fehler:
rm -rf node_modules/.pnpm/@prisma
pnpm install
pnpm db:generate
```

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2025-12-30 | FILTER-001 behoben: MULTISELECT hasAny/hasAll Teilstring-Bug |
| 2025-12-29 | Initiale Erstellung der known-issues.md |

---

*Für neue Probleme: ID-Schema `BEREICH-NNN` (z.B. `AUTH-002`, `STORAGE-003`) verwenden.*
