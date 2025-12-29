# ElectroVault - Development Setup

Diese Anleitung beschreibt das vollständige Setup der ElectroVault-Entwicklungsumgebung.

## Voraussetzungen

### Software-Anforderungen

| Software | Mindestversion | Empfohlen | Verwendung |
|----------|----------------|-----------|------------|
| **Node.js** | 20.0.0 | 20.x LTS | JavaScript Runtime |
| **pnpm** | 9.0.0 | 9.15.0 | Package Manager |
| **Docker** | 24.0 | 26.x | Container für Services |
| **Git** | 2.30 | Latest | Versionskontrolle |
| **PostgreSQL** | 16 | 18.x | Datenbank (nativ oder Docker) |

### Installation prüfen

```bash
# Node.js Version
node --version  # Sollte v20.x.x oder höher sein

# pnpm Version
pnpm --version  # Sollte 9.x.x oder höher sein

# Docker Version
docker --version

# Git Version
git --version
```

### pnpm installieren

Falls pnpm nicht installiert ist:

```bash
# Via npm (global)
npm install -g pnpm@9.15.0

# Oder via PowerShell (Windows)
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

## Server-Umgebung (ITME-SERVER)

ElectroVault läuft aktuell auf einem Windows Server:

| Komponente | Host | Port | Status |
|------------|------|------|--------|
| PostgreSQL 18 | ITME-SERVER | 5432 | Nativ |
| Keycloak | ITME-SERVER | 8080 | Docker/Dienst |
| MinIO | ITME-SERVER | 9000/9001 | Docker/Dienst |
| Frontend (Dev) | localhost | 3000 | On-Demand |
| API (Dev) | localhost | 3001 | On-Demand |

**Lokale Entwicklung:**

Wenn du auf einem anderen Rechner entwickelst, ersetze `ITME-SERVER` durch die tatsächliche IP-Adresse oder den Hostnamen des Servers.

## PostgreSQL Setup

### Variante A: Nativer PostgreSQL-Server (ITME-SERVER)

PostgreSQL läuft bereits auf dem Server:

```powershell
# Status prüfen
Get-Service postgresql*

# Falls nicht gestartet
Start-Service postgresql-x64-18
```

**Verbindungsdaten:**

```
Host: ITME-SERVER (oder localhost auf dem Server)
Port: 5432
Datenbank: ElectroVault_Dev
User: ElectroVault_dev_user
Passwort: password
```

**Datenbank erstellen (falls noch nicht vorhanden):**

```sql
-- Als postgres Admin verbinden
psql -U postgres

-- Datenbank erstellen
CREATE DATABASE "ElectroVault_Dev";

-- Benutzer erstellen
CREATE USER "ElectroVault_dev_user" WITH PASSWORD 'password';

-- Berechtigungen vergeben
GRANT ALL PRIVILEGES ON DATABASE "ElectroVault_Dev" TO "ElectroVault_dev_user";

-- Verbindung zur neuen Datenbank
\c ElectroVault_Dev

-- Schema-Berechtigungen
GRANT ALL ON SCHEMA public TO "ElectroVault_dev_user";
```

### Variante B: Docker (Lokale Entwicklung)

Falls du auf einem anderen Rechner entwickelst:

```bash
# PostgreSQL Container starten
docker-compose --profile local-dev up -d postgres

# Warten bis PostgreSQL bereit ist
docker-compose logs -f postgres
```

### Verbindung testen

```bash
# Windows (mit psql installiert)
psql -h ITME-SERVER -U "ElectroVault_dev_user" -d "ElectroVault_Dev"

# Oder mit Docker
docker exec -it electrovault-postgres psql -U "ElectroVault_dev_user" -d "ElectroVault_Dev"
```

## Keycloak Setup

Keycloak wird für Authentifizierung und Autorisierung verwendet.

### Container starten (falls noch nicht aktiv)

```bash
# Keycloak Container starten
docker-compose --profile local-dev up -d keycloak

