# ElectroVault - Datenbank-Status pruefen
# Prueft ob Datenbank und User korrekt eingerichtet sind

$ErrorActionPreference = "Stop"

Write-Host "=== ElectroVault Database Check ===" -ForegroundColor Cyan
Write-Host ""

# Lade .env.local
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env.local nicht gefunden!" -ForegroundColor Red
    Write-Host "Gesucht: $envFile" -ForegroundColor Yellow
    exit 1
}

# Parse DATABASE_URL
$content = Get-Content $envFile -Raw
if ($content -match 'DATABASE_URL="postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?"]+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]

    Write-Host "Database: $dbName" -ForegroundColor Green
    Write-Host "User: $dbUser" -ForegroundColor Green
    $hostPort = "$dbHost`:$dbPort"
    Write-Host "Host: $hostPort" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "ERROR: DATABASE_URL konnte nicht geparst werden!" -ForegroundColor Red
    exit 1
}

# Parse POSTGRES_ADMIN credentials
if ($content -match 'POSTGRES_ADMIN_USER=(.+)') {
    $adminUser = $matches[1].Trim()
}
if ($content -match 'POSTGRES_ADMIN_PASSWORD=(.+)') {
    $adminPassword = $matches[1].Trim()
}

if (-not $adminUser -or -not $adminPassword) {
    Write-Host "ERROR: Admin credentials nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Pruefe ob psql verfuegbar ist
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "WARNING: psql nicht gefunden. Installiere PostgreSQL Client Tools." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternativ: Oeffne pgAdmin und pruefe manuell:" -ForegroundColor Cyan
    Write-Host "  1. Existiert die Datenbank '$dbName'?" -ForegroundColor White
    Write-Host "  2. Hat der User '$dbUser' Zugriff darauf?" -ForegroundColor White
    exit 0
}

Write-Host "Pruefe Datenbank-Verbindung..." -ForegroundColor Cyan

# Setze PGPASSWORD fuer non-interactive Ausfuehrung
$env:PGPASSWORD = $adminPassword

# Pruefe ob Datenbank existiert
$checkDb = psql -h $dbHost -p $dbPort -U $adminUser -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Kann nicht mit PostgreSQL verbinden!" -ForegroundColor Red
    Write-Host $checkDb -ForegroundColor Red
    exit 1
}

if ($checkDb -eq "1") {
    Write-Host "[OK] Datenbank '$dbName' existiert" -ForegroundColor Green
} else {
    Write-Host "[FEHLT] Datenbank '$dbName' existiert NICHT" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fuehre aus: .\scripts\setup-database.ps1" -ForegroundColor Yellow
    exit 1
}

# Pruefe ob User existiert
$checkUser = psql -h $dbHost -p $dbPort -U $adminUser -tAc "SELECT 1 FROM pg_roles WHERE rolname='$dbUser';" 2>&1

if ($checkUser -eq "1") {
    Write-Host "[OK] User '$dbUser' existiert" -ForegroundColor Green
} else {
    Write-Host "[FEHLT] User '$dbUser' existiert NICHT" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fuehre aus: .\scripts\setup-database.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Alles OK! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Naechster Schritt: Migration erstellen" -ForegroundColor Cyan
$dbUrlForMigrate = "postgresql://$dbUser`:$dbPassword@$dbHost`:$dbPort/$dbName?schema=public"
Write-Host "  `$env:DATABASE_URL=`"$dbUrlForMigrate`"" -ForegroundColor White
Write-Host "  pnpm db:migrate" -ForegroundColor White
