# Installation Guide

## Entwicklungsumgebung

Das Projekt befindet sich auf dem Windows Server (ITME-SERVER) und kann dort direkt entwickelt werden.

**Arbeitsverzeichnis:** `C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault`

---

## Setup auf ITME-SERVER (Empfohlen)

### 1. Verzeichnis öffnen

```powershell
cd C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault
```

### 2. Install Dependencies

```bash
pnpm install
```

This will:
- Install all workspace dependencies
- Generate `pnpm-lock.yaml`
- Link workspace packages (@electrovault/auth, @electrovault/database, etc.)

### 3. Generate Prisma Client

```bash
pnpm db:generate
```

### 4. Setup Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local with your credentials
# - PostgreSQL connection
# - Keycloak configuration
# - MinIO credentials
```

### 5. Run Database Migration

```bash
pnpm db:migrate
```

This creates the initial database schema.

### 6. Seed Database

```bash
pnpm db:seed
```

This populates:
- Categories (Passive Components, Semiconductors, Vacuum Tubes)
- Packages (DIP-8, SOIC-8, 0805, etc.)
- Manufacturers (TI, NXP, Signetics)
- Attribute Definitions

### 7. Start Development Server

```bash
# Start API server
pnpm --filter @electrovault/api dev

# Or start all apps
pnpm dev
```

### 8. Run Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

---

## Externer Zugriff (über Netzwerk)

Falls du von einem externen PC aus arbeiten möchtest:

### Option A: Remote Desktop (RDP)

Verbinde dich per RDP zum Server und arbeite direkt dort.

### Option B: Git Clone auf lokalem PC

```powershell
# Auf deinem lokalen PC
git clone https://github.com/Sniperheart96/ElectroVault.git C:\Dev\ElectroVault
cd C:\Dev\ElectroVault
pnpm install
```

**Hinweis:** Für lokale Entwicklung benötigst du Zugriff auf die Server-Dienste:
- PostgreSQL: `ITME-SERVER:5432`
- Keycloak: `ITME-SERVER:8080`
- MinIO: `ITME-SERVER:9000`

Oder nutze das lokale Docker-Setup (siehe [docker/README.md](docker/README.md)).

---

## CI/CD

GitHub Actions automatically:
- Runs unit tests
- Runs integration tests (with PostgreSQL)
- Generates coverage reports
- Uploads to Codecov

**Hinweis:** Nach dem Hinzufügen neuer Dependencies `pnpm install` ausführen und die aktualisierte `pnpm-lock.yaml` committen.

---

## Troubleshooting

### "Dependencies lock file is not found"

**Cause:** `pnpm-lock.yaml` is missing or outdated.

**Solution:**
```bash
# On local clone
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: Update pnpm-lock.yaml"
git push
```

### "Cannot find module '@electrovault/auth'"

**Cause:** Workspace packages not linked.

**Solution:**
```bash
pnpm install --force
```

### "Prisma Client not generated"

**Cause:** Prisma Client needs to be generated.

**Solution:**
```bash
pnpm db:generate
```

---

## Prerequisites

- **Node.js:** ≥20.0.0
- **pnpm:** ≥9.0.0
- **PostgreSQL:** 15+ (on ITME-SERVER)
- **Keycloak:** 23+ (on ITME-SERVER)
- **MinIO:** S3-compatible storage (on ITME-SERVER)

---

For more information, see:
- [README.md](README.md) - Project overview
- [docs/README.md](docs/README.md) - Documentation overview
- [docs/phases/phase-0-setup.md](docs/phases/phase-0-setup.md) - Phase 0 status
- [docs/phases/phase-1-database-auth.md](docs/phases/phase-1-database-auth.md) - Phase 1 status
