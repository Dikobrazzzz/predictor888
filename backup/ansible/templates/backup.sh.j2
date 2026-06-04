#!/bin/sh
set -e

BACKUP_DIR="/backups"
RETAIN_DAYS=7

mkdir -p "$BACKUP_DIR"

while true; do
    STAMP=$(date +%Y%m%d_%H%M%S)
    FILE="$BACKUP_DIR/${PGDATABASE}_${STAMP}.dump"

    echo "$(date -Iseconds) Starting backup -> $FILE"
    pg_dump -Fc -f "$FILE"
    echo "$(date -Iseconds) Backup complete: $(du -h "$FILE" | cut -f1)"

    find "$BACKUP_DIR" -name "*.dump" -mtime +$RETAIN_DAYS -delete
    echo "$(date -Iseconds) Cleaned backups older than ${RETAIN_DAYS} days"

    sleep 86400
done
