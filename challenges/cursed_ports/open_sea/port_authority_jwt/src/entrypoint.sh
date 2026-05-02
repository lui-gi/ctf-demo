#!/bin/sh
# entrypoint.sh — start the port-authority app.

set -eu

if [ -z "${JWT_SECRET:-}" ]; then
  echo "[entrypoint] FATAL: JWT_SECRET env var must be set." >&2
  exit 1
fi

exec node /app/app.js
