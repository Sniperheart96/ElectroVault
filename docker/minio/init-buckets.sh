#!/bin/sh
# MinIO Bucket Initialisierung für ElectroVault

set -e

# Warte bis MinIO bereit ist
until mc alias set local http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}; do
  echo "Waiting for MinIO to be ready..."
  sleep 2
done

echo "MinIO is ready. Creating buckets..."

# Erstelle Bucket
mc mb local/electrovault-files --ignore-existing

# Setze Public Download Policy für öffentliche Dateien
mc anonymous set download local/electrovault-files

# Erstelle Verzeichnisstruktur (optional - wird automatisch erstellt beim Upload)
echo "Creating directory structure..."

# Lifecycle Policy (optional - löscht alte Versionen nach 90 Tagen)
# mc ilm add local/electrovault-files --noncurrent-expire-days 90

echo "Bucket 'electrovault-files' successfully created and configured!"
echo "Access via: http://ITME-SERVER:9000/electrovault-files"