# Logs prüfen
docker-compose logs -f keycloak
```

**Warte bis Keycloak vollständig gestartet ist (ca. 30-60 Sekunden).**

### Admin Console öffnen

1. Browser öffnen: http://ITME-SERVER:8080/admin
2. Login:
   - Username: `admin`
   - Password: `admin123`

### Realm importieren (Empfohlen)

Verwende den vorkonfigurierten Realm für schnelles Setup:

1. In der Admin Console: **Add Realm** klicken
2. **Import** auswählen
3. Datei wählen: `docker/keycloak/realm-export.json`
4. **Create** klicken

**Der Realm enthält bereits:**
- Rollen: admin, moderator, contributor, viewer
- Clients: electrovault-web, electrovault-api
- Testbenutzer: evadmin, testuser

### Client Secret abrufen

Nach dem Realm-Import:

1. **Clients** → **electrovault-web** öffnen
2. **Credentials** Tab öffnen
3. **Client Secret** kopieren
4. In `.env.local` eintragen (siehe unten)

### Testbenutzer

| Username | Passwort | Rolle | Verwendung |
|----------|----------|-------|------------|
| evadmin | admin123 | admin | Vollzugriff |
| testuser | test123 | contributor | Standard-Benutzer |

## MinIO Setup

MinIO ist ein S3-kompatibler Object Storage für Dateien.

### Container starten

```bash
# MinIO starten
docker-compose --profile local-dev up -d minio minio-init

# Logs prüfen
docker-compose logs -f minio
```

Der `minio-init` Container erstellt automatisch den Bucket `electrovault-files`.

### MinIO Console öffnen

1. Browser öffnen: http://ITME-SERVER:9001
2. Login:
   - Username: `minioadmin`
   - Password: `minioadmin123`

### Bucket prüfen

Nach dem Start sollte der Bucket `electrovault-files` existieren:

1. In der Console: **Buckets** öffnen
2. Bucket `electrovault-files` sollte sichtbar sein
3. Access Policy: **download** (public read)

### Alternative: Bucket manuell erstellen

Falls der Bucket nicht existiert:

```bash
# MinIO Client alias einrichten
mc alias set local http://ITME-SERVER:9000 minioadmin minioadmin123

# Bucket erstellen
mc mb local/electrovault-files

# Public Read Policy setzen
mc anonymous set download local/electrovault-files
```

## Environment-Variablen

ElectroVault verwendet `.env.local` für sensible Daten (wird NICHT committed).

### .env.local erstellen

Kopiere die Template-Datei und passe sie an:

```bash
# Im Projekt-Root
cp .env.example .env.local
```

### Minimale .env.local

Bearbeite `.env.local` mit folgenden Werten:

```bash
# === PostgreSQL ===
DATABASE_HOST=ITME-SERVER
DATABASE_PORT=5432
DATABASE_NAME=ElectroVault_Dev
DATABASE_USER=ElectroVault_dev_user
DATABASE_PASSWORD=password
DATABASE_URL="postgresql://ElectroVault_dev_user:password@ITME-SERVER:5432/ElectroVault_Dev?schema=public"

# === Keycloak ===
KEYCLOAK_URL=http://ITME-SERVER:8080
KEYCLOAK_REALM=electrovault
KEYCLOAK_CLIENT_ID=electrovault-web
KEYCLOAK_CLIENT_SECRET=<dein-client-secret-aus-keycloak>
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin123

# === MinIO ===
MINIO_ENDPOINT=ITME-SERVER
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET=electrovault-files
MINIO_USE_SSL=false
MINIO_PUBLIC_URL=http://ITME-SERVER:9000

# === Next.js ===
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generiere-mit-openssl>

