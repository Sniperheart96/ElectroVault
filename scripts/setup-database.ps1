# ElectroVault - Datenbank Setup
# Erstellt die Datenbank und den User fuer die Entwicklung

$ErrorActionPreference = "Stop"

Write-Host "=== ElectroVault Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Lade Admin-Passwort aus .env.local
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match 'POSTGRES_ADMIN_PASSWORD=(.+)') {
        $adminPassword = $matches[1].Trim()
        Write-Host "Admin-Passwort aus .env.local geladen" -ForegroundColor Green
    }
}

if (-not $adminPassword) {
    Write-Host "ERROR: POSTGRES_ADMIN_PASSWORD nicht in .env.local gefunden!" -ForegroundColor Red
    exit 1
}

# Konfiguration (lowercase fuer PostgreSQL Kompatibilitaet)
$dbName = "electrovault_dev"
$dbUser = "electrovault_dev_user"
$dbPassword = "password"
$adminUser = "postgres"
$dbHost = "localhost"
$dbPort = "5432"

# PostgreSQL bin Pfad finden
$pgPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "PostgreSQL gefunden: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Setze PGPASSWORD fuer non-interactive Ausfuehrung
$env:PGPASSWORD = $adminPassword

Write-Host ""
Write-Host "1. Pruefe Verbindung..." -ForegroundColor Cyan

$testConn = & $psqlPath -h $dbHost -p $dbPort -U $adminUser -tAc "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Kann nicht mit PostgreSQL verbinden!" -ForegroundColor Red
    Write-Host $testConn -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Verbindung erfolgreich" -ForegroundColor Green

Write-Host ""
Write-Host "2. Pruefe ob Datenbank existiert..." -ForegroundColor Cyan

$checkDb = & $psqlPath -h $dbHost -p $dbPort -U $adminUser -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName';"

if ($checkDb -and $checkDb.Trim() -eq "1") {
    Write-Host "[OK] Datenbank '$dbName' existiert bereits" -ForegroundColor Green
} else {
    Write-Host "Erstelle Datenbank '$dbName'..." -ForegroundColor Yellow
    & $psqlPath -h $dbHost -p $dbPort -U $adminUser -c "CREATE DATABASE $dbName;"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Datenbank erstellt" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Konnte Datenbank nicht erstellen!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "3. Pruefe ob User existiert..." -ForegroundColor Cyan

$checkUser = & $psqlPath -h $dbHost -p $dbPort -U $adminUser -tAc "SELECT 1 FROM pg_roles WHERE rolname='$dbUser';"

if ($checkUser -and $checkUser.Trim() -eq "1") {
    Write-Host "[OK] User '$dbUser' existiert bereits" -ForegroundColor Green
} else {
    Write-Host "Erstelle User '$dbUser'..." -ForegroundColor Yellow
    & $psqlPath -h $dbHost -p $dbPort -U $adminUser -c "CREATE USER $dbUser WITH PASSWORD '$dbPassword';"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] User erstellt" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Konnte User nicht erstellen!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "4. Setze Berechtigungen..." -ForegroundColor Cyan

& $psqlPath -h $dbHost -p $dbPort -U $adminUser -c "GRANT ALL PRIVILEGES ON DATABASE $dbName TO $dbUser;" 2>$null
& $psqlPath -h $dbHost -p $dbPort -U $adminUser -d $dbName -c "GRANT ALL ON SCHEMA public TO $dbUser;" 2>$null
& $psqlPath -h $dbHost -p $dbPort -U $adminUser -d $dbName -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $dbUser;" 2>$null
& $psqlPath -h $dbHost -p $dbPort -U $adminUser -d $dbName -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $dbUser;" 2>$null
& $psqlPath -h $dbHost -p $dbPort -U $adminUser -d $dbName -c "GRANT CREATE ON SCHEMA public TO $dbUser;" 2>$null

Write-Host "[OK] Berechtigungen gesetzt" -ForegroundColor Green

Write-Host ""
Write-Host "=== Setup abgeschlossen! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host "  1. pnpm db:migrate    # Migration ausfuehren" -ForegroundColor White
Write-Host "  2. pnpm db:seed       # Seed-Daten laden" -ForegroundColor White
Write-Host "  3. pnpm test          # Tests ausfuehren" -ForegroundColor White
Write-Host ""
