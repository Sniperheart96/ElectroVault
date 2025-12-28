# Changelog

Alle wichtigen Änderungen am ElectroVault-Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

### Geändert
- **Entwicklungsumgebung:** Claude Code läuft jetzt direkt auf ITME-SERVER
  - Alle UNC-Pfad-Referenzen entfernt
  - Dokumentation für direkten Server-Betrieb aktualisiert
  - Befehle können ohne Workarounds ausgeführt werden

### Aktualisierte Dateien
- `.claude/CLAUDE.md` - Neuer Abschnitt "Ausführungsumgebung" und "Wichtige Hinweise"
- `.claude/agents/infrastructure-agent.md` - Lokale Pfade statt Netzwerk-Pfade
- `INSTALL.md` - Überarbeitet für direkten Server-Zugriff

---

## [0.6.0] - 2025-12-28 - UI-Restrukturierung: Integrierte Dialoge

### Geändert

#### Dialoge erweitert mit Tab-Navigation
- **ComponentDialog** (`apps/web/src/components/admin/component-dialog.tsx`)
  - Neu: Tab-Navigation mit "Stammdaten" und "Hersteller-Varianten"
  - Hersteller-Varianten werden jetzt direkt im Dialog verwaltet (nicht mehr separate Seite)
  - Tab "Hersteller-Varianten" nur beim Bearbeiten aktiv
  - Warnung wenn keine Varianten vorhanden (mind. 1 erforderlich)
  - CRUD für Parts direkt im Dialog integriert

- **CategoryDialog** (`apps/web/src/components/admin/category-dialog.tsx`)
  - Neu: Tab-Navigation mit "Stammdaten" und "Attribute"
  - Attribute werden jetzt direkt im Dialog verwaltet (nicht mehr separate Seite)
  - Tab "Attribute" nur beim Bearbeiten aktiv
  - Zeigt eigene Attribute und vererbte Attribute (von Parent-Kategorien)
  - Vererbte Attribute in Collapsible-Bereich mit Quell-Kategorie
  - CRUD für Attribute direkt im Dialog integriert

#### Admin-Seiten vereinfacht
- **Categories-Seite** (`apps/web/src/app/admin/categories/page.tsx`)
  - Zurück auf 1-Spalten-Layout (nur Kategorie-Baum)
  - Kein separates Attribut-Panel mehr nötig

- **Components-Seite** (`apps/web/src/app/admin/components/page.tsx`)
  - Zurück auf 1-Spalten-Layout (nur Bauteil-Tabelle)
  - Kein separates Parts-Panel mehr nötig

### Entfernt
- `apps/web/src/app/admin/attributes/` - Separate Attribut-Seite (in CategoryDialog integriert)
- `apps/web/src/app/admin/parts/` - Separate Parts-Seite (in ComponentDialog integriert)
- `apps/web/src/components/admin/category-attributes-panel.tsx` - Nicht mehr benötigt
- `apps/web/src/components/admin/component-parts-panel.tsx` - Nicht mehr benötigt
- Admin-Sidebar-Einträge für "Attribute" und "Hersteller-Varianten"

### Hinzugefügt
- **Tabs UI-Komponente** (`apps/web/src/components/ui/tabs.tsx`)
  - Radix UI Tabs-Wrapper für shadcn/ui Styling
  - Package: `@radix-ui/react-tabs`

### Workflow-Änderungen
**Vorher:**
- Separate Seiten für Attribute und Hersteller-Varianten
- Nutzer musste zwischen Seiten wechseln

**Nachher:**
- Alles in einem Dialog
- Bauteil bearbeiten → Tab "Hersteller-Varianten" → Varianten verwalten
- Kategorie bearbeiten → Tab "Attribute" → Attribute verwalten (mit Vererbungsanzeige)

---

## [0.5.0] - 2025-12-28 - Admin-Panel & 2-Ebenen-Architektur UI

### Hinzugefügt

#### Attribut-Definition Verwaltung
- **API & Service** (`apps/api/src/services/attribute.service.ts`)
  - CRUD für Attribut-Definitionen pro Kategorie
  - Kategorie-Vererbung (Attribute von Parent-Kategorien)
  - Audit-Logging für alle Änderungen
- **Routes** (`apps/api/src/routes/attributes/index.ts`)
  - `GET /api/v1/attributes` - Liste mit Filterung
  - `POST /api/v1/attributes` - Neue Definition erstellen
  - `GET /api/v1/attributes/:id` - Details abrufen
  - `PATCH /api/v1/attributes/:id` - Aktualisieren
  - `DELETE /api/v1/attributes/:id` - Löschen