# === Fastify API ===
API_PORT=3001
API_HOST=0.0.0.0
NODE_ENV=development
```

### NEXTAUTH_SECRET generieren

```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Bash/Linux/Mac
openssl rand -base64 32
```

Ergebnis in `.env.local` unter `NEXTAUTH_SECRET` eintragen.

## Erste Schritte

### 1. Repository klonen

```bash
git clone https://github.com/Sniperheart96/ElectroVault.git
cd ElectroVault
```

### 2. Dependencies installieren

```bash
pnpm install
```

Dies installiert alle Abhängigkeiten für das gesamte Monorepo.

### 3. Prisma Client generieren

```bash
pnpm db:generate
```

Generiert den Prisma Client basierend auf dem Schema.

### 4. Datenbank-Migrationen ausführen

```bash
pnpm db:migrate
```

Erstellt alle Tabellen in der Datenbank.

### 5. Seed-Daten laden (Optional)

```bash
pnpm db:seed
```

Lädt Beispieldaten für Kategorien, Hersteller, Gehäuseformen etc.

### 6. Development-Server starten

```bash
pnpm dev
```

Startet:
- **Frontend** auf http://localhost:3000
- **API** auf http://localhost:3001

**Wichtig:** Beim ersten Start kann es 10-30 Sekunden dauern, bis alle Services bereit sind.

### 7. Im Browser öffnen

- **Frontend:** http://localhost:3000
- **API Health:** http://localhost:3001/health
- **Keycloak:** http://ITME-SERVER:8080
- **MinIO Console:** http://ITME-SERVER:9001

## Projekt-Struktur

```
ElectroVault/
├── apps/
│   ├── web/              # Next.js Frontend
│   └── api/              # Fastify Backend
├── packages/
│   ├── database/         # Prisma Schema & Migrationen
│   ├── schemas/          # Zod Validierung (shared)
│   ├── auth/             # Keycloak/NextAuth Wrapper
│   ├── ui/               # shadcn/ui Komponenten
│   └── shared/           # Utils, Types, Constants
├── docker/               # Container-Configs
│   ├── keycloak/         # Realm Export
│   └── minio/            # Bucket Setup
├── docs/                 # Dokumentation
└── .env.local            # Lokale Credentials (gitignored)
```

## Häufige Befehle

### Development

```bash
pnpm dev                  # Alle Apps starten (Frontend + API)
pnpm build                # Production Build
pnpm lint                 # ESLint ausführen
pnpm format               # Code formatieren (Prettier)
pnpm test                 # Alle Tests ausführen
```

### Datenbank

```bash
pnpm db:generate          # Prisma Client generieren
pnpm db:migrate           # Neue Migration erstellen & ausführen
pnpm db:seed              # Seed-Daten laden
pnpm db:studio            # Prisma Studio öffnen (DB GUI)
pnpm db:reset             # Datenbank zurücksetzen (VORSICHT!)
```

### Tests

```bash
pnpm test                 # Unit Tests ausführen
pnpm test:watch           # Tests im Watch-Mode
pnpm test:ui              # Vitest UI öffnen
pnpm test:coverage        # Test Coverage generieren
pnpm test:e2e             # Playwright E2E Tests
```

### Docker

```bash
# Alle Services starten
docker-compose --profile local-dev up -d

# Services stoppen
docker-compose --profile local-dev down

# Logs anzeigen
docker-compose logs -f

# Einzelne Services
docker-compose up -d postgres
docker-compose up -d keycloak
docker-compose up -d minio
```

## Port-Belegung prüfen

Falls ein Port bereits belegt ist:

```powershell
# Windows (PowerShell)
netstat -ano | findstr ":3000 :3001 :5432 :8080 :9000"

# Prozess beenden (ersetze <PID> mit der Prozess-ID)
Stop-Process -Id <PID> -Force
```

**Wichtig:** Vor `pnpm dev` immer alte Development-Server beenden, um Port-Konflikte zu vermeiden.

## Häufige Probleme & Lösungen

### Problem: "Port 3000 already in use"

**Lösung:**

```powershell
# Prozess auf Port 3000 finden
netstat -ano | findstr ":3000"

