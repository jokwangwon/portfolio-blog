#!/usr/bin/env bash
# Read-only export of the existing portal DB. Never sources .env or prints credentials.
set -euo pipefail
umask 077
project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${1:-$project_root/backups}"
mkdir -p -- "$backup_dir"
backup_file="$(mktemp "$backup_dir/portal-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX.dump.partial")"
if docker exec portal-db sh -c 'exec pg_dump --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$backup_file"; then
  completed_file="${backup_file%.partial}"
  mv -- "$backup_file" "$completed_file"
  printf 'Backup created: %s\n' "$completed_file"
else
  printf 'Backup failed; incomplete archive retained at %s\n' "$backup_file" >&2
  exit 1
fi

# DB first, then immutable attachment files. Unattached uploads may also be included.
if docker exec portfolio-api-server test -d /app/data/attachments; then
  attachment_file="${completed_file%.dump}.attachments.tar.gz"
  if docker exec portfolio-api-server tar -C /app/data/attachments -czf - . > "$attachment_file.partial"; then
    mv -- "$attachment_file.partial" "$attachment_file"
    printf 'Attachment backup created: %s\n' "$attachment_file"
  else
    printf 'Attachment backup failed; DB dump retained: %s\n' "$completed_file" >&2
    exit 1
  fi
else
  printf 'Attachment directory not present; database backup only.\n'
fi