- **Admin-UI** (`apps/web/src/app/admin/attributes/page.tsx`)
  - Tabelle mit Filterung nach Kategorie
  - Dialog für Erstellen/Bearbeiten
  - Datentyp-Auswahl (Decimal, Integer, String, Boolean, Range)
  - Scope-Auswahl (Component, Part, Both)

#### ManufacturerPart (Hersteller-Varianten) Verwaltung
- **Erweiterte API** (`apps/api/src/routes/parts/index.ts`)
  - `GET /api/v1/parts/:id/attributes` - Attributwerte abrufen
  - `PUT /api/v1/parts/:id/attributes` - Attributwerte setzen
- **Erweiterte Routes** (`apps/api/src/routes/components/index.ts`)
  - `GET /api/v1/components/:id/parts` - Parts eines Components
- **Admin-UI** (`apps/web/src/app/admin/parts/page.tsx`)
  - Vollständige CRUD-Oberfläche
  - Auswahl von Component, Hersteller, Package
  - Lifecycle-Status (ACTIVE, NRND, EOL, OBSOLETE)
  - Compliance-Felder (RoHS, REACH)

#### Package/Bauformen Verwaltung
- **Admin-UI** (`apps/web/src/app/admin/packages/page.tsx`)
  - Tabelle mit Suche
  - Dialog für Erstellen/Bearbeiten
  - Mounting-Types: THT, SMD, Radial, Axial, Chassis, Other
  - Dimensionen (L/W/H), Pitch, Pin-Count
  - JEDEC/EIA Standards

### Korrigiert

#### TypeScript-Fehler & Schema-Konsistenz
- **Component Status** korrigiert: `DRAFT | PENDING | PUBLISHED | ARCHIVED`
  - Vorher fälschlicherweise `ACTIVE | NRND | EOL | OBSOLETE` verwendet
  - Betrifft: `component-dialog.tsx`, `admin/components/page.tsx`, `api.ts`
- **Part Interface** erweitert um:
  - `coreComponentId` (statt `componentId`)
  - `lifecycleStatus` (ACTIVE/NRND/EOL/OBSOLETE)
  - `orderingCode`, `package`, `weightGrams`, `dateCodeFormat`
  - `rohsCompliant`, `reachCompliant`, `nsn`, `milSpec`
- **Package MountingType** korrigiert: `THT | SMD | RADIAL | AXIAL | CHASSIS | OTHER`
  - Vorher fälschlicherweise `HYBRID` verwendet
- **AuditService-Aufrufe** in `category.service.ts`:
  - `auditService.log()` → `auditService.logCreate/logUpdate/logDelete()`
- **zodResolver Type-Casting** für react-hook-form Kompatibilität

### Neue Dateien
```
apps/api/src/
├── services/attribute.service.ts      # Attribut-Definition Service
├── routes/attributes/index.ts         # Attribut-Endpoints
packages/schemas/src/
├── attribute.ts                       # Attribut-Definition Schemas
apps/web/src/
├── app/admin/
│   ├── attributes/page.tsx           # Attribut-Verwaltung
│   ├── packages/page.tsx             # Package-Verwaltung
│   └── parts/page.tsx                # Parts-Verwaltung
├── components/admin/
│   ├── attribute-dialog.tsx          # Attribut-Formular
│   ├── package-dialog.tsx            # Package-Formular
│   └── part-dialog.tsx               # Part-Formular
├── hooks/
│   └── use-categories-flat.ts        # Kategorie-Helfer Hook
```

### Technische Details
- **TypeScript:** Alle Fehler in Web und API behoben
- **Schemas:** Attribut-Schemas hinzugefügt zu `@electrovault/schemas`
- **Admin-Sidebar:** Neue Links für Attribute, Bauformen, Hersteller-Varianten

---

## [0.4.0] - 2025-12-27 - Phase 3: Frontend Basis (In Arbeit)

### Hinzugefügt
- **Next.js 15 Frontend** (`@electrovault/web`)
  - App Router mit Server Components
  - TailwindCSS + shadcn/ui Design System
  - next-intl für Mehrsprachigkeit (DE/EN)
  - React 19 mit neuesten Features

- **Seiten**
  - Homepage mit Suchfeld, Statistiken, Featured Categories
  - Komponenten-Liste mit Pagination
  - Kategorie-Browser mit rekursiver Baum-Darstellung
  - Hersteller-Liste mit Pagination und Status-Badges
  - Auth-Seiten (Sign-in, Sign-out, Error)

