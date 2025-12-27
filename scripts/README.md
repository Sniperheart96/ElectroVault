# Database Scripts

PowerShell-Scripts für die PostgreSQL-Datenbank-Administration.

## Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `setup-database.ps1` | Erstellt Datenbank und User (einmalig) |
| `test-db-connection.ps1` | Testet die PostgreSQL-Verbindung |
| `check-database.ps1` | Prüft ob Datenbank existiert |
| `grant-createdb.ps1` | Gibt CREATEDB-Rechte für Prisma Shadow DB |
| `kill-db-connections.ps1` | Beendet alle Verbindungen zur DB |
| `create-migration.ps1` | Erstellt eine neue Prisma-Migration |

## Verwendung

```powershell
# Initiales Setup (einmalig)
.\scripts\setup-database.ps1

# Verbindung testen
.\scripts\test-db-connection.ps1

# Bei Prisma-Migrationsfehlern
.\scripts\grant-createdb.ps1
.\scripts\kill-db-connections.ps1
```

## Voraussetzungen

- PostgreSQL 15+ muss laufen (localhost:5432)
- Admin-Passwort in `.env.local` unter `POSTGRES_ADMIN_PASSWORD`
- psql.exe muss installiert sein (`C:\Program Files\PostgreSQL\18\bin\`)

## Hinweis

Diese Scripts lesen das Admin-Passwort aus `.env.local` und setzen die `PGPASSWORD` Umgebungsvariable automatisch.