# Prozess beenden (PID aus netstat)
Stop-Process -Id <PID> -Force
```

### Problem: "Database connection failed"

**Mögliche Ursachen:**

1. PostgreSQL läuft nicht:

```powershell
Get-Service postgresql*
Start-Service postgresql-x64-18
```

2. Falsche Credentials in `.env.local`:

```bash
# Prüfe DATABASE_URL
echo $env:DATABASE_URL  # PowerShell
```

3. Datenbank existiert nicht:

```sql
psql -U postgres
CREATE DATABASE "ElectroVault_Dev";
```

### Problem: "Invalid redirect URI" bei Keycloak-Login

**Lösung:**

1. Keycloak Admin Console öffnen
2. **Clients** → **electrovault-web** → **Settings**
3. **Valid Redirect URIs** prüfen:
   - `http://localhost:3000/*`
   - `http://ITME-SERVER:3000/*`
4. **Save** klicken

### Problem: "MinIO Access Denied"

**Lösung:**

1. Access Keys prüfen in `.env.local`:

```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
```

2. Bucket-Policy prüfen:

```bash
mc anonymous get local/electrovault-files
# Sollte: download (public read)
```

### Problem: "Prisma Client not generated"

**Lösung:**

```bash
pnpm db:generate
```

Oder falls das nicht hilft:

```bash
# Prisma Cache löschen
rm -rf node_modules/.prisma
pnpm db:generate
```

### Problem: "NEXTAUTH_SECRET is not set"

**Lösung:**

```bash
# Secret generieren (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# In .env.local eintragen
NEXTAUTH_SECRET=<generierter-wert>
```

### Problem: Docker-Container startet nicht

**Lösung:**

```bash
# Logs prüfen
docker-compose logs keycloak
docker-compose logs minio

# Container neu starten
docker-compose --profile local-dev down
docker-compose --profile local-dev up -d

# Container-Status prüfen
docker ps -a
```

### Problem: pnpm Befehle funktionieren nicht

**Mögliche Ursachen:**

1. Falsches Verzeichnis:

```bash
# Stelle sicher, dass du im Projekt-Root bist
cd C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault
```

2. pnpm nicht installiert:

```bash
npm install -g pnpm@9.15.0
```

3. Node-Version zu alt:

```bash
node --version  # Sollte >= 20.0.0 sein
```

## Entwicklungstools

### Prisma Studio

Datenbank-GUI zum Anzeigen und Bearbeiten von Daten:

```bash
pnpm db:studio
```

Öffnet Prisma Studio auf http://localhost:5555

### pgAdmin (Windows)

Falls PostgreSQL nativ installiert ist, kann pgAdmin verwendet werden:

1. pgAdmin öffnen
2. Server "Development" verbinden
3. Database: `ElectroVault_Dev`

### VSCode Extensions (Empfohlen)

- **Prisma** - Syntax Highlighting für Schema
- **ESLint** - Code Linting
- **Prettier** - Code Formatierung
- **Tailwind CSS IntelliSense** - Tailwind Autocomplete
- **Thunder Client** - API Testing

## Next Steps

Nach dem Setup:

1. **Dokumentation lesen:**
   - [docs/README.md](../README.md) - Projektübersicht
   - [docs/architecture/tech-stack.md](../architecture/tech-stack.md) - Tech Stack Details
   - [docs/phases/](../phases/) - Implementierungs-Phasen

2. **Ersten Beitrag erstellen:**
   - Testbenutzer anlegen (evadmin / admin123)
   - Core Component erstellen
   - Manufacturer Part hinzufügen

3. **Tests ausführen:**
   ```bash
   pnpm test
   pnpm test:e2e
   ```

4. **Erste Changes committen:**
   ```bash
   git checkout -b feature/mein-erstes-feature
   git add .
   git commit -m "feat: Mein erstes Feature"
   ```

## Hilfe & Support

- **Dokumentation:** [docs/README.md](../README.md)
- **GitHub Issues:** https://github.com/Sniperheart96/ElectroVault/issues
- **Keycloak Docs:** https://www.keycloak.org/documentation
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
