# Docker Setup für ElectroVault

## Übersicht

Diese Docker-Konfiguration dient primär zur **lokalen Entwicklung** auf Rechnern ohne direkten Zugriff auf den ITME-SERVER.

Auf dem **ITME-SERVER selbst** laufen die Services bereits nativ:
- PostgreSQL (Port 5432)
- Keycloak (Port 8080)
- MinIO (Port 9000/9001)

## Verwendung

### Lokale Entwicklung (komplettes Stack)

```bash
# Kopiere .env.example zu .env
cp .env.example .env

# Starte alle Services
docker-compose --profile local-dev up -d

# Logs anzeigen
docker-compose logs -f

# Stoppen
docker-compose --profile local-dev down
```

### Nur einzelne Services starten

```bash
# Nur MinIO
docker-compose up -d minio minio-init

# Nur Keycloak
docker-compose up -d keycloak
```

## Service-URLs (lokal)

- **PostgreSQL**: `localhost:5432`
- **Keycloak Admin**: http://localhost:8080
- **MinIO Console**: http://localhost:9001
- **MinIO API**: http://localhost:9000

## ITME-SERVER URLs (Remote)

Wenn du vom Entwicklungsrechner auf den Server zugreifst:

- **PostgreSQL**: `ITME-SERVER:5432`
- **Keycloak Admin**: http://ITME-SERVER:8080
- **MinIO Console**: http://ITME-SERVER:9001
- **MinIO API**: http://ITME-SERVER:9000

## Troubleshooting

### Ports bereits belegt

Wenn Ports bereits belegt sind, ändere sie in der `docker-compose.yml`:

```yaml
ports:
  - "15432:5432"  # PostgreSQL auf Port 15432
```

### MinIO Bucket nicht erstellt

Manuell erstellen:

```bash
docker exec -it electrovault-minio mc alias set local http://localhost:9000 minioadmin minioadmin_ElectroVault_2024!
docker exec -it electrovault-minio mc mb local/electrovault-files
```

### Keycloak startet nicht

Prüfe ob PostgreSQL läuft:

```bash
docker-compose logs postgres
```
