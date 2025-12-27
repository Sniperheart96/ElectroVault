# Installation Guide

## ⚠️ Important: UNC Path Limitation

This project is currently located on a network share (`\\ITME-SERVER\Projekte\ElectroVault`), which has limitations for Node.js tooling.

**Problem:** `pnpm install` cannot be executed directly from a UNC path in Windows.

**Solution:** Clone to a local path for development.

---

## Local Setup (Recommended)

### 1. Clone to Local Path

```powershell
# Clone to local drive
git clone https://github.com/Sniperheart96/ElectroVault.git C:\Dev\ElectroVault
cd C:\Dev\ElectroVault
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

## Network Path Usage

If you must work from the network path (`\\ITME-SERVER\Projekte\ElectroVault`):

### Limitations

- ❌ Cannot run `pnpm install`
- ❌ Cannot run `pnpm db:migrate`
- ❌ Cannot start dev servers
- ✅ Can edit files
- ✅ Can commit changes
- ✅ Can push to GitHub

### Workflow

1. Make code changes on network path
2. Commit and push to GitHub
3. GitHub Actions will run tests automatically
4. For local testing, pull changes to local clone

---

## CI/CD

GitHub Actions automatically:
- Runs unit tests
- Runs integration tests (with PostgreSQL)
- Generates coverage reports
- Uploads to Codecov

**Note:** After adding new dependencies, you MUST run `pnpm install` locally and commit the updated `pnpm-lock.yaml` file.

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
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) - Full implementation plan
- [docs/PHASE_0_STATUS.md](docs/PHASE_0_STATUS.md) - Phase 0 status
- [docs/database/PHASE-1-COMPLETE.md](docs/database/PHASE-1-COMPLETE.md) - Phase 1 status
