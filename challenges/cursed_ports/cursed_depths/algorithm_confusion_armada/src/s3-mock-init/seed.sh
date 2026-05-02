#!/bin/sh
# Seed minio with the 'sealed' bucket and the manifest.txt object containing
# the flag. Runs as a one-shot init container against the minio service.

set -eu

mc alias set local "${S3_ENDPOINT:-http://s3-mock:9000}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"
mc mb -p local/sealed
if [ -z "${ARMADA_FLAG:-}" ]; then
  echo "[seed.sh] FATAL: ARMADA_FLAG env var must be set (no default)" >&2
  exit 1
fi
echo -n "$ARMADA_FLAG" | mc pipe local/sealed/manifest.txt
mc ls local/sealed
echo "[s3-mock-init] seeded sealed/manifest.txt"
