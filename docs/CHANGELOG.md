# Changelog

Alle wichtigen Änderungen am ElectroVault-Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

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

**Fehlende Komponente:** Initiale Prisma-Migration (erfordert lokales Setup, UNC-Pfad-Limitation)

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
