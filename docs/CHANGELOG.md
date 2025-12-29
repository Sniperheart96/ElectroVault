# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

## [Unreleased]

### Hinzugefügt
- **Bekannte Probleme Dokumentation** (2025-12-29)
  - Neue Datei `docs/reference/known-issues.md` erstellt
  - 7 aktive Probleme dokumentiert (AUTH-001, STORAGE-001/002, MODERATION-001/002, I18N-001, MINIO-001, GIT-001)
  - 5 bekannte Limitierungen dokumentiert (L-001 bis L-005)
  - Workarounds und Best Practices für häufige Probleme
  - Troubleshooting-Sektion für MinIO, Keycloak, Prisma
  - ID-Schema für neue Probleme definiert (`BEREICH-NNN`)

### Dokumentation
- **API Helper-Funktionen dokumentiert** (2025-12-29)
  - Neue Datei `docs/architecture/api-helpers.md` erstellt
  - MinIO-Integration komplett dokumentiert (Lazy Init, Presigned URLs, File Operations)
  - URL-Helpers für Proxy-URLs und MIME-Types
  - Error Classes (ApiError, NotFoundError, ConflictError, etc.)
  - Slug-Generierung mit Umlaut-Handling
  - Pagination-Utilities für Prisma
  - JSON-Helpers für LocalizedString-Konvertierung
  - Best Practices für alle Helper-Module
- **i18n.md aktualisiert** (2025-12-29)
  - Code-Beispiele an tatsächliche Implementierung angepasst
  - `FALLBACK_LOCALE` Konstante dokumentiert (statt hard-coded `'de'` oder `'en'`)
  - `SUPPORTED_LOCALES` Array dokumentiert
  - Anleitung "Neue Sprache hinzufügen" erweitert (inkl. `SUPPORTED_LOCALES` Update)
  - Imports in Code-Beispielen korrigiert (`packages/shared/src/i18n/types`)

### Entfernt
- **Pin-Mapping API-Bereinigung** (2025-12-29)
  - Ungenutztes `PinMappingSchema` mit `partId` aus `packages/schemas/src/pin.ts` entfernt
  - API-Methode `api.getPin(id)` entfernt - Pins werden über Part geladen (`getPinsByPartId`)
  - Backend-Route `GET /pins/:id` entfernt
  - Service-Methode `getPinById()` entfernt
  - **Begründung:** Pins gehören immer zu einem ManufacturerPart. Einzelne Pin-Abfragen ohne Part-Kontext sind unnötig.

### Geändert
- **Schema-Konsistenz** (2025-12-29)
  - Inline `z.enum()` für PinType in `packages/schemas/src/part.ts` durch `PinTypeSchema` ersetzt

## [0.1.0] - 2025-12-28

### Hinzugefügt
- Phase 2: Component API komplett implementiert
- Phase 3: Frontend mit Admin-Panel
- Phase 4: Community Features (MVP)
- Datei-Upload-System mit MinIO
- Pin-Mapping Editor für Bauteile
- Moderation-System für User-Beiträge

### Dokumentation
- Architektur-Dokumentation erstellt
- Phasen-Dokumentation für Phase 0-4
- Pin-Mapping UI-Dokumentation

---

*Format: [Version] - YYYY-MM-DD*
