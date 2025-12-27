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
