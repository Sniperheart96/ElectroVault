# ElectroVault - Erstelle initiale Prisma Migration
# Fuehrt prisma migrate dev aus mit korrekten Credentials

$ErrorActionPreference = "Stop"

Write-Host "=== ElectroVault Migration Erstellen ===" -ForegroundColor Cyan
Write-Host ""

# Zum Projektverzeichnis wechseln
$projectRoot = "C:\Users\Administrator.ITME-SERVER\Documents\Projekte\ElectroVault"
if (!(Test-Path $projectRoot)) {
    Write-Host "ERROR: Projekt nicht gefunden: $projectRoot" -ForegroundColor Red
    Write-Host "Bitte passe den Pfad in diesem Script an!" -ForegroundColor Yellow
    exit 1
}

cd $projectRoot
Write-Host "Arbeitsverzeichnis: $projectRoot" -ForegroundColor Green

# DATABASE_URL setzen
$env:DATABASE_URL = "postgresql://postgres:admin123@ITME-SERVER:5432/ElectroVault_Dev?schema=public"
Write-Host "DATABASE_URL gesetzt" -ForegroundColor Green
Write-Host ""

# Migration erstellen
Write-Host "Erstelle Migration..." -ForegroundColor Cyan
cd packages\database
npx prisma migrate dev --name init --create-only

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Migration erfolgreich erstellt! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Naechste Schritte:" -ForegroundColor Cyan
    Write-Host "1. git add ." -ForegroundColor White
    Write-Host "2. git commit -m 'feat: Add initial Prisma migration'" -ForegroundColor White
    Write-Host "3. git push" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "=== FEHLER beim Erstellen der Migration ===" -ForegroundColor Red
    exit 1
}