- **NextAuth Integration**
  - KeycloakProvider konfiguriert
  - JWT Token Refresh
  - Rollen-Extraktion aus Keycloak Token
  - Session mit accessToken und Rollen
  - Logout-Sync mit Keycloak

- **Route Protection** (`middleware.ts`)
  - `/admin/*` erfordert admin oder moderator Rolle
  - `/profile/*` erfordert Authentifizierung
  - `/contribute/*` erfordert contributor Rolle

- **UI-Komponenten**
  - Button (alle Varianten)
  - Input
  - Card (Header, Content, Footer)
  - Badge (success, warning, destructive)

- **Utilities**
  - API-Client mit Auth-Support
  - Server-side Auth Utilities
  - cn() Helper für Tailwind

### Neue Dateien
```
apps/web/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Homepage
│   │   ├── components/page.tsx       # Komponenten-Liste
│   │   ├── categories/page.tsx       # Kategorie-Browser
│   │   ├── manufacturers/page.tsx    # Hersteller-Liste
│   │   ├── auth/signin/page.tsx      # Login
│   │   ├── auth/signout/page.tsx     # Logout
│   │   ├── auth/error/page.tsx       # Auth-Fehler
│   │   └── api/auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── ui/{button,input,card,badge}.tsx
│   │   ├── layout/{header,footer}.tsx
│   │   └── providers/session-provider.tsx
│   ├── lib/
│   │   ├── api.ts                    # API-Client
│   │   ├── auth.ts                   # NextAuth Config
│   │   ├── auth-server.ts            # Server-side Auth
│   │   └── utils.ts
│   ├── middleware.ts                 # Route Protection
│   └── i18n/request.ts               # next-intl Config
├── messages/{de,en}.json             # Übersetzungen
└── {next,tailwind,postcss}.config.*  # Konfiguration
```

### Technische Details
- **Next.js:** 15.1.3 mit App Router
- **React:** 19.0.0
- **Auth:** NextAuth 4.24.0 + Keycloak
- **i18n:** next-intl 3.20.0
- **Styling:** TailwindCSS 3.4.0 + Radix UI

### Dokumentiert
- `docs/phases/phase-3-frontend.md` - Vollständig aktualisiert (90%)

### Ausstehend
- Komponenten-Detailseite
- Such-Interface
- Admin-Dashboard
- Formular-Komponenten

---

## [0.3.0] - 2025-12-27 - Phase 2: Component API

### Hinzugefügt
- **Zod-Schemas** (`@electrovault/schemas`)
  - `common.ts` - LocalizedString, Pagination, Enums
  - `category.ts` - Category-Schemas (Base, Tree, Path)
  - `manufacturer.ts` - Manufacturer-Schemas (CRUD)
  - `package.ts` - Package-Schemas (CRUD, Footprints)
  - `component.ts` - CoreComponent-Schemas (CRUD, Relations)
  - `part.ts` - ManufacturerPart-Schemas (CRUD)
  - `audit.ts` - AuditLog-Schemas (Query, History)
  - 42 Schema-Tests

- **Services** (`apps/api/src/services/`)
  - `category.service.ts` - Read-Only, Baum-Struktur, Pfad-Navigation
  - `manufacturer.service.ts` - CRUD mit Schnellsuche
  - `package.service.ts` - CRUD mit Footprint-Verwaltung
  - `component.service.ts` - CRUD mit Konzept-Relations
  - `part.service.ts` - CRUD mit Lagerbestand-Updates
  - `audit.service.ts` - Logging, History, Statistiken

- **Routes** (`apps/api/src/routes/`)
  - `/api/v1/categories` - Kategorie-Endpoints (read-only)
  - `/api/v1/manufacturers` - Hersteller-Endpoints (CRUD)
  - `/api/v1/packages` - Package-Endpoints (CRUD)
  - `/api/v1/components` - Component-Endpoints (CRUD)
  - `/api/v1/parts` - Part-Endpoints (CRUD)
  - `/api/v1/audit` - Audit-Log-Endpoints

- **Utilities** (`apps/api/src/lib/`)
  - `errors.ts` - ApiError, NotFoundError, ValidationError
  - `pagination.ts` - Prisma Pagination-Helpers
  - `slug.ts` - Slug-Generierung aus LocalizedString

