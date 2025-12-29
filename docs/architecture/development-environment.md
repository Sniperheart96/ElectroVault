# Entwicklungsumgebung

> Server-Setup und Credentials für ElectroVault

## Aktuelle Konfiguration

| Komponente | Ort | Status |
|------------|-----|--------|
| Claude Code | Windows Server (ITME-SERVER) | ✅ Läuft |
| PostgreSQL 18 | Windows Server (Port 5432) | ✅ Läuft |
| Keycloak | Windows Server (Port 8080) | ✅ Läuft |
| MinIO | Windows Server (Port 9000/9001) | ✅ Läuft |

---

## Server-Details

### PostgreSQL

```
Host: localhost (auf ITME-SERVER)
Port: 5432
Version: PostgreSQL 18
pgAdmin Server: "Development"
Datenbank: electrovault_dev
User: electrovault_dev_user
Passwort: password
```

**Admin-Zugang:**
```
User: postgres
Passwort: (in .env.local gespeichert)
```

### Keycloak

```
URL: http://ITME-SERVER:8080
Realm: electrovault
Admin-Console: http://ITME-SERVER:8080/admin
```

**Admin-Zugang (Keycloak-Console):**
```
User: admin
Passwort: admin123
```

**Testbenutzer (ElectroVault-Anwendung):**

| Benutzer | Passwort | Rolle |
|----------|----------|-------|
| evadmin | admin123 | admin |
| testuser | test123 | contributor |

**Rollen:**
- admin
- moderator
- contributor
- viewer

**Clients:**
- `electrovault-web` (Frontend)
- `electrovault-api` (Backend)

### MinIO

```
Endpoint: http://ITME-SERVER:9000
Console: http://ITME-SERVER:9001
Bucket: electrovault-files
```

---

## Credentials-Verwaltung

### Dateistruktur

```
electrovault/
├── .env.example          # Template (wird committed)
├── .env.local            # Echte Credentials (gitignored!)
├── .env.development      # Entwicklungs-Overrides (optional)
└── .env.production       # Produktion-Overrides (optional)
```

### .env.example (Template)

```env
# === PostgreSQL ===
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=electrovault_dev
DATABASE_USER=electrovault_dev_user
DATABASE_PASSWORD=password
DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public"

# PostgreSQL Admin (nur für Setup/Migrationen)
POSTGRES_ADMIN_USER=postgres
POSTGRES_ADMIN_PASSWORD=

# === Keycloak ===
KEYCLOAK_URL=http://ITME-SERVER:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=

# === MinIO ===
MINIO_ENDPOINT=ITME-SERVER
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET=electrovault-files

# === Anwendung ===
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001
WEB_PORT=3000

# === Sicherheit ===
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## Häufige Befehle

### Entwicklung

```bash
pnpm install          # Dependencies installieren
pnpm dev              # Alle Apps starten (Frontend :3000, API :3001)
pnpm build            # Production Build
pnpm test             # Tests ausführen
```

### Datenbank

```bash
pnpm db:generate      # Prisma Client generieren
pnpm db:migrate       # Migration ausführen
pnpm db:seed          # Seed-Daten laden
pnpm db:studio        # Prisma Studio öffnen
pnpm db:reset         # Datenbank zurücksetzen (Vorsicht!)
```

### Server-Dienste prüfen (PowerShell)

```powershell
# PostgreSQL Status
Get-Service postgresql*

# Port-Belegung prüfen
netstat -ano | findstr ":5432 :8080 :9000"

# Docker Container Status (falls verwendet)
docker ps
```

---

## Setup-Scripts

### Datenbank erstellen

```powershell
# scripts/setup-database.ps1
.\scripts\setup-database.ps1
```

### Verbindung testen

```powershell
# scripts/test-db-connection.ps1
.\scripts\test-db-connection.ps1
```

---

## Migrations-Strategie

### Workflow

```bash
# 1. Neue Migration erstellen (Entwicklung)
pnpm prisma migrate dev --name beschreibender_name

# 2. Migration reviewen
cat packages/database/prisma/migrations/*/migration.sql

# 3. Tests laufen lassen
pnpm test

# 4. In Staging deployen
DATABASE_URL=$STAGING_DB pnpm prisma migrate deploy

# 5. Nach Validierung: Produktion
DATABASE_URL=$PROD_DB pnpm prisma migrate deploy
```

### Rollback-Strategie

```bash
# Entwicklung: Kompletter Reset (ACHTUNG: Datenverlust!)
pnpm prisma migrate reset

# Produktion: Manuelles Rollback-Script
psql -f rollback_XXXXXX.sql

# Alternativ: Point-in-Time Recovery aus Backup
```

---

## Backup-Strategie

### Tägliche Backups

```powershell
# Windows Task Scheduler Script (täglich 02:00 Uhr)
$date = Get-Date -Format "yyyy-MM-dd"
$backupDir = "D:\Backups\ElectroVault"

# PostgreSQL Dump
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" `
  -h localhost -U postgres -d electrovault_dev `
  -f "$backupDir\db-$date.sql"

# MinIO Bucket Sync
mc mirror local/electrovault-files "$backupDir\files-$date"
```

---

*Siehe auch: [tech-stack.md](tech-stack.md) | [database-schema.md](database-schema.md)*
