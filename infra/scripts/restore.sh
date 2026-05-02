#!/usr/bin/env bash
# =========================================================================
# restore.sh — operator restore from MinIO/S3 backup.
#
# Usage:
#   ./restore.sh list                       # show available backups
#   ./restore.sh restore <backup-key> [target-db-url]
#
# Defaults:
#   target-db-url = $RESTORE_TARGET_DB_URL or the staging DB. Refuses to
#   restore over the production DB unless RESTORE_FORCE_PROD=1.
#
# Required env (operator sets via direnv / vault / kubectl exec):
#   S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET (default progctf-backups)
#   RESTORE_TARGET_DB_URL (postgres URL of the DB to restore into)
#
# This script intentionally has zero hidden behavior. Read it before running.
# =========================================================================
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-progctf-backups}"
S3_ENDPOINT="${S3_ENDPOINT:-http://minio.progctf-fleet.svc.cluster.local:9000}"
S3_ACCESS_KEY="${S3_ACCESS_KEY:?S3_ACCESS_KEY required}"
S3_SECRET_KEY="${S3_SECRET_KEY:?S3_SECRET_KEY required}"

require_tool() {
  command -v "$1" >/dev/null 2>&1 || { echo >&2 "missing required tool: $1"; exit 2; }
}

require_tool mc
require_tool pg_restore
require_tool gunzip

mc alias set restore-s3 "$S3_ENDPOINT" "$S3_ACCESS_KEY" "$S3_SECRET_KEY" >/dev/null

cmd="${1:-}"

case "$cmd" in
  list)
    echo "Available backups in s3://${S3_BUCKET}/postgres/ (newest last):"
    mc ls --recursive "restore-s3/${S3_BUCKET}/postgres/" \
      | sort -k1,2
    ;;

  restore)
    key="${2:?backup key required, e.g. postgres/progctf_20251201T020000Z.sql.gz}"
    target_db_url="${3:-${RESTORE_TARGET_DB_URL:-}}"
    [ -n "$target_db_url" ] || { echo >&2 "no target DB URL (arg 3 or RESTORE_TARGET_DB_URL)"; exit 2; }

    # Refuse prod unless explicitly forced.
    if [[ "$target_db_url" == *"@postgres.progctf-fleet"* ]] && [ "${RESTORE_FORCE_PROD:-0}" != "1" ]; then
      echo >&2 "target looks like production. Set RESTORE_FORCE_PROD=1 to confirm."
      exit 3
    fi

    workdir="$(mktemp -d)"
    trap 'rm -rf "$workdir"' EXIT

    echo "[1/4] downloading ${key} ..."
    mc cp "restore-s3/${S3_BUCKET}/${key}" "${workdir}/dump.sql.gz"

    echo "[2/4] decompressing ..."
    gunzip "${workdir}/dump.sql.gz"

    echo "[3/4] restoring into ${target_db_url} ..."
    pg_restore \
      --dbname="${target_db_url}" \
      --clean --if-exists \
      --no-owner --no-privileges \
      --jobs=4 \
      --verbose \
      "${workdir}/dump.sql"

    echo "[4/4] smoke test: counting key tables ..."
    psql "${target_db_url}" -c "
      SELECT 'pirates' AS t, count(*) FROM pirates
      UNION ALL SELECT 'crews', count(*) FROM crews
      UNION ALL SELECT 'islands', count(*) FROM islands
      UNION ALL SELECT 'submissions', count(*) FROM submissions
      ORDER BY t;
    "

    echo "restore OK"
    ;;

  *)
    cat >&2 <<EOF
usage:
  $0 list
  $0 restore <backup-key> [target-db-url]

Examples:
  $0 list
  $0 restore postgres/progctf_20251201T020000Z.sql.gz \\
            postgres://progctf:****@postgres.staging.svc.cluster.local:5432/progctf
EOF
    exit 1
    ;;
esac
