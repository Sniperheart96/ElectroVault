# Changelog

Alle wichtigen Änderungen am ElectroVault-Projekt werden in dieser Datei dokumentiert.

## [Unreleased]

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