### Technische Details
- **Tests:** 81 Tests (alle bestehen)
- **Endpoints:** 35+ API-Endpoints
- **Auth:** Role-based Access Control (VIEWER, CONTRIBUTOR, MODERATOR, ADMIN)
- **Features:** Soft-Delete, Audit-Logging, Pagination, Autocomplete-Suche

### Dokumentiert
- `docs/phases/phase-2-component-api.md` - Vollständig aktualisiert
- `docs/README.md` - Phase 2 Status auf 100%

---

## [0.2.0] - 2025-12-27 - Phase 1 Implementiert

### Hinzugefügt
- **Auth-Package** (`@electrovault/auth`)
  - Keycloak JWT-Token-Validierung mit JWKS
  - Fastify Auth-Plugin mit `requireAuth`, `requireRole`, `optionalAuth`
  - NextAuth-Integration mit automatischem Token-Refresh
  - User-Sync-Service für Keycloak → PostgreSQL
  - 17 Tests (9 Unit, 8 Integration)

- **Fastify-Server** (`@electrovault/api`)
  - App-Builder mit CORS, Helmet, Rate-Limiting
  - Auth-Plugin-Integration
  - Health-Check-Endpoint (`/health`)
  - Protected User-Info-Endpoint (`/api/v1/me`)
  - Error-Handling & Not-Found-Handler
  - Graceful Shutdown
  - 6 Integration-Tests

- **Seed-Daten** (`packages/database/prisma/seed.ts`)
  - Kategorie-Hierarchie (Passive Components, Semiconductors, Vacuum Tubes)
  - Attribut-Definitionen (Capacitance, Voltage Rating, ESR, Resistance, Tolerance)
  - Package Masters (DIP-8, DIP-14, TO-220, SOIC-8, 0805, 1206, Radial)
  - Hersteller (Texas Instruments, NXP, Signetics)

### Dokumentiert
- [`docs/database/PHASE-1-COMPLETE.md`](database/PHASE-1-COMPLETE.md) - Vollständiger Implementierungsbericht
- [`docs/IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) - Phase 1 auf 95% aktualisiert

### Technische Details
- **Prisma-Schema:** 716 Zeilen (vollständig)
- **Tests:** 23 Tests (Auth: 17, API: 6)
- **Dependencies:** Fastify 4.x, jose 5.x, next-auth 4.x
- **Auth-Flow:** Keycloak OAuth → JWT → User Sync → Session

**Fehlende Komponente:** Initiale Prisma-Migration

---

### 2025-12-27 - Korrektur: PostgreSQL Development Server

#### Geändert
- **Klarstellung:** ElectroVault nutzt den **existierenden PostgreSQL Development Server** auf ITME-SERVER
- Alle Dokumentation aktualisiert, um dies klarzustellen
- Keine Installation eines neuen "PostgreSQL 18" Servers erforderlich

#### Hinzugefügt
- PostgreSQL Admin-Passwort zu `.env.local` und `.env.example`
- `scripts/setup-database.ps1` - Automatisches Setup-Script für Datenbank und User
- `scripts/README.md` - Dokumentation für Setup-Scripts
- Detaillierte Anweisungen in README.md für Datenbank-Setup

#### Aktualisierte Dateien
- `.env.local` - PostgreSQL Admin-Credentials hinzugefügt
- `.env.example` - Template für Admin-Credentials
- `README.md` - Voraussetzungen und Setup-Schritte aktualisiert
- `docs/PHASE_0_STATUS.md` - Datenbank-Setup-Anweisungen
- `docs/IMPLEMENTATION_PLAN.md` - Server-Status aktualisiert

#### Technische Details
- **PostgreSQL Server:** Development Server auf ITME-SERVER:5432
- **Datenbank:** ElectroVault_Dev (wird von Script erstellt)
- **User:** ElectroVault_dev_user / Passwort: password
- **Admin:** postgres / Passwort: [in .env.local gespeichert]

---

## [0.1.0] - 2025-12-27 - Phase 0 Abgeschlossen

### Hinzugefügt
- Komplettes Monorepo-Setup mit Turborepo und pnpm
- Vollständiges Prisma-Schema (2-Ebenen-Bauteil-Architektur)
- i18n-Infrastruktur (LocalizedString mit Fallback-Kette)
- Docker Compose für lokale Entwicklung
- Keycloak Realm-Konfiguration
- MinIO Bucket-Setup
- 7 spezialisierte Claude-Agenten
- Umfassende Dokumentation

Siehe [`docs/PHASE_0_STATUS.md`](PHASE_0_STATUS.md) für Details.
