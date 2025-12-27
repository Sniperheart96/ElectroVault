# ElectroVault

Eine Community-gepflegte Datenbank für elektrische Bauteile mit Fokus auf historische und moderne Komponenten, Geräte-Reparatur-Dokumentation und Schaltplan-Digitalisierung.

## Features

- **Umfassende Bauteil-Datenbank**: Von Röhren bis Nanotechnologie
- **2-Ebenen-Architektur**: Logische Bauteile (CoreComponent) + Hersteller-Produkte (ManufacturerPart)
- **Mehrsprachigkeit**: i18n-ready mit lokalisierten Inhalten
- **Detaillierte Metadaten**: Gefahrstoffe, Datierung, Militär-Specs, ECAD-Modelle
- **Schaltplan-Digitalisierung**: Für historische Geräte
- **Wiederverwendbares Auth-System**: Keycloak-basiert

## Tech-Stack

| Komponente | Technologie |
|------------|-------------|
| Frontend | Next.js 14+ (App Router), TailwindCSS, shadcn/ui |
| Backend | Fastify, Prisma, PostgreSQL |
| Auth | Keycloak + next-auth |
| Storage | MinIO (S3-kompatibel) |
| Monorepo | Turborepo + pnpm |
| Sprache | Deutsch (i18n-ready) |

## Projektstruktur

```
electrovault/
├── .claude/                    # KI-Kontext & Agenten
│   ├── CLAUDE.md              # Haupt-Kontext-Dokument
│   ├── settings.json          # Berechtigungen, Hooks, MCP
│   └── agents/                # Spezialisierte Agenten
├── apps/
│   ├── web/                   # Next.js Frontend + Admin
│   └── api/                   # Fastify Backend
├── packages/
│   ├── database/              # Prisma Schema & Extensions
│   ├── schemas/               # Zod-Validierung (shared)
│   ├── auth/                  # Keycloak/next-auth Wrapper
│   ├── ui/                    # shadcn/ui Komponenten
│   └── shared/                # Utils, Types, Constants
├── docker/                    # Container-Configs
└── docs/                      # Dokumentation
```

## Quick Start

### Voraussetzungen

- Node.js 20+
- pnpm 9+
- **Zugriff auf ITME-SERVER** mit:
  - PostgreSQL Development Server (Port 5432)
  - Keycloak (Port 8080)
  - MinIO (Port 9000/9001)
- **Alternativ:** Lokale Entwicklung mit Docker (siehe [docker/README.md](docker/README.md))

### Installation

1. **Repository klonen**

```bash
git clone <repository-url>
cd electrovault
```

2. **Dependencies installieren**

```bash
pnpm install
```

3. **Umgebungsvariablen konfigurieren**

```bash
cp .env.example .env.local
# Bearbeite .env.local mit deinen Credentials
# WICHTIG: Füge das PostgreSQL Admin-Passwort hinzu
```

4. **Datenbank & User erstellen** (einmalig)

```powershell
# Auf Windows (PowerShell)
.\scripts\setup-database.ps1

# Oder manuell mit psql
# psql -h ITME-SERVER -U postgres -c "CREATE DATABASE ElectroVault_Dev;"
# psql -h ITME-SERVER -U postgres -c "CREATE USER ElectroVault_dev_user WITH PASSWORD 'password';"
# psql -h ITME-SERVER -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ElectroVault_Dev TO ElectroVault_dev_user;"
```

5. **Datenbank-Migration**

```bash
pnpm db:migrate
```

5. **Entwicklungsserver starten**

```bash
pnpm dev
```

Die Anwendung ist nun verfügbar:
- Frontend: http://localhost:3000
- API: http://localhost:3001

## Verfügbare Befehle

```bash
# Entwicklung
pnpm dev          # Alle Apps starten
pnpm build        # Production Build
pnpm lint         # ESLint + Prettier
pnpm test         # Tests ausführen
pnpm format       # Code formatieren

# Datenbank
pnpm db:migrate   # Migration ausführen
pnpm db:seed      # Seed-Daten laden
pnpm db:studio    # Prisma Studio öffnen
pnpm db:reset     # Datenbank zurücksetzen (Vorsicht!)
```

## Docker Setup

Für lokale Entwicklung ohne nativen Server-Setup:

```bash
cd docker
cp .env.example .env
docker-compose --profile local-dev up -d
```

Siehe [docker/README.md](docker/README.md) für Details.

## Dokumentation

- [Implementierungsplan](docs/IMPLEMENTATION_PLAN.md) - Vollständiger technischer Plan
- [KI-Kontext](.claude/CLAUDE.md) - Kontext für KI-gestützte Entwicklung
- [Agenten](.claude/agents/) - Spezialisierte Entwicklungs-Agenten

## Wichtige Konzepte

### 2-Ebenen-Bauteil-Architektur

```
CoreComponent (Logisches Bauteil)
    ↓ 1:n
ManufacturerPart (Konkretes Produkt)
```

- **CoreComponent**: Herstellerunabhängig (z.B. "555 Timer")
- **ManufacturerPart**: Konkretes Produkt (z.B. "TI NE555P")

### Attribut-Scope

| Scope | Bedeutung |
|-------|-----------|
| COMPONENT | Gilt für alle Hersteller |
| PART | Herstellerspezifisch |
| BOTH | Typisch auf Component, garantiert auf Part |

### Lokalisierung

Alle Freitextfelder werden als JSON gespeichert:

```typescript
{ "de": "Kondensator", "en": "Capacitor" }
```

Fallback-Kette: Angefragte Sprache → Englisch → Erste verfügbare

## Server-Umgebung (ITME-SERVER)

ElectroVault nutzt die **existierenden Services** auf dem ITME-SERVER:

```
PostgreSQL Development Server: Port 5432
  └─ Datenbank: ElectroVault_Dev
  └─ User: ElectroVault_dev_user
Keycloak: Port 8080
  └─ Realm: electrovault
MinIO: Port 9000/9001
  └─ Bucket: electrovault-files
```

## Konventionen

1. **Soft-Delete** - Nichts wird physisch gelöscht
2. **Audit-Logging** - Jede Mutation wird protokolliert
3. **Zod-First** - Schema einmal definieren, überall nutzen
4. **Deutsche UI** - Aber i18n-ready
5. **TypeScript strict** - Keine `any` Types
6. **Keine Dummy-Daten** - Fallbacks dürfen keine Fake-Daten zurückgeben

## Lizenz

[Lizenz hier eintragen]

## Beiträge

Contributions sind willkommen! Bitte lies die Contribution Guidelines bevor du einen PR erstellst.

---

**Stand:** 2025-12-27 | **Version:** 0.1.0 (Phase 0)
