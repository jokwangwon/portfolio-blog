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
